import { CandleBar, MovingAverageType, Timeframe } from '../types/market';

export function calculateSMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (i >= period) {
      sum -= data[i - period];
    }
    if (i >= period - 1) {
      result.push(sum / period);
    } else {
      result.push(null);
    }
  }
  return result;
}

export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prevEma: number | null = null;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    if (prevEma === null) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      prevEma = sum / period;
      result.push(prevEma);
    } else {
      const currentEma: number = data[i] * k + (prevEma as number) * (1 - k);
      result.push(currentEma);
      prevEma = currentEma;
    }
  }
  return result;
}

export function calculateWMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const weightDenominator = (period * (period + 1)) / 2;

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let weightedSum = 0;
    for (let j = 0; j < period; j++) {
      const weight = period - j;
      weightedSum += data[i - j] * weight;
    }
    result.push(weightedSum / weightDenominator);
  }
  return result;
}

export function calculateDEMA(data: number[], period: number): (number | null)[] {
  const ema1 = calculateEMA(data, period);
  const validEma1Values: number[] = [];
  const validIndices: number[] = [];

  ema1.forEach((val, idx) => {
    if (val !== null) {
      validIndices.push(idx);
      validEma1Values.push(val);
    }
  });

  const ema2Sub = calculateEMA(validEma1Values, period);
  const result: (number | null)[] = data.map(() => null);

  validIndices.forEach((origIdx, subIdx) => {
    const e1 = ema1[origIdx];
    const e2 = ema2Sub[subIdx];
    if (e1 !== null && e2 !== null) {
      result[origIdx] = 2 * e1 - e2;
    }
  });

  return result;
}

export function calculateHullMA(data: number[], period: number): (number | null)[] {
  const halfPeriod = Math.max(1, Math.round(period / 2));
  const sqrtPeriod = Math.max(1, Math.round(Math.sqrt(period)));

  const wmaHalf = calculateWMA(data, halfPeriod);
  const wmaFull = calculateWMA(data, period);

  const diffSeries: (number | null)[] = [];
  const validIndices: number[] = [];
  const validDiffs: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const h = wmaHalf[i];
    const f = wmaFull[i];
    if (h !== null && f !== null) {
      const diff = 2 * h - f;
      diffSeries.push(diff);
      validIndices.push(i);
      validDiffs.push(diff);
    } else {
      diffSeries.push(null);
    }
  }

  const finalWma = calculateWMA(validDiffs, sqrtPeriod);
  const result: (number | null)[] = data.map(() => null);

  validIndices.forEach((origIdx, subIdx) => {
    const val = finalWma[subIdx];
    if (val !== null) {
      result[origIdx] = val;
    }
  });

  return result;
}

/**
 * Triangular Moving Average (TMA) - Double-smoothed SMA
 * TMA is widely celebrated in quantitative analysis for superior lag reduction & noise elimination.
 * Formula: If period is even: SMA(SMA(Close, n/2), n/2 + 1)
 *          If period is odd:  SMA(SMA(Close, ceil(n/2)), ceil(n/2))
 */
export function calculateTMA(data: number[], period: number): (number | null)[] {
  const p1 = period % 2 === 0 ? period / 2 : Math.ceil(period / 2);
  const p2 = period % 2 === 0 ? period / 2 + 1 : Math.ceil(period / 2);

  const sma1 = calculateSMA(data, p1);
  const validIndices: number[] = [];
  const validValues: number[] = [];

  sma1.forEach((val, idx) => {
    if (val !== null) {
      validIndices.push(idx);
      validValues.push(val);
    }
  });

  const sma2 = calculateSMA(validValues, p2);
  const result: (number | null)[] = data.map(() => null);

  validIndices.forEach((origIdx, subIdx) => {
    const val = sma2[subIdx];
    if (val !== null) {
      result[origIdx] = val;
    }
  });

  return result;
}

