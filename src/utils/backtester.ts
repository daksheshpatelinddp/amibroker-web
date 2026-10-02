import {
  BacktestSettings,
  CandleBar,
  EquityPoint,
  MonthlyReturn,
  RichPerformanceReport,
  Trade,
} from '../types/market';
import { executeAfl } from './aflEngine';
import {
  calculateATRTrailingStop,
  calculateBollingerBands,
  calculateDeliveryShock,
  calculateEMA,
  calculateRSI,
  calculateSMA,
  calculateSupertrend,
} from './indicators';

/**
 * Filter candles by date range string (YYYY-MM-DD)
 */
export function filterCandlesByDateRange(
  candles: CandleBar[],
  startDate?: string,
  endDate?: string
): CandleBar[] {
  if (!candles || candles.length === 0) return [];
  return candles.filter((c) => {
    if (startDate && c.date < startDate) return false;
    if (endDate && c.date > endDate) return false;
    return true;
  });
}

/**
 * Helper to compute K-Ratio (AmiBroker metric: regression slope / standard error of slope * sqrt(252))
 */
function calculateKRatio(equityCurve: EquityPoint[]): number {
  const n = equityCurve.length;
  if (n < 5) return 0;
  // Calculate log equity
  const y = equityCurve.map((p) => Math.log(Math.max(1, p.equity)));
  const x = Array.from({ length: n }, (_, i) => i);
  const xMean = (n - 1) / 2;
  const yMean = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - xMean) * (y[i] - yMean);
    den += Math.pow(x[i] - xMean, 2);
  }
  const slope = den > 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;

  // Residual variance
  let resSumSq = 0;
  for (let i = 0; i < n; i++) {
    const fitted = intercept + slope * x[i];
    resSumSq += Math.pow(y[i] - fitted, 2);
  }
  const sErr = n > 2 ? Math.sqrt(resSumSq / (n - 2)) : 0;
  const stdErrSlope = den > 0 && sErr > 0 ? sErr / Math.sqrt(den) : 0;

  return stdErrSlope > 0 ? Number(((slope / stdErrSlope) * Math.sqrt(252)).toFixed(2)) : 0;
}

/**
 * Single-symbol simulation
 */
