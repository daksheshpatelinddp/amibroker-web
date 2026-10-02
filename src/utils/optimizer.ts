import { BacktestSettings, CandleBar, OptimizationParamConfig, OptimizationResultRow } from '../types/market';
import { runRichBacktest } from './backtester';

export function runStrategyOptimization(
  candles: CandleBar[],
  baseSettings: BacktestSettings,
  symbol: string,
  paramsToOptimize: OptimizationParamConfig[],
  sortBy: 'carMdd' | 'netProfit' | 'sharpeRatio' | 'winRatePct' | 'profitFactor' = 'carMdd'
): OptimizationResultRow[] {
  // Generate combinations
  const paramNames = paramsToOptimize.map((p) => p.name);
  const paramRanges = paramsToOptimize.map((p) => {
    const vals: number[] = [];
    for (let v = p.min; v <= p.max; v += p.step) {
      vals.push(Number(v.toFixed(2)));
    }
    return vals;
  });

  // Cartesian product
  const combinations: Record<string, number>[] = [];
  function cartesian(depth: number, current: Record<string, number>) {
    if (depth === paramNames.length) {
      combinations.push({ ...current });
      return;
    }
    const name = paramNames[depth];
    const vals = paramRanges[depth];
    for (const val of vals) {
      current[name] = val;
      cartesian(depth + 1, current);
    }
  }
  cartesian(0, {});

  // Limit combinations to prevent freeze (max 150 combinations)
  const boundedCombinations = combinations.slice(0, 120);

  const results: OptimizationResultRow[] = [];

  boundedCombinations.forEach((comb, idx) => {
    // Merge parameters into settings
    const testSettings: BacktestSettings = {
      ...baseSettings,
      fastPeriod: comb['fastPeriod'] ?? baseSettings.fastPeriod,
      slowPeriod: comb['slowPeriod'] ?? baseSettings.slowPeriod,
      stopLossPct: comb['stopLossPct'] ?? baseSettings.stopLossPct,
      profitTargetPct: comb['profitTargetPct'] ?? baseSettings.profitTargetPct,
      trailingStopPct: comb['trailingStopPct'] ?? baseSettings.trailingStopPct,
      rsiThreshold: comb['rsiThreshold'] ?? baseSettings.rsiThreshold,
      delivShockThreshold: comb['delivShockThreshold'] ?? baseSettings.delivShockThreshold,
    };

    const report = runRichBacktest(candles, testSettings, symbol);
    const carMdd = report.maxDrawdownPct > 0 ? Number((report.cagrPct / report.maxDrawdownPct).toFixed(2)) : 0;

    results.push({
      rank: 0,
      params: comb,
      netProfit: report.netProfit,
      netProfitPct: report.netProfitPct,
      cagrPct: report.cagrPct,
      winRatePct: report.winRatePct,
      profitFactor: report.profitFactor,
      maxDrawdownPct: report.maxDrawdownPct,
      sharpeRatio: report.sharpeRatio,
      carMdd,
      totalTrades: report.totalTrades,
      avgWinLossRatio: report.payoffRatio,
    });
  });

  // Sort by target metric descending
  results.sort((a, b) => {
    if (sortBy === 'carMdd') return b.carMdd - a.carMdd;
    if (sortBy === 'netProfit') return b.netProfit - a.netProfit;
    if (sortBy === 'sharpeRatio') return b.sharpeRatio - a.sharpeRatio;
    if (sortBy === 'winRatePct') return b.winRatePct - a.winRatePct;
    if (sortBy === 'profitFactor') return b.profitFactor - a.profitFactor;
    return b.netProfit - a.netProfit;
  });

  // Assign ranks
  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return results;
}