export function calculateMovingAverage(
  data: number[],
  period: number,
  type: MovingAverageType
): (number | null)[] {
  switch (type) {
    case 'SMA':
      return calculateSMA(data, period);
    case 'EMA':
      return calculateEMA(data, period);
    case 'WMA':
      return calculateWMA(data, period);
    case 'DEMA':
      return calculateDEMA(data, period);
    case 'HULL':
      return calculateHullMA(data, period);
    case 'TMA':
      return calculateTMA(data, period);
    default:
      return calculateEMA(data, period);
  }
}

export function calculateATR(candles: CandleBar[], period: number = 14): (number | null)[] {
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      tr.push(candles[i].high - candles[i].low);
    } else {
      const hl = candles[i].high - candles[i].low;
      const hpc = Math.abs(candles[i].high - candles[i - 1].close);
      const lpc = Math.abs(candles[i].low - candles[i - 1].close);
      tr.push(Math.max(hl, hpc, lpc));
    }
  }

  const atr: (number | null)[] = [];
  let sum = 0;
  for (let i = 0; i < tr.length; i++) {
    if (i < period - 1) {
      sum += tr[i];
      atr.push(null);
    } else if (i === period - 1) {
      sum += tr[i];
      atr.push(sum / period);
    } else {
      const prevAtr = atr[i - 1] as number;
      atr.push((prevAtr * (period - 1) + tr[i]) / period);
    }
  }
  return atr;
}

/**
 * AmiBroker Classic: ATR Trailing Stop Loss (Chandelier Exit)
 * TrailStop = Highest(High, Period) - Multiplier * ATR(Period)
 * Once trailing up, does not step down until breached.
 */
export function calculateATRTrailingStop(
  candles: CandleBar[],
  period: number = 14,
  multiplier: number = 3
): {
  longStop: (number | null)[];
  shortStop: (number | null)[];
} {
  const atr = calculateATR(candles, period);
  const longStop: (number | null)[] = [];
  const shortStop: (number | null)[] = [];

  let prevLong = 0;
  let prevShort = Infinity;

  for (let i = 0; i < candles.length; i++) {
    const curAtr = atr[i];
    if (curAtr === null || i < period - 1) {
      longStop.push(null);
      shortStop.push(null);
      continue;
    }

    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = 0; j < period; j++) {
      highestHigh = Math.max(highestHigh, candles[i - j].high);
      lowestLow = Math.min(lowestLow, candles[i - j].low);
    }

    let rawLong = highestHigh - multiplier * curAtr;
    let rawShort = lowestLow + multiplier * curAtr;

    // Trail up: never ratchet downward while close is above previous stop
    let finalLong = rawLong;
    if (i > 0 && longStop[i - 1] !== null) {
      if (candles[i - 1].close > (longStop[i - 1] as number)) {
        finalLong = Math.max(rawLong, longStop[i - 1] as number);
      }
    }

    // Short stop trails down
    let finalShort = rawShort;
    if (i > 0 && shortStop[i - 1] !== null) {
      if (candles[i - 1].close < (shortStop[i - 1] as number)) {
        finalShort = Math.min(rawShort, shortStop[i - 1] as number);
      }
    }

    longStop.push(Number(finalLong.toFixed(2)));
    shortStop.push(Number(finalShort.toFixed(2)));
    prevLong = finalLong;
    prevShort = finalShort;
  }

  return { longStop, shortStop };
}

/**
 * Donchian Channels (Highest High and Lowest Low over lookback)
 */
export function calculateDonchian(
  candles: CandleBar[],
  period: number = 20
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  const middle: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      lower.push(null);
      middle.push(null);
      continue;
    }

    let maxH = -Infinity;
    let minL = Infinity;
    for (let j = 0; j < period; j++) {
      maxH = Math.max(maxH, candles[i - j].high);
      minL = Math.min(minL, candles[i - j].low);
    }
    upper.push(maxH);
    lower.push(minL);
    middle.push((maxH + minL) / 2);
  }

  return { upper, middle, lower };
}

/**
 * Commodity Channel Index (CCI)
 */