function runSingleSymbolSimulation(
  candles: CandleBar[],
  effectiveSettings: BacktestSettings,
  symbol: string,
  appliedOverrides: string[]
): RichPerformanceReport {
  if (candles.length < 20) {
    return createEmptyRichReport(effectiveSettings.initialCapital, appliedOverrides);
  }

  const closes = candles.map((c) => c.close);
  const fastPeriod = effectiveSettings.fastPeriod || 20;
  const slowPeriod = effectiveSettings.slowPeriod || 50;

  const emaFast = calculateEMA(closes, fastPeriod);
  const emaSlow = calculateEMA(closes, slowPeriod);
  const rsi = calculateRSI(closes, 14);
  const bb = calculateBollingerBands(closes, 20, 2);
  const { trend: supertrendState } = calculateSupertrend(candles, 10, 3);
  const delivShocks = calculateDeliveryShock(candles, 20);
  const atrTrail = calculateATRTrailingStop(candles, 14, 3);

  // Evaluate Custom AFL if selected
  let aflBuy: boolean[] = [];
  let aflSell: boolean[] = [];
  if (effectiveSettings.strategyName === 'CUSTOM_AFL' && effectiveSettings.customAflCode) {
    const aflRes = executeAfl(candles, effectiveSettings.customAflCode);
    if (aflRes.success) {
      aflBuy = aflRes.buySignals;
      aflSell = aflRes.sellSignals;
    }
  }

  const trades: Trade[] = [];
  let currentEquity = effectiveSettings.initialCapital;
  let activeTrade: {
    entryDate: string;
    entryPrice: number;
    shares: number;
    highestPrice: number;
    lowestPrice: number;
    entryBarIdx: number;
  } | null = null;

  const equityCurve: EquityPoint[] = [];
  let peakEquity = effectiveSettings.initialCapital;
  let maxDrawdownPct = 0;
  let maxDrawdownAmount = 0;
  let currentDrawdownBars = 0;
  let maxDrawdownDurationBars = 0;

  let totalBarsInTrade = 0;
  let totalBrokeragePaid = 0;
  let totalSlippageCost = 0;
  let totalSttPaid = 0;
  let totalStampDutyPaid = 0;
  let totalStcgPaid = 0;

  const benchmarkStartPrice = candles[0].close;

  for (let i = 15; i < candles.length; i++) {
    const curBar = candles[i];
    const prevBar = candles[i - 1];

    // 1. Process active trade exits
    if (activeTrade) {
      totalBarsInTrade++;
      activeTrade.highestPrice = Math.max(activeTrade.highestPrice, curBar.high);
      activeTrade.lowestPrice = Math.min(activeTrade.lowestPrice, curBar.low);

      const barsHeld = i - activeTrade.entryBarIdx;
      let exitReason: Trade['exitReason'] | null = null;
      let exitPrice = curBar.close;

      const stopLossPrice =
        effectiveSettings.stopLossPct > 0
          ? activeTrade.entryPrice * (1 - effectiveSettings.stopLossPct / 100)
          : 0;

      const targetPrice =
        effectiveSettings.profitTargetPct > 0
          ? activeTrade.entryPrice * (1 + effectiveSettings.profitTargetPct / 100)
          : Infinity;

      const trailingPrice =
        effectiveSettings.trailingStopPct > 0
          ? activeTrade.highestPrice * (1 - effectiveSettings.trailingStopPct / 100)
          : 0;

      // Target check (only if target > 0)
      if (effectiveSettings.profitTargetPct > 0 && curBar.high >= targetPrice) {
        exitReason = 'TARGET';
        exitPrice = targetPrice;
      }
      // Stop loss check (only if stop loss > 0)
      else if (effectiveSettings.stopLossPct > 0 && curBar.low <= stopLossPrice) {
        exitReason = 'STOP_LOSS';
        exitPrice = stopLossPrice;
      }
      // Trailing stop check (only if trailing stop > 0)
      else if (effectiveSettings.trailingStopPct > 0 && curBar.low <= trailingPrice) {
        exitReason = 'TRAILING_STOP';
        exitPrice = trailingPrice;
      }
      // Max holding bars check (only if maxHoldingBars > 0)
      else if (effectiveSettings.maxHoldingBars > 0 && barsHeld >= effectiveSettings.maxHoldingBars) {
        exitReason = 'MAX_BARS';
        exitPrice = curBar.close;
      }
      // Strategy exit signals
      else {
        const strat = effectiveSettings.strategyName;
        if (strat === 'CUSTOM_AFL') {
          if (aflSell[i]) {
            exitReason = 'SIGNAL_EXIT';
            exitPrice = curBar.close;
          }
        } else if (strat === 'EMA_CROSSOVER' && emaFast[i] !== null && emaSlow[i] !== null && emaFast[i - 1] !== null && emaSlow[i - 1] !== null) {
          if ((emaFast[i] as number) < (emaSlow[i] as number) && (emaFast[i - 1] as number) >= (emaSlow[i - 1] as number)) {
            exitReason = 'SIGNAL_EXIT';
            exitPrice = curBar.close;
          }
        } else if (strat === 'SUPERTREND' && supertrendState[i] === 'BEAR' && supertrendState[i - 1] === 'BULL') {
          exitReason = 'SIGNAL_EXIT';
          exitPrice = curBar.close;
        } else if (strat === 'RSI_MEAN_REVERSION' && rsi[i] !== null && (rsi[i] as number) > 68) {
          exitReason = 'SIGNAL_EXIT';
          exitPrice = curBar.close;
        } else if (strat === 'ATR_TRAILING_STOP' && atrTrail.longStop[i] !== null && curBar.close < (atrTrail.longStop[i] as number)) {
          exitReason = 'TRAILING_STOP';
          exitPrice = atrTrail.longStop[i] as number;
        }
      }

      if (exitReason !== null) {
        const slippage = exitPrice * (effectiveSettings.slippagePct / 100);
        totalSlippageCost += slippage * activeTrade.shares;
        const effectiveExitPrice = exitPrice - slippage;

        const grossPnl = (effectiveExitPrice - activeTrade.entryPrice) * activeTrade.shares;
        const brokerage = effectiveSettings.brokeragePerTrade * 2;
        totalBrokeragePaid += brokerage;

        // Taxes: STT (on exit), Stamp duty (on entry), STCG (on gain)
        const stt = (effectiveExitPrice * activeTrade.shares) * (effectiveSettings.sttTaxPct / 100);
        const stamp = (activeTrade.entryPrice * activeTrade.shares) * (effectiveSettings.stampDutyPct / 100);
        const stcg = grossPnl > 0 ? grossPnl * (effectiveSettings.stcgTaxPct / 100) : 0;

        totalSttPaid += stt;
        totalStampDutyPaid += stamp;
        totalStcgPaid += stcg;

        const netPnl = grossPnl - brokerage - stt - stamp - stcg;
        const returnPct = Number(((netPnl / (activeTrade.entryPrice * activeTrade.shares)) * 100).toFixed(2));

        currentEquity += netPnl;

        const maePct = Number((((activeTrade.entryPrice - activeTrade.lowestPrice) / activeTrade.entryPrice) * 100).toFixed(2));
        const mfePct = Number((((activeTrade.highestPrice - activeTrade.entryPrice) / activeTrade.entryPrice) * 100).toFixed(2));

        trades.push({
          id: `TR-${trades.length + 1}`,
          symbol,
          entryDate: activeTrade.entryDate,
          entryPrice: Number(activeTrade.entryPrice.toFixed(2)),
          exitDate: curBar.date,
          exitPrice: Number(effectiveExitPrice.toFixed(2)),
          shares: activeTrade.shares,
          pnl: Number(netPnl.toFixed(2)),
          returnPct,
          exitReason,
          barsHeld,
          highestPriceDuringTrade: Number(activeTrade.highestPrice.toFixed(2)),
          lowestPriceDuringTrade: Number(activeTrade.lowestPrice.toFixed(2)),
          maePct,
          mfePct,
        });

        activeTrade = null;
      }
    }

    // 2. Process Entry Signals if no active position
    if (!activeTrade) {
      let isBuySignal = false;
      const strat = effectiveSettings.strategyName;

      if (strat === 'CUSTOM_AFL') {
        isBuySignal = Boolean(aflBuy[i]);
      } else if (strat === 'EMA_CROSSOVER') {
        const eFast = emaFast[i];
        const eSlow = emaSlow[i];
        const pFast = emaFast[i - 1];
        const pSlow = emaSlow[i - 1];
        if (eFast !== null && eSlow !== null && pFast !== null && pSlow !== null) {
          isBuySignal = eFast > eSlow && pFast <= pSlow;
        }
      } else if (strat === 'SUPERTREND') {
        isBuySignal = supertrendState[i] === 'BULL' && supertrendState[i - 1] === 'BEAR';
      } else if (strat === 'DELIVERY_BREAKOUT') {
        const threshold = effectiveSettings.delivShockThreshold || 1.4;
        const delivShock = delivShocks[i] || 1;
        let highest20 = -Infinity;
        for (let j = 1; j <= 20; j++) {
          if (candles[i - j]) highest20 = Math.max(highest20, candles[i - j].high);
        }
        isBuySignal = delivShock >= threshold && curBar.close > highest20;
      } else if (strat === 'RSI_MEAN_REVERSION') {
        const threshold = effectiveSettings.rsiThreshold || 32;
        const curRsi = rsi[i];
        const prevRsi = rsi[i - 1];
        if (curRsi !== null && prevRsi !== null) {
          isBuySignal = prevRsi < threshold && curRsi >= threshold;
        }
      } else if (strat === 'BOLLINGER_SQUEEZE') {
        const upper = bb.upper[i];
        const prevUpper = bb.upper[i - 1];
        if (upper !== null && prevUpper !== null) {
          isBuySignal = curBar.close > upper && prevBar.close <= prevUpper;
        }
      } else if (strat === 'ATR_TRAILING_STOP') {
        const stop = atrTrail.longStop[i];
        const prevStop = atrTrail.longStop[i - 1];
        if (stop !== null && prevStop !== null) {
          isBuySignal = curBar.close > stop && prevBar.close <= prevStop;
        }
      }

      if (isBuySignal) {
        const slippage = curBar.close * (effectiveSettings.slippagePct / 100);
        totalSlippageCost += slippage;
        const effectiveEntryPrice = curBar.close + slippage;
        const posSizePct = effectiveSettings.positionSizePct > 0 ? effectiveSettings.positionSizePct : 20;
        const allocatedCapital = currentEquity * (posSizePct / 100);
        const shares = Math.floor(allocatedCapital / effectiveEntryPrice);

        if (shares > 0) {
          activeTrade = {
            entryDate: curBar.date,
            entryPrice: effectiveEntryPrice,
            shares,
            highestPrice: effectiveEntryPrice,
            lowestPrice: effectiveEntryPrice,
            entryBarIdx: i,
          };
        }
      }
    }

    // 3. Mark to market equity
    let markToMarketEquity = currentEquity;
    if (activeTrade) {
      const openPnl = (curBar.close - activeTrade.entryPrice) * activeTrade.shares;
      markToMarketEquity += openPnl;
    }

    if (markToMarketEquity > peakEquity) {
      peakEquity = markToMarketEquity;
      currentDrawdownBars = 0;
    } else {
      currentDrawdownBars++;
      if (currentDrawdownBars > maxDrawdownDurationBars) {
        maxDrawdownDurationBars = currentDrawdownBars;
      }
    }

    const dd = peakEquity > 0 ? ((peakEquity - markToMarketEquity) / peakEquity) * 100 : 0;
    const ddAmount = peakEquity - markToMarketEquity;
    if (dd > maxDrawdownPct) maxDrawdownPct = dd;
    if (ddAmount > maxDrawdownAmount) maxDrawdownAmount = ddAmount;

    const benchmarkEquity =
      benchmarkStartPrice > 0
        ? effectiveSettings.initialCapital * (curBar.close / benchmarkStartPrice)
        : effectiveSettings.initialCapital;

    equityCurve.push({
      date: curBar.date,
      equity: Number(markToMarketEquity.toFixed(2)),
      drawdownPct: Number(dd.toFixed(2)),
      benchmarkEquity: Number(benchmarkEquity.toFixed(2)),
      inTrade: activeTrade !== null,
    });
  }

  // Calculate statistics
  return compileReport({
    initialCapital: effectiveSettings.initialCapital,
    currentEquity,
    trades,
    equityCurve,
    totalBarsAnalyzed: Math.max(1, candles.length - 15),
    totalBarsInTrade,
    totalBrokeragePaid,
    totalSlippageCost,
    totalSttPaid,
    totalStampDutyPaid,
    totalStcgPaid,
    maxDrawdownPct,
    maxDrawdownAmount,
    maxDrawdownDurationBars,
    benchmarkStartPrice,
    benchmarkEndPrice: candles[candles.length - 1]?.close || benchmarkStartPrice,
    appliedOverrides,
  });
}

/**
 * Portfolio-Level Multi-Symbol Simulation across a basket/universe
 */
export function runPortfolioBacktest(
  allMarketData: Record<string, CandleBar[]>,
  candidateSymbols: string[],
  settings: BacktestSettings,
  appliedOverrides: string[]
): RichPerformanceReport {
  if (candidateSymbols.length === 0) {
    return createEmptyRichReport(settings.initialCapital, appliedOverrides);
  }

  // Filter candles per symbol by date range
  const filteredData: Record<string, CandleBar[]> = {};
  candidateSymbols.forEach((sym) => {
    const raw = allMarketData[sym];
    if (raw && raw.length > 0) {
      filteredData[sym] = filterCandlesByDateRange(raw, settings.startDate, settings.endDate);
    }
  });

  // Collect all unique dates across candidate symbols in chronological order
  const dateSet = new Set<string>();
  Object.values(filteredData).forEach((bars) => {
    bars.forEach((b) => dateSet.add(b.date));
  });
  const allDates = Array.from(dateSet).sort();

  if (allDates.length < 20) {
    return createEmptyRichReport(settings.initialCapital, appliedOverrides);
  }

  // Build candle date index map for fast lookup: map[symbol][date] = CandleBar
  const dateIndexMap: Record<string, Map<string, CandleBar>> = {};
  const precomputedAfl: Record<string, { buy: boolean[]; sell: boolean[]; score?: (number | null)[] }> = {};

  candidateSymbols.forEach((sym) => {
    const bars = filteredData[sym] || [];
    const map = new Map<string, CandleBar>();
    bars.forEach((b) => map.set(b.date, b));
    dateIndexMap[sym] = map;

    // Precompute AFL signals if custom AFL
    if (settings.strategyName === 'CUSTOM_AFL' && settings.customAflCode && bars.length > 15) {
      const res = executeAfl(bars, settings.customAflCode);
      if (res.success) {
        precomputedAfl[sym] = {
          buy: res.buySignals,
          sell: res.sellSignals,
          score: res.overrides?.positionScore,
        };
      }
    }
  });

  const maxPositions = settings.maxPositions > 0 ? settings.maxPositions : 5;
  const positionSizePct = settings.positionSizePct > 0 ? settings.positionSizePct : 100 / maxPositions;

  let cash = settings.initialCapital;
  const trades: Trade[] = [];
  const openPositions: Map<
    string,
    {
      symbol: string;
      entryDate: string;
      entryPrice: number;
      shares: number;
      highestPrice: number;
      lowestPrice: number;
      barsHeld: number;
    }
  > = new Map();

  const equityCurve: EquityPoint[] = [];
  let peakEquity = settings.initialCapital;
  let maxDrawdownPct = 0;
  let maxDrawdownAmount = 0;
  let currentDrawdownBars = 0;
  let maxDrawdownDurationBars = 0;

  let totalBarsInTrade = 0;
  let totalBrokeragePaid = 0;
  let totalSlippageCost = 0;
  let totalSttPaid = 0;
  let totalStampDutyPaid = 0;
  let totalStcgPaid = 0;

  // Track benchmark using first symbol
  const benchmarkSymbol = candidateSymbols[0];
  const benchmarkStartPrice = filteredData[benchmarkSymbol]?.[0]?.close || 1;

  for (let dIdx = 0; dIdx < allDates.length; dIdx++) {
    const currentDate = allDates[dIdx];

    // 1. Process exits for existing open positions on currentDate
    const exitedSymbols: string[] = [];

    openPositions.forEach((pos, sym) => {
      totalBarsInTrade++;
      const curBar = dateIndexMap[sym]?.get(currentDate);
      if (!curBar) return;

      pos.barsHeld++;
      pos.highestPrice = Math.max(pos.highestPrice, curBar.high);
      pos.lowestPrice = Math.min(pos.lowestPrice, curBar.low);

      let exitReason: Trade['exitReason'] | null = null;
      let exitPrice = curBar.close;

      const stopLossPrice = settings.stopLossPct > 0 ? pos.entryPrice * (1 - settings.stopLossPct / 100) : 0;
      const targetPrice = settings.profitTargetPct > 0 ? pos.entryPrice * (1 + settings.profitTargetPct / 100) : Infinity;
      const trailingPrice = settings.trailingStopPct > 0 ? pos.highestPrice * (1 - settings.trailingStopPct / 100) : 0;

      if (settings.profitTargetPct > 0 && curBar.high >= targetPrice) {
        exitReason = 'TARGET';
        exitPrice = targetPrice;
      } else if (settings.stopLossPct > 0 && curBar.low <= stopLossPrice) {
        exitReason = 'STOP_LOSS';
        exitPrice = stopLossPrice;
      } else if (settings.trailingStopPct > 0 && curBar.low <= trailingPrice) {
        exitReason = 'TRAILING_STOP';
        exitPrice = trailingPrice;
      } else if (settings.maxHoldingBars > 0 && pos.barsHeld >= settings.maxHoldingBars) {
        exitReason = 'MAX_BARS';
        exitPrice = curBar.close;
      } else {
        // Strategy signal exit
        if (settings.strategyName === 'CUSTOM_AFL') {
          const aflData = precomputedAfl[sym];
          const bars = filteredData[sym] || [];
          const bIdx = bars.findIndex((b) => b.date === currentDate);
          if (aflData && bIdx >= 0 && aflData.sell[bIdx]) {
            exitReason = 'SIGNAL_EXIT';
            exitPrice = curBar.close;
          }
        }
      }

      if (exitReason !== null) {
        exitedSymbols.push(sym);
        const slippage = exitPrice * (settings.slippagePct / 100);
        totalSlippageCost += slippage * pos.shares;
        const effectiveExitPrice = exitPrice - slippage;

        const grossPnl = (effectiveExitPrice - pos.entryPrice) * pos.shares;
        const brokerage = settings.brokeragePerTrade * 2;
        totalBrokeragePaid += brokerage;

        const stt = (effectiveExitPrice * pos.shares) * (settings.sttTaxPct / 100);
        const stamp = (pos.entryPrice * pos.shares) * (settings.stampDutyPct / 100);
        const stcg = grossPnl > 0 ? grossPnl * (settings.stcgTaxPct / 100) : 0;

        totalSttPaid += stt;
        totalStampDutyPaid += stamp;
        totalStcgPaid += stcg;

        const netPnl = grossPnl - brokerage - stt - stamp - stcg;
        const returnPct = Number(((netPnl / (pos.entryPrice * pos.shares)) * 100).toFixed(2));

        cash += pos.entryPrice * pos.shares + netPnl;

        const maePct = Number((((pos.entryPrice - pos.lowestPrice) / pos.entryPrice) * 100).toFixed(2));
        const mfePct = Number((((pos.highestPrice - pos.entryPrice) / pos.entryPrice) * 100).toFixed(2));

        trades.push({
          id: `TR-${trades.length + 1}`,
          symbol: sym,
          entryDate: pos.entryDate,
          entryPrice: Number(pos.entryPrice.toFixed(2)),
          exitDate: currentDate,
          exitPrice: Number(effectiveExitPrice.toFixed(2)),
          shares: pos.shares,
          pnl: Number(netPnl.toFixed(2)),
          returnPct,
          exitReason,
          barsHeld: pos.barsHeld,
          highestPriceDuringTrade: Number(pos.highestPrice.toFixed(2)),
          lowestPriceDuringTrade: Number(pos.lowestPrice.toFixed(2)),
          maePct,
          mfePct,
        });
      }
    });

    exitedSymbols.forEach((sym) => openPositions.delete(sym));

    // 2. Mark current portfolio equity before evaluating entries
    let currentPortfolioEquity = cash;
    openPositions.forEach((pos, sym) => {
      const curBar = dateIndexMap[sym]?.get(currentDate);
      const close = curBar ? curBar.close : pos.entryPrice;
      currentPortfolioEquity += close * pos.shares;
    });

    // 3. Scan candidate entries across symbols on currentDate
    const availableSlots = maxPositions - openPositions.size;
    if (availableSlots > 0 && cash > 1000) {
      const candidateTriggers: { symbol: string; score: number; bar: CandleBar }[] = [];

      candidateSymbols.forEach((sym) => {
        if (openPositions.has(sym)) return;
        const curBar = dateIndexMap[sym]?.get(currentDate);
        if (!curBar) return;

        let triggered = false;
        let score = 0;

        if (settings.strategyName === 'CUSTOM_AFL') {
          const aflData = precomputedAfl[sym];
          const bars = filteredData[sym] || [];
          const bIdx = bars.findIndex((b) => b.date === currentDate);
          if (aflData && bIdx >= 0 && aflData.buy[bIdx]) {
            triggered = true;
            score = aflData.score?.[bIdx] ?? (curBar.deliveryPct || 50);
          }
        } else {
          // Prebuilt logic triggers
          const bars = filteredData[sym] || [];
          const bIdx = bars.findIndex((b) => b.date === currentDate);
          if (bIdx >= 20) {
            const shock = (curBar.deliveryQty || 1) / Math.max(1, (bars[bIdx - 1]?.deliveryQty || 1));
            const delivPct = curBar.deliveryPct || 45;
            if (shock >= (settings.delivShockThreshold || 1.3) && delivPct >= 45) {
              triggered = true;
              score = shock * 100 + delivPct;
            }
          }
        }

        if (triggered) {
          candidateTriggers.push({ symbol: sym, score, bar: curBar });
        }
      });

      // Rank candidate triggers by PositionScore descending
      candidateTriggers.sort((a, b) => b.score - a.score);

      // Fill available slots
      const entriesToTake = candidateTriggers.slice(0, availableSlots);
      entriesToTake.forEach(({ symbol: sym, bar: curBar }) => {
        const allocatedPerSlot = currentPortfolioEquity * (positionSizePct / 100);
        const capitalToUse = Math.min(cash * 0.98, allocatedPerSlot);
        const slippage = curBar.close * (settings.slippagePct / 100);
        const effectiveEntry = curBar.close + slippage;
        const shares = Math.floor(capitalToUse / effectiveEntry);

        if (shares > 0 && cash >= shares * effectiveEntry) {
          cash -= shares * effectiveEntry;
          openPositions.set(sym, {
            symbol: sym,
            entryDate: currentDate,
            entryPrice: effectiveEntry,
            shares,
            highestPrice: effectiveEntry,
            lowestPrice: effectiveEntry,
            barsHeld: 0,
          });
        }
      });
    }

    // 4. Mark to market equity at end of day
    let endOfDayEquity = cash;
    openPositions.forEach((pos, sym) => {
      const curBar = dateIndexMap[sym]?.get(currentDate);
      const close = curBar ? curBar.close : pos.entryPrice;
      endOfDayEquity += close * pos.shares;
    });

    if (endOfDayEquity > peakEquity) {
      peakEquity = endOfDayEquity;
      currentDrawdownBars = 0;
    } else {
      currentDrawdownBars++;
      if (currentDrawdownBars > maxDrawdownDurationBars) {
        maxDrawdownDurationBars = currentDrawdownBars;
      }
    }

    const dd = peakEquity > 0 ? ((peakEquity - endOfDayEquity) / peakEquity) * 100 : 0;
    const ddAmount = peakEquity - endOfDayEquity;
    if (dd > maxDrawdownPct) maxDrawdownPct = dd;
    if (ddAmount > maxDrawdownAmount) maxDrawdownAmount = ddAmount;

    const curBenchClose = dateIndexMap[benchmarkSymbol]?.get(currentDate)?.close || benchmarkStartPrice;
    const benchmarkEquity =
      benchmarkStartPrice > 0
        ? settings.initialCapital * (curBenchClose / benchmarkStartPrice)
        : settings.initialCapital;

    equityCurve.push({
      date: currentDate,
      equity: Number(endOfDayEquity.toFixed(2)),
      drawdownPct: Number(dd.toFixed(2)),
      benchmarkEquity: Number(benchmarkEquity.toFixed(2)),
      inTrade: openPositions.size > 0,
    });
  }

  // End of simulation equity
  const finalEquity = equityCurve.length > 0 ? equityCurve[equityCurve.length - 1].equity : settings.initialCapital;

  return compileReport({
    initialCapital: settings.initialCapital,
    currentEquity: finalEquity,
    trades,
    equityCurve,
    totalBarsAnalyzed: allDates.length,
    totalBarsInTrade,
    totalBrokeragePaid,
    totalSlippageCost,
    totalSttPaid,
    totalStampDutyPaid,
    totalStcgPaid,
    maxDrawdownPct,
    maxDrawdownAmount,
    maxDrawdownDurationBars,
    benchmarkStartPrice,
    benchmarkEndPrice: dateIndexMap[benchmarkSymbol]?.get(allDates[allDates.length - 1])?.close || benchmarkStartPrice,
    appliedOverrides,
  });
}