export function calculateCCI(candles: CandleBar[], period: number = 20): (number | null)[] {
  const tp = candles.map((c) => (c.high + c.low + c.close) / 3);
  const smaTP = calculateSMA(tp, period);
  const cci: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1 || smaTP[i] === null) {
      cci.push(null);
      continue;
    }
    const mean = smaTP[i] as number;
    let meanDevSum = 0;
    for (let j = 0; j < period; j++) {
      meanDevSum += Math.abs(tp[i - j] - mean);
    }
    const meanDev = meanDevSum / period;
    const val = meanDev === 0 ? 0 : (tp[i] - mean) / (0.015 * meanDev);
    cci.push(Number(val.toFixed(2)));
  }

  return cci;
}

/**
 * Williams %R
 */
export function calculateWilliamsR(candles: CandleBar[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
      continue;
    }
    let maxH = -Infinity;
    let minL = Infinity;
    for (let j = 0; j < period; j++) {
      maxH = Math.max(maxH, candles[i - j].high);
      minL = Math.min(minL, candles[i - j].low);
    }
    const denom = maxH - minL;
    const wr = denom === 0 ? -50 : ((maxH - candles[i].close) / denom) * -100;
    result.push(Number(wr.toFixed(2)));
  }

  return result;
}

/**
 * Money Flow Index (MFI) - Volume-Weighted RSI
 */
export function calculateMFI(candles: CandleBar[], period: number = 14): (number | null)[] {
  const tp = candles.map((c) => (c.high + c.low + c.close) / 3);
  const mfi: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      mfi.push(null);
      continue;
    }
    let posFlow = 0;
    let negFlow = 0;

    for (let j = 0; j < period; j++) {
      const idx = i - j;
      const prevIdx = idx - 1;
      const curMf = tp[idx] * candles[idx].volume;
      if (tp[idx] > tp[prevIdx]) {
        posFlow += curMf;
      } else if (tp[idx] < tp[prevIdx]) {
        negFlow += curMf;
      }
    }

    if (negFlow === 0) {
      mfi.push(100);
    } else {
      const moneyRatio = posFlow / negFlow;
      mfi.push(Number((100 - 100 / (1 + moneyRatio)).toFixed(2)));
    }
  }

  return mfi;
}

export function calculateRSI(closes: number[], period: number = 14): (number | null)[] {
  const rsi: (number | null)[] = [];
  if (closes.length <= period) {
    return closes.map(() => null);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) {
    rsi.push(null);
  }

  const rsFirst = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(100 - 100 / (1 + rsFirst));

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  return rsi;
}

export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macdLine: (number | null)[];
  signalLine: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  const macdLine: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (fastEMA[i] !== null && slowEMA[i] !== null) {
      macdLine.push((fastEMA[i] as number) - (slowEMA[i] as number));
    } else {
      macdLine.push(null);
    }
  }

  const validMacdIndices: number[] = [];
  const validMacdValues: number[] = [];
  macdLine.forEach((val, idx) => {
    if (val !== null) {
      validMacdIndices.push(idx);
      validMacdValues.push(val);
    }
  });

  const signalSubEma = calculateEMA(validMacdValues, signalPeriod);
  const signalLine: (number | null)[] = closes.map(() => null);
  const histogram: (number | null)[] = closes.map(() => null);

  validMacdIndices.forEach((origIdx, subIdx) => {
    const sigVal = signalSubEma[subIdx];
    signalLine[origIdx] = sigVal;
    if (sigVal !== null && macdLine[origIdx] !== null) {
      histogram[origIdx] = (macdLine[origIdx] as number) - sigVal;
    }
  });

  return { macdLine, signalLine, histogram };
}

export function calculateStochastic(
  candles: CandleBar[],
  kPeriod: number = 14,
  dPeriod: number = 3,
  slowing: number = 3
): {
  kLine: (number | null)[];
  dLine: (number | null)[];
} {
  const rawK: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < kPeriod - 1) {
      rawK.push(null);
      continue;
    }
    let highest = -Infinity;
    let lowest = Infinity;
    for (let j = 0; j < kPeriod; j++) {
      highest = Math.max(highest, candles[i - j].high);
      lowest = Math.min(lowest, candles[i - j].low);
    }
    const curClose = candles[i].close;
    const denom = highest - lowest;
    if (denom === 0) {
      rawK.push(50);
    } else {
      rawK.push(((curClose - lowest) / denom) * 100);
    }
  }

  const validKIndices: number[] = [];
  const validKValues: number[] = [];
  rawK.forEach((val, idx) => {
    if (val !== null) {
      validKIndices.push(idx);
      validKValues.push(val);
    }
  });

  const smoothedK = calculateSMA(validKValues, slowing);
  const kLine: (number | null)[] = candles.map(() => null);
  validKIndices.forEach((origIdx, subIdx) => {
    kLine[origIdx] = smoothedK[subIdx];
  });

  const validSmoothIndices: number[] = [];
  const validSmoothValues: number[] = [];
  kLine.forEach((val, idx) => {
    if (val !== null) {
      validSmoothIndices.push(idx);
      validSmoothValues.push(val);
    }
  });

  const dSub = calculateSMA(validSmoothValues, dPeriod);
  const dLine: (number | null)[] = candles.map(() => null);
  validSmoothIndices.forEach((origIdx, subIdx) => {
    dLine[origIdx] = dSub[subIdx];
  });

  return { kLine, dLine };
}

export function calculateADX(
  candles: CandleBar[],
  period: number = 14
): {
  adx: (number | null)[];
  plusDI: (number | null)[];
  minusDI: (number | null)[];
} {
  const atr = calculateATR(candles, period);
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];

  for (let i = 1; i < candles.length; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;

    if (upMove > downMove && upMove > 0) plusDM.push(upMove);
    else plusDM.push(0);

    if (downMove > upMove && downMove > 0) minusDM.push(downMove);
    else minusDM.push(0);
  }

  const smoothPlusDM = calculateEMA(plusDM, period);
  const smoothMinusDM = calculateEMA(minusDM, period);

  const plusDI: (number | null)[] = [];
  const minusDI: (number | null)[] = [];
  const dx: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    const curAtr = atr[i];
    const curPlus = smoothPlusDM[i];
    const curMinus = smoothMinusDM[i];

    if (curAtr && curPlus !== null && curMinus !== null && curAtr > 0) {
      const pdi = (curPlus / curAtr) * 100;
      const mdi = (curMinus / curAtr) * 100;
      plusDI.push(pdi);
      minusDI.push(mdi);
      const sum = pdi + mdi;
      dx.push(sum > 0 ? (Math.abs(pdi - mdi) / sum) * 100 : 0);
    } else {
      plusDI.push(null);
      minusDI.push(null);
      dx.push(null);
    }
  }

  const validDxIndices: number[] = [];
  const validDxValues: number[] = [];
  dx.forEach((val, idx) => {
    if (val !== null) {
      validDxIndices.push(idx);
      validDxValues.push(val);
    }
  });

  const adxSub = calculateEMA(validDxValues, period);
  const adx: (number | null)[] = candles.map(() => null);
  validDxIndices.forEach((origIdx, subIdx) => {
    adx[origIdx] = adxSub[subIdx];
  });

  return { adx, plusDI, minusDI };
}

export function calculateBollingerBands(
  closes: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const middle = calculateSMA(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1 || middle[i] === null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    const mid = middle[i] as number;
    let sumSquares = 0;
    for (let j = 0; j < period; j++) {
      sumSquares += Math.pow(closes[i - j] - mid, 2);
    }
    const stdDev = Math.sqrt(sumSquares / period);
    upper.push(mid + stdDevMultiplier * stdDev);
    lower.push(mid - stdDevMultiplier * stdDev);
  }

  return { upper, middle, lower };
}