/**
 * Main Entry Point: Runs single or portfolio backtest with AFL settings overrides
 */
export function runRichBacktest(
  candles: CandleBar[],
  settings: BacktestSettings,
  symbol: string,
  allMarketData?: Record<string, CandleBar[]>
): RichPerformanceReport {
  // 1. Detect and apply AFL formula overrides
  const appliedOverrides: string[] = [];
  const effectiveSettings: BacktestSettings = { ...settings };

  if (settings.customAflCode) {
    // Run evaluation sample on representative candles to parse AFL overrides
    const sampleCandles = candles.length > 0 ? candles : Object.values(allMarketData || {})[0] || [];
    if (sampleCandles.length > 5) {
      const parsed = executeAfl(sampleCandles, settings.customAflCode);
      if (parsed.overrides) {
        const o = parsed.overrides;
        if (o.initialCapital !== undefined && o.initialCapital > 0) {
          effectiveSettings.initialCapital = o.initialCapital;
          appliedOverrides.push(`Initial Capital: ₹${o.initialCapital.toLocaleString('en-IN')}`);
        }
        if (o.positionSizePct !== undefined && o.positionSizePct > 0) {
          effectiveSettings.positionSizePct = o.positionSizePct;
          appliedOverrides.push(`Position Size: ${o.positionSizePct}%`);
        }
        if (o.stopLossPct !== undefined) {
          effectiveSettings.stopLossPct = o.stopLossPct;
          appliedOverrides.push(`Stop Loss: ${o.stopLossPct}%`);
        }
        if (o.profitTargetPct !== undefined) {
          effectiveSettings.profitTargetPct = o.profitTargetPct;
          appliedOverrides.push(`Profit Target: ${o.profitTargetPct}%`);
        }
        if (o.trailingStopPct !== undefined) {
          effectiveSettings.trailingStopPct = o.trailingStopPct;
          appliedOverrides.push(`Trailing Stop: ${o.trailingStopPct}%`);
        }
        if (o.maxHoldingBars !== undefined) {
          effectiveSettings.maxHoldingBars = o.maxHoldingBars;
          appliedOverrides.push(`Max Holding: ${o.maxHoldingBars} bars`);
        }
        if (o.maxPositions !== undefined) {
          effectiveSettings.maxPositions = o.maxPositions;
          appliedOverrides.push(`Max Positions: ${o.maxPositions}`);
        }
        if (o.slippagePct !== undefined) {
          effectiveSettings.slippagePct = o.slippagePct;
          appliedOverrides.push(`Slippage: ${o.slippagePct}%`);
        }
        if (o.brokeragePerTrade !== undefined) {
          effectiveSettings.brokeragePerTrade = o.brokeragePerTrade;
          appliedOverrides.push(`Brokerage: ₹${o.brokeragePerTrade}/trade`);
        }
        if (o.sttTaxPct !== undefined) {
          effectiveSettings.sttTaxPct = o.sttTaxPct;
          appliedOverrides.push(`STT Tax: ${o.sttTaxPct}%`);
        }
      }
    }
  }

  // 2. Decide whether to run Single Symbol or Multi-Symbol Portfolio
  if (effectiveSettings.universe !== 'single' && allMarketData && Object.keys(allMarketData).length > 1) {
    const candidateSymbols = Object.keys(allMarketData);
    return runPortfolioBacktest(allMarketData, candidateSymbols, effectiveSettings, appliedOverrides);
  }

  // Filter candles by date range for single symbol
  const dateFiltered = filterCandlesByDateRange(candles, effectiveSettings.startDate, effectiveSettings.endDate);
  return runSingleSymbolSimulation(dateFiltered, effectiveSettings, symbol, appliedOverrides);
}