export function calculateSupertrend(
  candles: CandleBar[],
  period: number = 10,
  multiplier: number = 3
): {
  trend: ('BULL' | 'BEAR')[];
  supertrend: (number | null)[];
} {
  const atr = calculateATR(candles, period);
  const trend: ('BULL' | 'BEAR')[] = [];
  const supertrend: (number | null)[] = [];

  let prevUpper = 0;
  let prevLower = 0;
  let currentTrend: 'BULL' | 'BEAR' = 'BULL';

  for (let i = 0; i < candles.length; i++) {
    const curAtr = atr[i];
    if (curAtr === null) {
      trend.push('BULL');
      supertrend.push(null);
      continue;
    }

    const hl2 = (candles[i].high + candles[i].low) / 2;
    let basicUpper = hl2 + multiplier * curAtr;
    let basicLower = hl2 - multiplier * curAtr;

    let finalUpper = basicUpper;
    let finalLower = basicLower;

    if (i > 0 && supertrend[i - 1] !== null) {
      const prevClose = candles[i - 1].close;
      finalUpper = basicUpper < prevUpper || prevClose > prevUpper ? basicUpper : prevUpper;
      finalLower = basicLower > prevLower || prevClose < prevLower ? basicLower : prevLower;
    }

    if (candles[i].close > finalUpper) {
      currentTrend = 'BULL';
    } else if (candles[i].close < finalLower) {
      currentTrend = 'BEAR';
    }

    trend.push(currentTrend);
    supertrend.push(currentTrend === 'BULL' ? finalLower : finalUpper);
    prevUpper = finalUpper;
    prevLower = finalLower;
  }

  return { trend, supertrend };
}

export function calculateVWAP(candles: CandleBar[]): (number | null)[] {
  const vwap: (number | null)[] = [];
  let cumVol = 0;
  let cumVolPrice = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumVol += c.volume;
    cumVolPrice += typicalPrice * c.volume;
    vwap.push(cumVol > 0 ? cumVolPrice / cumVol : c.close);
  }
  return vwap;
}

export function calculateHeikinAshi(candles: CandleBar[]): CandleBar[] {
  const ha: CandleBar[] = [];
  for (let i = 0; i < candles.length; i++) {
    const cur = candles[i];
    const haClose = (cur.open + cur.high + cur.low + cur.close) / 4;
    let haOpen: number;
    if (i === 0) {
      haOpen = (cur.open + cur.close) / 2;
    } else {
      haOpen = (ha[i - 1].open + ha[i - 1].close) / 2;
    }
    const haHigh = Math.max(cur.high, haOpen, haClose);
    const haLow = Math.min(cur.low, haOpen, haClose);

    ha.push({
      ...cur,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
    });
  }
  return ha;
}

export function calculateDeliveryShock(candles: CandleBar[], lookback: number = 20): number[] {
  const shocks: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < lookback) {
      shocks.push(1);
      continue;
    }
    let delivSum = 0;
    for (let j = 1; j <= lookback; j++) {
      delivSum += candles[i - j].deliveryQty || (candles[i - j].volume * 0.45);
    }
    const avgDeliv = delivSum / lookback;
    const curDeliv = candles[i].deliveryQty || (candles[i].volume * 0.45);
    shocks.push(avgDeliv > 0 ? Number((curDeliv / avgDeliv).toFixed(2)) : 1);
  }
  return shocks;
}

/**
 * Resample candle bars into any target timeframe:
 * e.g. '1m', '5m', '15m', '45m', '1h', '2h', '4h', '1D', '3D', '1W', '1M', '3M', '1Y'
 * Supports arbitrary number N + unit (tick, second, minute, hour, day, week, month, year)
 */
export function resampleCandles(candles: CandleBar[], timeframe: Timeframe): CandleBar[] {
  if (!candles || candles.length === 0) return [];
  const tfStr = String(timeframe).trim();
  if (tfStr === '1D' || tfStr.toLowerCase() === '1 day' || tfStr.toLowerCase() === '1d') return candles;

  const match = tfStr.match(/^(\d+)?\s*([a-zA-Z]+)$/);
  const num = match && match[1] ? parseInt(match[1], 10) : 1;
  const unit = match && match[2] ? match[2].toLowerCase() : 'd';

  // Intraday simulation (ticks, seconds, minutes, hours)
  if (
    unit === 'm' ||
    unit === 'min' ||
    unit === 'minute' ||
    unit === 'minutes' ||
    unit === 'h' ||
    unit === 'hour' ||
    unit === 'hours' ||
    unit === 's' ||
    unit === 'sec' ||
    unit === 'second' ||
    unit === 'seconds' ||
    unit === 'tick' ||
    unit === 'ticks'
  ) {
    let minutes = num;
    if (unit === 'h' || unit === 'hour' || unit === 'hours') minutes = num * 60;
    else if (unit === 's' || unit === 'sec' || unit === 'second' || unit === 'seconds' || unit === 'tick' || unit === 'ticks') {
      minutes = Math.max(1, Math.round(num / 60));
    }

    // Approximate bars per 6.25-hour Indian trading day (375 minutes)
    const barsPerDay = Math.max(1, Math.min(120, Math.round(375 / Math.max(1, minutes))));
    const recent = candles.slice(-10);
    const intradayBars: CandleBar[] = [];

    recent.forEach((d) => {
      const step = (d.close - d.open) / barsPerDay;
      for (let b = 0; b < barsPerDay; b++) {
        const hour = 9 + Math.floor((b * (375 / barsPerDay)) / 60);
        const minute = Math.floor((b * (375 / barsPerDay)) % 60);
        const timeStr = `${d.date} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

        const bOpen = Number((d.open + b * step).toFixed(2));
        const bClose = Number((bOpen + step + Math.sin(b * 1.5) * (d.high - d.low) * 0.15).toFixed(2));
        const bHigh = Number((Math.max(bOpen, bClose) + Math.abs(step) * 0.4).toFixed(2));
        const bLow = Number((Math.min(bOpen, bClose) - Math.abs(step) * 0.4).toFixed(2));
        const bVol = Math.round(d.volume / barsPerDay);
        const bDeliv = d.deliveryQty ? Math.round(d.deliveryQty / barsPerDay) : Math.round(bVol * 0.45);

        intradayBars.push({
          date: timeStr,
          open: bOpen,
          high: bHigh,
          low: bLow,
          close: bClose,
          volume: bVol,
          deliveryQty: bDeliv,
          deliveryPct: d.deliveryPct,
          isAdjusted: d.isAdjusted,
        });
      }
    });
    return intradayBars;
  }

  // Multi-day aggregation (e.g. 2D, 3D, 5D, 10 days)
  if (unit === 'd' || unit === 'day' || unit === 'days') {
    if (num <= 1) return candles;
    const grouped: CandleBar[] = [];
    for (let i = 0; i < candles.length; i += num) {
      const chunk = candles.slice(i, i + num);
      if (chunk.length === 0) continue;
      const open = chunk[0].open;
      const close = chunk[chunk.length - 1].close;
      let high = -Infinity;
      let low = Infinity;
      let volume = 0;
      let deliveryQty = 0;
      chunk.forEach((b) => {
        high = Math.max(high, b.high);
        low = Math.min(low, b.low);
        volume += b.volume;
        deliveryQty += b.deliveryQty ?? Math.round(b.volume * 0.45);
      });
      grouped.push({
        date: chunk[chunk.length - 1].date,
        open,
        high,
        low,
        close,
        volume,
        deliveryQty,
        deliveryPct: volume > 0 ? Number(((deliveryQty / volume) * 100).toFixed(1)) : 45.0,
        isAdjusted: chunk[0].isAdjusted,
      });
    }
    return grouped;
  }

  // Higher timeframes: Week, Month, Quarter, Year
  const groupedMap: Record<string, CandleBar[]> = {};

  candles.forEach((c) => {
    const dt = new Date(c.date);
    let key = '';

    if (unit === 'w' || unit === 'week' || unit === 'weeks') {
      const day = dt.getDay();
      const diff = dt.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(dt.setDate(diff));
      key = mon.toISOString().split('T')[0];
    } else if (unit === 'm' || unit === 'mo' || unit === 'month' || unit === 'months') {
      key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (unit === 'q' || unit === 'quarter' || unit === 'quarters') {
      key = `${dt.getFullYear()}-Q${Math.floor(dt.getMonth() / 3) + 1}`;
    } else if (unit === 'y' || unit === 'yr' || unit === 'year' || unit === 'years') {
      key = `${dt.getFullYear()}-01-01`;
    } else {
      key = c.date;
    }

    if (!groupedMap[key]) groupedMap[key] = [];
    groupedMap[key].push(c);
  });

  const resampled: CandleBar[] = [];
  for (const [, bars] of Object.entries(groupedMap)) {
    if (bars.length === 0) continue;
    const open = bars[0].open;
    const close = bars[bars.length - 1].close;
    let high = -Infinity;
    let low = Infinity;
    let totalVol = 0;
    let totalDeliv = 0;

    bars.forEach((b) => {
      high = Math.max(high, b.high);
      low = Math.min(low, b.low);
      totalVol += b.volume;
      totalDeliv += b.deliveryQty ?? Math.round(b.volume * 0.45);
    });

    const deliveryPct = totalVol > 0 ? Number(((totalDeliv / totalVol) * 100).toFixed(1)) : 45.0;

    resampled.push({
      date: bars[bars.length - 1].date,
      open,
      high,
      low,
      close,
      volume: totalVol,
      deliveryQty: totalDeliv,
      deliveryPct,
      isAdjusted: bars[0].isAdjusted,
    });
  }

  return resampled.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Parabolic SAR (Stop and Reverse) - AmiBroker Classic
 */
export function calculateParabolicSAR(
  candles: CandleBar[],
  step: number = 0.02,
  maxStep: number = 0.2
): {
  sar: (number | null)[];
  trend: ('UP' | 'DOWN')[];
} {
  const n = candles.length;
  if (n < 2) {
    return {
      sar: candles.map(() => null),
      trend: candles.map(() => 'UP'),
    };
  }

  const sar: (number | null)[] = [null];
  const trend: ('UP' | 'DOWN')[] = ['UP'];

  let isUp = candles[1].close >= candles[0].close;
  let ep = isUp ? Math.max(candles[0].high, candles[1].high) : Math.min(candles[0].low, candles[1].low);
  let curSar = isUp ? Math.min(candles[0].low, candles[1].low) : Math.max(candles[0].high, candles[1].high);
  let af = step;

  sar.push(curSar);
  trend.push(isUp ? 'UP' : 'DOWN');

  for (let i = 2; i < n; i++) {
    let nextSar = curSar + af * (ep - curSar);

    if (isUp) {
      // In uptrend, SAR cannot be above the low of the prior two bars
      nextSar = Math.min(nextSar, candles[i - 1].low, candles[i - 2].low);

      if (candles[i].low < nextSar) {
        // Reverse to DOWN
        isUp = false;
        nextSar = ep;
        ep = candles[i].low;
        af = step;
      } else {
        if (candles[i].high > ep) {
          ep = candles[i].high;
          af = Math.min(af + step, maxStep);
        }
      }
    } else {
      // In downtrend, SAR cannot be below the high of the prior two bars
      nextSar = Math.max(nextSar, candles[i - 1].high, candles[i - 2].high);

      if (candles[i].high > nextSar) {
        // Reverse to UP
        isUp = true;
        nextSar = ep;
        ep = candles[i].high;
        af = step;
      } else {
        if (candles[i].low < ep) {
          ep = candles[i].low;
          af = Math.min(af + step, maxStep);
        }
      }
    }

    curSar = nextSar;
    sar.push(Number(curSar.toFixed(2)));
    trend.push(isUp ? 'UP' : 'DOWN');
  }

  return { sar, trend };
}

/**
 * On Balance Volume (OBV)
 */
export function calculateOBV(candles: CandleBar[]): number[] {
  const obv: number[] = [];
  let curObv = 0;

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      curObv = candles[0].volume;
    } else {
      const prevClose = candles[i - 1].close;
      const curClose = candles[i].close;
      if (curClose > prevClose) {
        curObv += candles[i].volume;
      } else if (curClose < prevClose) {
        curObv -= candles[i].volume;
      }
    }
    obv.push(curObv);
  }
  return obv;
}

/**
 * Rate of Change (ROC)
 */
export function calculateROC(closes: number[], period: number = 14): (number | null)[] {
  const roc: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      roc.push(null);
    } else {
      const past = closes[i - period];
      if (past === 0) {
        roc.push(0);
      } else {
        const val = ((closes[i] - past) / past) * 100;
        roc.push(Number(val.toFixed(2)));
      }
    }
  }
  return roc;
}