/**
 * Standardized calculation of all AmiBroker Performance Statistics
 */
function compileReport(params: {
  initialCapital: number;
  currentEquity: number;
  trades: Trade[];
  equityCurve: EquityPoint[];
  totalBarsAnalyzed: number;
  totalBarsInTrade: number;
  totalBrokeragePaid: number;
  totalSlippageCost: number;
  totalSttPaid: number;
  totalStampDutyPaid: number;
  totalStcgPaid: number;
  maxDrawdownPct: number;
  maxDrawdownAmount: number;
  maxDrawdownDurationBars: number;
  benchmarkStartPrice: number;
  benchmarkEndPrice: number;
  appliedOverrides: string[];
}): RichPerformanceReport {
  const {
    initialCapital,
    currentEquity,
    trades,
    equityCurve,
    totalBarsAnalyzed,
    totalBarsInTrade,
    totalBrokeragePaid,
    totalSlippageCost,
    totalSttPaid,
    totalStampDutyPaid,
    totalStcgPaid,
    maxDrawdownPct,
    maxDrawdownAmount,
    maxDrawdownDurationBars,
    benchmarkStartPrice,
    benchmarkEndPrice,
    appliedOverrides,
  } = params;

  const netProfit = currentEquity - initialCapital;
  const netProfitPct = Number(((netProfit / initialCapital) * 100).toFixed(2));
  const totalTaxesPaid = totalSttPaid + totalStampDutyPaid + totalStcgPaid;

  const exposurePct = totalBarsAnalyzed > 0 ? Number(((totalBarsInTrade / totalBarsAnalyzed) * 100).toFixed(1)) : 0;
  const years = Math.max(0.1, totalBarsAnalyzed / 250);
  const endingRatio = Math.max(0.01, currentEquity / initialCapital);
  const cagrPct = Number(((Math.pow(endingRatio, 1 / years) - 1) * 100).toFixed(2));

  const buyAndHoldReturnPct =
    benchmarkStartPrice > 0 ? Number((((benchmarkEndPrice - benchmarkStartPrice) / benchmarkStartPrice) * 100).toFixed(2)) : 0;

  const totalTrades = trades.length;
  const winningTrades = trades.filter((t) => t.pnl > 0).length;
  const losingTrades = trades.filter((t) => t.pnl <= 0).length;
  const winRatePct = totalTrades > 0 ? Number(((winningTrades / totalTrades) * 100).toFixed(1)) : 0;
  const lossRatePct = totalTrades > 0 ? Number(((losingTrades / totalTrades) * 100).toFixed(1)) : 0;

  let currentConsecWins = 0;
  let maxConsecWins = 0;
  let currentConsecLosses = 0;
  let maxConsecLosses = 0;
  const winStreaks: number[] = [];
  const lossStreaks: number[] = [];

  trades.forEach((t) => {
    if (t.pnl > 0) {
      currentConsecWins++;
      if (currentConsecLosses > 0) {
        lossStreaks.push(currentConsecLosses);
        currentConsecLosses = 0;
      }
      maxConsecWins = Math.max(maxConsecWins, currentConsecWins);
    } else {
      currentConsecLosses++;
      if (currentConsecWins > 0) {
        winStreaks.push(currentConsecWins);
        currentConsecWins = 0;
      }
      maxConsecLosses = Math.max(maxConsecLosses, currentConsecLosses);
    }
  });
  if (currentConsecWins > 0) winStreaks.push(currentConsecWins);
  if (currentConsecLosses > 0) lossStreaks.push(currentConsecLosses);

  const avgConsecWins = winStreaks.length > 0 ? Number((winStreaks.reduce((a, b) => a + b, 0) / winStreaks.length).toFixed(1)) : 0;
  const avgConsecLosses = lossStreaks.length > 0 ? Number((lossStreaks.reduce((a, b) => a + b, 0) / lossStreaks.length).toFixed(1)) : 0;

  const grossProfit = trades.filter((t) => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.9 : 0;

  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);

  const avgWinRupees = wins.length > 0 ? Number((grossProfit / wins.length).toFixed(2)) : 0;
  const avgLossRupees = losses.length > 0 ? Number((grossLoss / losses.length).toFixed(2)) : 0;
  const avgWinPct = wins.length > 0 ? Number((wins.reduce((a, t) => a + t.returnPct, 0) / wins.length).toFixed(2)) : 0;
  const avgLossPct = losses.length > 0 ? Number((Math.abs(losses.reduce((a, t) => a + t.returnPct, 0)) / losses.length).toFixed(2)) : 0;
  const payoffRatio = avgLossPct > 0 ? Number((avgWinPct / avgLossPct).toFixed(2)) : 0;

  const avgTradePnl = totalTrades > 0 ? Number((netProfit / totalTrades).toFixed(2)) : 0;
  const avgTradePct = totalTrades > 0 ? Number((trades.reduce((a, t) => a + t.returnPct, 0) / totalTrades).toFixed(2)) : 0;

  const pWin = winRatePct / 100;
  const pLoss = lossRatePct / 100;
  const expectancyRupees = Number(((pWin * avgWinRupees) - (pLoss * avgLossRupees)).toFixed(2));
  const expectancyScore = avgLossRupees > 0 ? Number((expectancyRupees / avgLossRupees).toFixed(2)) : 0;

  const avgBarsHeldAll = totalTrades > 0 ? Number((trades.reduce((a, t) => a + t.barsHeld, 0) / totalTrades).toFixed(1)) : 0;
  const avgBarsHeldWinners = wins.length > 0 ? Number((wins.reduce((a, t) => a + t.barsHeld, 0) / wins.length).toFixed(1)) : 0;
  const avgBarsHeldLosers = losses.length > 0 ? Number((losses.reduce((a, t) => a + t.barsHeld, 0) / losses.length).toFixed(1)) : 0;

  // Daily returns for Sharpe, Sortino, Volatility
  const dailyReturns: number[] = [];
  const downsideReturns: number[] = [];
  for (let k = 1; k < equityCurve.length; k++) {
    const prevE = equityCurve[k - 1].equity;
    const curE = equityCurve[k].equity;
    const r = (curE - prevE) / prevE;
    dailyReturns.push(r);
    if (r < 0) downsideReturns.push(r);
  }

  let sharpeRatio = 0;
  let sortinoRatio = 0;
  let annualizedVolatilityPct = 0;

  if (dailyReturns.length > 10) {
    const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) / dailyReturns.length;
    const stdDev = Math.sqrt(variance);
    annualizedVolatilityPct = Number((stdDev * Math.sqrt(252) * 100).toFixed(2));

    const annualizedExcess = meanReturn * 252 - 0.07;
    const annualizedVol = stdDev * Math.sqrt(252);
    sharpeRatio = annualizedVol > 0 ? Number((annualizedExcess / annualizedVol).toFixed(2)) : 0;

    if (downsideReturns.length > 2) {
      const downsideVar = downsideReturns.reduce((acc, r) => acc + Math.pow(r, 2), 0) / downsideReturns.length;
      const downsideDev = Math.sqrt(downsideVar) * Math.sqrt(252);
      sortinoRatio = downsideDev > 0 ? Number((annualizedExcess / downsideDev).toFixed(2)) : 0;
    }
  }

  const calmarRatio = maxDrawdownPct > 0 ? Number((cagrPct / maxDrawdownPct).toFixed(2)) : cagrPct > 0 ? 99.9 : 0;
  const recoveryFactor = maxDrawdownAmount > 0 ? Number((netProfit / maxDrawdownAmount).toFixed(2)) : netProfit > 0 ? 99.9 : 0;
  const carMdd = maxDrawdownPct > 0 ? Number((cagrPct / maxDrawdownPct).toFixed(2)) : cagrPct > 0 ? 99.9 : 0;
  const kRatio = calculateKRatio(equityCurve);

  // Ulcer index
  let sumSqDd = 0;
  equityCurve.forEach((p) => {
    sumSqDd += Math.pow(p.drawdownPct, 2);
  });
  const ulcerIndex = equityCurve.length > 0 ? Number(Math.sqrt(sumSqDd / equityCurve.length).toFixed(2)) : 0;

  const avgMaePct = totalTrades > 0 ? Number((trades.reduce((a, t) => a + t.maePct, 0) / totalTrades).toFixed(2)) : 0;
  const avgMfePct = totalTrades > 0 ? Number((trades.reduce((a, t) => a + t.mfePct, 0) / totalTrades).toFixed(2)) : 0;

  // Monthly Return Matrix
  const monthlyMap: Record<number, (number | null)[]> = {};
  equityCurve.forEach((p, idx) => {
    if (idx === 0) return;
    const prev = equityCurve[idx - 1];
    const dt = new Date(p.date);
    const yr = dt.getFullYear();
    const mo = dt.getMonth();

    if (!monthlyMap[yr]) {
      monthlyMap[yr] = new Array(12).fill(null);
    }

    const prevVal = monthlyMap[yr][mo];
    const dayReturn = (p.equity - prev.equity) / prev.equity;
    monthlyMap[yr][mo] = prevVal === null ? dayReturn * 100 : prevVal + dayReturn * 100;
  });

  const monthlyReturns: MonthlyReturn[] = Object.entries(monthlyMap)
    .sort(([y1], [y2]) => Number(y2) - Number(y1))
    .map(([yrStr, months]) => {
      const year = Number(yrStr);
      let totalYr = 0;
      months.forEach((m) => {
        if (m !== null) totalYr += m;
      });
      return {
        year,
        months: months.map((m) => (m !== null ? Number(m.toFixed(1)) : null)),
        totalYearPct: Number(totalYr.toFixed(1)),
      };
    });

  return {
    initialCapital,
    endingEquity: Number(currentEquity.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    netProfitPct,
    cagrPct,
    exposurePct,
    totalBrokerage: Number(totalBrokeragePaid.toFixed(2)),
    totalSlippageCost: Number(totalSlippageCost.toFixed(2)),
    totalTaxesPaid: Number(totalTaxesPaid.toFixed(2)),
    sttPaid: Number(totalSttPaid.toFixed(2)),
    stampDutyPaid: Number(totalStampDutyPaid.toFixed(2)),
    stcgPaid: Number(totalStcgPaid.toFixed(2)),
    carMdd,
    kRatio,
    benchmarkReturnPct: buyAndHoldReturnPct,
    buyAndHoldReturnPct,
    aflOverridesApplied: appliedOverrides,

    totalTrades,
    winningTrades,
    losingTrades,
    winRatePct,
    lossRatePct,
    maxConsecutiveWins: maxConsecWins,
    maxConsecutiveLosses: maxConsecLosses,
    avgConsecutiveWins: avgConsecWins,
    avgConsecutiveLosses: avgConsecLosses,

    grossProfit: Number(grossProfit.toFixed(2)),
    grossLoss: Number(grossLoss.toFixed(2)),
    profitFactor,
    expectancyRupees,
    expectancyScore,
    payoffRatio,

    avgTradePnl,
    avgTradePct,
    avgWinRupees,
    avgWinPct,
    avgLossRupees,
    avgLossPct,
    avgBarsHeldAll,
    avgBarsHeldWinners,
    avgBarsHeldLosers,

    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    maxDrawdownAmount: Number(maxDrawdownAmount.toFixed(2)),
    maxDrawdownDurationBars,
    sharpeRatio,
    sortinoRatio,
    calmarRatio,
    recoveryFactor,
    ulcerIndex,
    annualizedVolatilityPct,

    avgMaePct,
    avgMfePct,

    monthlyReturns,
    trades: trades.reverse(),
    equityCurve,
  };
}

function createEmptyRichReport(initialCapital: number, appliedOverrides: string[] = []): RichPerformanceReport {
  return {
    initialCapital,
    endingEquity: initialCapital,
    netProfit: 0,
    netProfitPct: 0,
    cagrPct: 0,
    exposurePct: 0,
    totalBrokerage: 0,
    totalSlippageCost: 0,
    totalTaxesPaid: 0,
    sttPaid: 0,
    stampDutyPaid: 0,
    stcgPaid: 0,
    carMdd: 0,
    kRatio: 0,
    benchmarkReturnPct: 0,
    buyAndHoldReturnPct: 0,
    aflOverridesApplied: appliedOverrides,

    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRatePct: 0,
    lossRatePct: 0,
    maxConsecutiveWins: 0,
    maxConsecutiveLosses: 0,
    avgConsecutiveWins: 0,
    avgConsecutiveLosses: 0,

    grossProfit: 0,
    grossLoss: 0,
    profitFactor: 0,
    expectancyRupees: 0,
    expectancyScore: 0,
    payoffRatio: 0,

    avgTradePnl: 0,
    avgTradePct: 0,
    avgWinRupees: 0,
    avgWinPct: 0,
    avgLossRupees: 0,
    avgLossPct: 0,
    avgBarsHeldAll: 0,
    avgBarsHeldWinners: 0,
    avgBarsHeldLosers: 0,

    maxDrawdownPct: 0,
    maxDrawdownAmount: 0,
    maxDrawdownDurationBars: 0,
    sharpeRatio: 0,
    sortinoRatio: 0,
    calmarRatio: 0,
    recoveryFactor: 0,
    ulcerIndex: 0,
    annualizedVolatilityPct: 0,

    avgMaePct: 0,
    avgMfePct: 0,

    monthlyReturns: [],
    trades: [],
    equityCurve: [],
  };
}
