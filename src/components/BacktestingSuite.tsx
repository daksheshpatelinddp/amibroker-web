import React, { useState, useMemo } from 'react';
import {
  BacktestSettings,
  BacktestUniverseType,
  CandleBar,
  OptimizationParamConfig,
  OptimizationResultRow,
  RichPerformanceReport,
} from '../types/market';
import { runRichBacktest } from '../utils/backtester';
import { runStrategyOptimization } from '../utils/optimizer';
import { AFL_TEMPLATES } from '../utils/aflEngine';
import { STOCK_UNIVERSE } from '../utils/sampleData';
import { getSavedWatchlists, getSavedFavorites } from '../utils/categoriesWatchlists';
import {
  Play,
  TrendingUp,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldCheck,
  Zap,
  BarChart3,
  Calendar,
  Layers,
  Settings,
  Check,
  Sliders,
  Sparkles,
  Info,
  DollarSign,
  PieChart,
  Percent,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

interface BacktestingSuiteProps {
  candles: CandleBar[];
  currentSymbol: string;
  allSymbols: string[];
  allMarketData: Record<string, CandleBar[]>;
  onSelectSymbolForChart: (symbol: string) => void;
  customAflCode?: string;
}

export type ReportTab =
  | 'summary'
  | 'trade_stats'
  | 'risk_drawdown'
  | 'monthly_matrix'
  | 'mae_mfe'
  | 'trades'
  | 'optimizer';

export type SettingsModalTab = 'general' | 'portfolio' | 'commission_taxes' | 'stops';

export const BacktestingSuite: React.FC<BacktestingSuiteProps> = ({
  candles,
  currentSymbol,
  allSymbols,
  allMarketData,
  onSelectSymbolForChart,
  customAflCode = AFL_TEMPLATES[0].code,
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('summary');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<SettingsModalTab>('general');

  // Backtest settings with default 0 for stops & taxes per requirements
  const [settings, setSettings] = useState<BacktestSettings>({
    symbol: currentSymbol,
    universe: 'single',
    universeFilterValue: currentSymbol,
    strategyName: 'DELIVERY_BREAKOUT',
    initialCapital: 500000,
    positionSizePct: 20,
    maxPositions: 5,
    positionRanking: 'PositionScore',
    // Default 0 for slippage, brokerage, taxes & stops
    slippagePct: 0,
    brokeragePerTrade: 0,
    sttTaxPct: 0,
    stampDutyPct: 0,
    stcgTaxPct: 0,
    stopLossPct: 0,
    profitTargetPct: 0,
    trailingStopPct: 0,
    maxHoldingBars: 0,
    startDate: '2004-01-01',
    endDate: '2026-08-28',
    timeframe: '1D',
    fastPeriod: 20,
    slowPeriod: 50,
    rsiThreshold: 32,
    delivShockThreshold: 1.4,
    customAflCode,
  });

  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'WINNERS' | 'LOSERS'>('ALL');

  // Categories and watchlists for universe selection
  const markets = useMemo(() => Array.from(new Set(STOCK_UNIVERSE.map((s) => s.market))), []);
  const groups = useMemo(() => Array.from(new Set(STOCK_UNIVERSE.map((s) => s.group))), []);
  const sectors = useMemo(() => Array.from(new Set(STOCK_UNIVERSE.map((s) => s.sector))), []);
  const industries = useMemo(() => Array.from(new Set(STOCK_UNIVERSE.map((s) => s.industry))), []);
  const watchlists = useMemo(() => getSavedWatchlists(), []);
  const favorites = useMemo(() => getSavedFavorites(), []);

  // Determine active candidate symbols based on universe
  const candidateSymbols = useMemo(() => {
    switch (settings.universe) {
      case 'single':
        return [settings.symbol];
      case 'market':
        return STOCK_UNIVERSE.filter((s) => s.market === settings.universeFilterValue).map((s) => s.symbol);
      case 'group':
        return STOCK_UNIVERSE.filter((s) => s.group === settings.universeFilterValue).map((s) => s.symbol);
      case 'sector':
        return STOCK_UNIVERSE.filter((s) => s.sector === settings.universeFilterValue).map((s) => s.symbol);
      case 'industry':
        return STOCK_UNIVERSE.filter((s) => s.industry === settings.universeFilterValue).map((s) => s.symbol);
      case 'favorites':
        return Array.from(favorites);
      case 'watchlist': {
        const wl = watchlists.find((w) => w.id === settings.universeFilterValue);
        return wl ? wl.symbols : allSymbols;
      }
      case 'all':
      default:
        return allSymbols;
    }
  }, [settings.universe, settings.universeFilterValue, settings.symbol, favorites, watchlists, allSymbols]);

  // Optimizer configuration
  const [optParams, setOptParams] = useState<OptimizationParamConfig[]>([
    { name: 'fastPeriod', label: 'Fast Period', min: 10, max: 25, step: 5, defaultVal: 20 },
    { name: 'slowPeriod', label: 'Slow Period', min: 40, max: 70, step: 10, defaultVal: 50 },
    { name: 'stopLossPct', label: 'Stop Loss %', min: 0, max: 6.0, step: 2.0, defaultVal: 0 },
    { name: 'profitTargetPct', label: 'Target %', min: 0, max: 12.0, step: 4.0, defaultVal: 0 },
  ]);
  const [optSortMetric, setOptSortMetric] = useState<'carMdd' | 'netProfit' | 'sharpeRatio' | 'winRatePct'>('carMdd');
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResultRow[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Run backtest with current settings
  const report: RichPerformanceReport = useMemo(() => {
    // If running single symbol, use that symbol's candles
    const singleData = allMarketData[settings.symbol] || candles;

    // Filter market data to only include candidate symbols
    const scopedMarketData: Record<string, CandleBar[]> = {};
    candidateSymbols.forEach((sym) => {
      if (allMarketData[sym]) {
        scopedMarketData[sym] = allMarketData[sym];
      }
    });

    return runRichBacktest(
      singleData,
      settings,
      settings.symbol,
      settings.universe === 'single' ? undefined : scopedMarketData
    );
  }, [allMarketData, settings, candles, candidateSymbols]);

  // Filtered trade log
  const filteredTrades = useMemo(() => {
    if (tradeFilter === 'WINNERS') return report.trades.filter((t) => t.pnl > 0);
    if (tradeFilter === 'LOSERS') return report.trades.filter((t) => t.pnl <= 0);
    return report.trades;
  }, [report.trades, tradeFilter]);

  // Run Optimization Handler
  const handleRunOptimization = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      const dataToUse = allMarketData[settings.symbol] || candles;
      const res = runStrategyOptimization(dataToUse, settings, settings.symbol, optParams, optSortMetric);
      setOptimizationResults(res);
      setIsOptimizing(false);
    }, 100);
  };

  const applyOptimizedRow = (row: OptimizationResultRow) => {
    setSettings((prev) => ({
      ...prev,
      fastPeriod: row.params['fastPeriod'] ?? prev.fastPeriod,
      slowPeriod: row.params['slowPeriod'] ?? prev.slowPeriod,
      stopLossPct: row.params['stopLossPct'] ?? prev.stopLossPct,
      profitTargetPct: row.params['profitTargetPct'] ?? prev.profitTargetPct,
    }));
    setActiveTab('summary');
  };

  // Export Trade Log CSV
  const handleExportTrades = () => {
    const headers = [
      'TradeID',
      'Symbol',
      'EntryDate',
      'EntryPrice',
      'ExitDate',
      'ExitPrice',
      'Shares',
      'NetPnL',
      'ReturnPct',
      'MAE_Pct',
      'MFE_Pct',
      'ExitReason',
      'BarsHeld',
    ];
    const lines = [headers.join(',')];
    report.trades.forEach((t) => {
      lines.push(
        [
          t.id,
          t.symbol,
          t.entryDate,
          t.entryPrice,
          t.exitDate,
          t.exitPrice,
          t.shares,
          t.pnl,
          t.returnPct,
          t.maePct,
          t.mfePct,
          t.exitReason,
          t.barsHeld,
        ].join(',')
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AmiBroker_TradeLog_${settings.universe}_${settings.strategyName}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Equity Curve Chart Dimensions
  const curvePoints = report.equityCurve;
  const minEquity = curvePoints.length > 0 ? Math.min(...curvePoints.map((p) => p.equity)) * 0.95 : 0;
  const maxEquity = curvePoints.length > 0 ? Math.max(...curvePoints.map((p) => p.equity)) * 1.05 : 1000000;
  const equityRange = maxEquity - minEquity || 1;

  const chartW = 850;
  const equityH = 150;
  const ddH = 60;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 overflow-y-auto">
      {/* Title & Strategy Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-cyan-400" />
            <span>AmiBroker Quantitative Portfolio Backtesting & Optimization Suite</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Portfolio-level system simulation, AFL settings overrides, custom performance metrics, and optimization per official AmiBroker specification.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-cyan-300 border border-cyan-700/60 transition-colors shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>Backtest Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('optimizer')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-xs font-semibold text-cyan-300 border border-cyan-700 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Parameter Optimizer</span>
          </button>

          <button
            onClick={handleExportTrades}
            disabled={report.trades.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Trade Log</span>
          </button>
        </div>
      </div>

      {/* AFL Overrides Active Notice Banner */}
      {report.aflOverridesApplied && report.aflOverridesApplied.length > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-amber-950/70 border border-amber-600/70 text-xs text-amber-200 flex items-start gap-2.5 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <div className="font-bold flex items-center gap-2">
              <span>⚡ AFL Formula Defined Settings Overrides Active</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-900 text-amber-300 font-mono">
                AmiBroker Precedence Rule
              </span>
            </div>
            <p className="text-[11px] text-amber-300/90 leading-relaxed">
              Your AFL strategy code specifies custom parameters that have overridden manual backtest settings:
            </p>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {report.aflOverridesApplied.map((ov, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-black/40 border border-amber-500/50 font-mono text-[10px] text-white">
                  {ov}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Quick Settings Ribbon */}
      <div className="mt-3 p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Universe Mode */}
          <div>
            <span className="text-[10px] text-slate-400 font-mono block">Apply To / Universe</span>
            <select
              value={settings.universe}
              onChange={(e) => {
                const uni = e.target.value as BacktestUniverseType;
                let defaultVal = '';
                if (uni === 'single') defaultVal = currentSymbol;
                else if (uni === 'market') defaultVal = markets[0];
                else if (uni === 'group') defaultVal = groups[0];
                else if (uni === 'sector') defaultVal = sectors[0];
                else if (uni === 'industry') defaultVal = industries[0];
                else if (uni === 'watchlist') defaultVal = watchlists[0]?.id || '';
                setSettings({ ...settings, universe: uni, universeFilterValue: defaultVal });
              }}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-medium focus:border-cyan-500"
            >
              <option value="single">Single Symbol</option>
              <option value="market">Market Category</option>
              <option value="group">Stock Group / Index</option>
              <option value="sector">Sector</option>
              <option value="industry">Industry</option>
              <option value="favorites">Favorites ({favorites.size})</option>
              <option value="watchlist">Watchlist</option>
              <option value="all">All Stocks ({allSymbols.length})</option>
            </select>
          </div>

          {/* Universe Sub-Value selector */}
          {settings.universe === 'single' && (
            <div>
              <span className="text-[10px] text-slate-400 font-mono block">Symbol</span>
              <select
                value={settings.symbol}
                onChange={(e) => setSettings({ ...settings, symbol: e.target.value })}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-mono"
              >
                {allSymbols.map((sym) => (
                  <option key={sym} value={sym}>
                    {sym}
                  </option>
                ))}
              </select>
            </div>
          )}

          {settings.universe === 'market' && (
            <div>
              <span className="text-[10px] text-slate-400 font-mono block">Market</span>
              <select
                value={settings.universeFilterValue}
                onChange={(e) => setSettings({ ...settings, universeFilterValue: e.target.value })}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300"
              >
                {markets.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {settings.universe === 'group' && (
            <div>
              <span className="text-[10px] text-slate-400 font-mono block">Group</span>
              <select
                value={settings.universeFilterValue}
                onChange={(e) => setSettings({ ...settings, universeFilterValue: e.target.value })}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300"
              >
                {groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          )}

          {settings.universe === 'sector' && (
            <div>
              <span className="text-[10px] text-slate-400 font-mono block">Sector</span>
              <select
                value={settings.universeFilterValue}
                onChange={(e) => setSettings({ ...settings, universeFilterValue: e.target.value })}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300"
              >
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          {settings.universe === 'industry' && (
            <div>
              <span className="text-[10px] text-slate-400 font-mono block">Industry</span>
              <select
                value={settings.universeFilterValue}
                onChange={(e) => setSettings({ ...settings, universeFilterValue: e.target.value })}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300"
              >
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          )}

          {settings.universe === 'watchlist' && (
            <div>
              <span className="text-[10px] text-slate-400 font-mono block">Watchlist</span>
              <select
                value={settings.universeFilterValue}
                onChange={(e) => setSettings({ ...settings, universeFilterValue: e.target.value })}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300"
              >
                {watchlists.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.symbols.length} stocks)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Strategy Selection */}
          <div>
            <span className="text-[10px] text-slate-400 font-mono block">Strategy Logic</span>
            <select
              value={settings.strategyName}
              onChange={(e) => setSettings({ ...settings, strategyName: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 font-medium focus:border-cyan-500"
            >
              <option value="DELIVERY_BREAKOUT">Delivery Shock Breakout</option>
              <option value="ATR_TRAILING_STOP">ATR Trailing Stop (Chandelier Exit)</option>
              <option value="EMA_CROSSOVER">EMA Crossover (Golden Cross)</option>
              <option value="SUPERTREND">Supertrend (10, 3) Trend Reversal</option>
              <option value="RSI_MEAN_REVERSION">RSI Oversold Bounce</option>
              <option value="BOLLINGER_SQUEEZE">Bollinger Volatility Expansion</option>
              <option value="CUSTOM_AFL">My Custom AFL Strategy Formula</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <span className="text-[10px] text-slate-400 font-mono block">From Date</span>
            <input
              type="date"
              value={settings.startDate}
              onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 font-mono"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono block">To Date</span>
            <input
              type="date"
              value={settings.endDate}
              onChange={(e) => setSettings({ ...settings, endDate: e.target.value })}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 font-mono"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 self-end pb-0.5">
            {[
              { label: 'All (2004-2026)', start: '2004-01-01', end: '2026-08-28' },
              { label: '5Y', start: '2021-01-01', end: '2026-08-28' },
              { label: '1Y', start: '2024-01-01', end: '2026-08-28' },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => setSettings({ ...settings, startDate: p.start, endDate: p.end })}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-mono border border-slate-700"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Candidate Count indicator */}
        <div className="text-right">
          <span className="text-[11px] text-slate-400">
            Portfolio Basket: <strong className="text-cyan-400 font-mono">{candidateSymbols.length}</strong> symbols
          </span>
          <div className="text-[10px] text-slate-500 font-mono">
            {settings.universe !== 'single' ? 'Multi-Symbol Portfolio Backtest' : 'Individual Symbol Test'}
          </div>
        </div>
      </div>

      {/* AmiBroker Report Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 mt-4 overflow-x-auto text-xs">
        {[
          { id: 'summary', label: 'Overall Summary' },
          { id: 'trade_stats', label: 'Trade Statistics' },
          { id: 'risk_drawdown', label: 'Risk & Drawdowns' },
          { id: 'monthly_matrix', label: 'Monthly Return Heatmap' },
          { id: 'mae_mfe', label: 'MAE / MFE Excursion' },
          { id: 'trades', label: `Trade Log (${report.totalTrades})` },
          { id: 'optimizer', label: 'Strategy Optimizer' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ReportTab)}
            className={`px-3.5 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-300 font-bold bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overall Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-4 mt-3">
          {/* Quick Scorecard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400">Net Profit</div>
              <div
                className={`text-lg font-bold font-mono tabular-nums mt-0.5 ${
                  report.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {report.netProfit >= 0 ? '+' : ''}₹{report.netProfit.toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">{report.netProfitPct}% Total Return</div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400">CAGR (Annualized)</div>
              <div className="text-lg font-bold font-mono tabular-nums mt-0.5 text-cyan-400">
                {report.cagrPct}%
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Ending: ₹{report.endingEquity.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400">CAR / MDD</div>
              <div className="text-lg font-bold font-mono tabular-nums mt-0.5 text-amber-300">
                {report.carMdd.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">Max DD: {report.maxDrawdownPct}%</div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400">Profit Factor</div>
              <div className="text-lg font-bold font-mono tabular-nums mt-0.5 text-emerald-400">
                {report.profitFactor}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">Payoff: {report.payoffRatio}x</div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400">Win Rate</div>
              <div className="text-lg font-bold font-mono tabular-nums mt-0.5 text-sky-400">
                {report.winRatePct}%
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {report.winningTrades}W / {report.losingTrades}L
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <div className="text-[11px] text-slate-400">Sharpe Ratio</div>
              <div className="text-lg font-bold font-mono tabular-nums mt-0.5 text-purple-400">
                {report.sharpeRatio}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">K-Ratio: {report.kRatio}</div>
            </div>
          </div>

          {/* Interactive SVG Equity Curve & Underwater Drawdown Chart */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Portfolio Equity Curve & Benchmark Comparison</span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                  <span className="text-slate-300">Portfolio Equity</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  <span className="text-slate-400">Buy & Hold Benchmark</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-rose-400">Drawdown %</span>
                </span>
              </div>
            </div>

            {curvePoints.length > 1 ? (
              <div className="space-y-1">
                {/* Equity Curve SVG */}
                <div className="w-full overflow-x-auto bg-slate-950 p-2 rounded border border-slate-800/80">
                  <svg viewBox={`0 0 ${chartW} ${equityH}`} className="w-full h-36">
                    {/* Grid lines */}
                    <line x1="0" y1="0" x2={chartW} y2="0" stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
                    <line x1="0" y1={equityH / 2} x2={chartW} y2={equityH / 2} stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
                    <line x1="0" y1={equityH} x2={chartW} y2={equityH} stroke="#334155" strokeDasharray="3 3" opacity="0.3" />

                    {/* Benchmark Polyline */}
                    <polyline
                      fill="none"
                      stroke="#64748b"
                      strokeWidth="1.2"
                      strokeDasharray="4 2"
                      points={curvePoints
                        .map((p, i) => {
                          const x = (i / (curvePoints.length - 1)) * chartW;
                          const y = equityH - ((p.benchmarkEquity - minEquity) / equityRange) * equityH;
                          return `${x},${isNaN(y) ? equityH / 2 : y}`;
                        })
                        .join(' ')}
                    />

                    {/* Strategy Equity Polyline */}
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      points={curvePoints
                        .map((p, i) => {
                          const x = (i / (curvePoints.length - 1)) * chartW;
                          const y = equityH - ((p.equity - minEquity) / equityRange) * equityH;
                          return `${x},${isNaN(y) ? equityH / 2 : y}`;
                        })
                        .join(' ')}
                    />
                  </svg>
                </div>

                {/* Drawdown Area Chart SVG */}
                <div className="w-full overflow-x-auto bg-slate-950 p-2 rounded border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 font-mono mb-1">Underwater Drawdown (%)</div>
                  <svg viewBox={`0 0 ${chartW} ${ddH}`} className="w-full h-16">
                    {/* Fill underwater area */}
                    <polygon
                      fill="#e11d4822"
                      stroke="#f43f5e"
                      strokeWidth="1.2"
                      points={`0,0 ${curvePoints
                        .map((p, i) => {
                          const x = (i / (curvePoints.length - 1)) * chartW;
                          const y = (p.drawdownPct / Math.max(1, report.maxDrawdownPct)) * (ddH - 5);
                          return `${x},${y}`;
                        })
                        .join(' ')} ${chartW},0`}
                    />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">Insufficient bar data for chart rendering.</div>
            )}
          </div>

          {/* Official AmiBroker Performance Report Table (Per official AmiBroker Report Tour) */}
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>AmiBroker System Performance Report (h_report.html)</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Period: {settings.startDate} to {settings.endDate} ({report.totalTrades} total trades)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Column 1: Performance & Returns Comparison */}
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="text-xs font-bold text-cyan-400 border-b border-slate-800 pb-1">
                  Overall System Metrics
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Initial Capital</span>
                  <span className="text-white font-bold">₹{report.initialCapital.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Ending Capital</span>
                  <span className="text-white font-bold">₹{report.endingEquity.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Net Profit</span>
                  <span className={report.netProfit >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {report.netProfit >= 0 ? '+' : ''}₹{report.netProfit.toLocaleString('en-IN')} ({report.netProfitPct}%)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Annual Return (CAGR)</span>
                  <span className="text-cyan-300 font-bold">{report.cagrPct}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Benchmark Return (Buy & Hold)</span>
                  <span className="text-slate-300">{report.buyAndHoldReturnPct}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">CAR / MDD</span>
                  <span className="text-amber-300 font-bold">{report.carMdd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Recovery Factor</span>
                  <span className="text-emerald-400">{report.recoveryFactor}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">K-Ratio</span>
                  <span className="text-purple-300">{report.kRatio}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Ulcer Index</span>
                  <span className="text-rose-300">{report.ulcerIndex}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Annualized Volatility</span>
                  <span className="text-slate-300">{report.annualizedVolatilityPct}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Sharpe Ratio / Sortino Ratio</span>
                  <span className="text-white">
                    {report.sharpeRatio} / {report.sortinoRatio}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Market Exposure %</span>
                  <span className="text-slate-300">{report.exposurePct}%</span>
                </div>
              </div>

              {/* Column 2: Trade & Tax Statistics */}
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="text-xs font-bold text-cyan-400 border-b border-slate-800 pb-1">
                  Trade Statistics & Cost Analysis
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Total Trades</span>
                  <span className="text-white font-bold">{report.totalTrades}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Winning Trades</span>
                  <span className="text-emerald-400">
                    {report.winningTrades} ({report.winRatePct}%)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Losing Trades</span>
                  <span className="text-rose-400">
                    {report.losingTrades} ({report.lossRatePct}%)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Profit Factor</span>
                  <span className="text-emerald-400 font-bold">{report.profitFactor}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Avg Trade P&L</span>
                  <span className="text-white">
                    ₹{report.avgTradePnl} ({report.avgTradePct}%)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Avg Win / Avg Loss</span>
                  <span className="text-white">
                    +₹{report.avgWinRupees} / -₹{report.avgLossRupees}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Payoff Ratio</span>
                  <span className="text-cyan-300 font-bold">{report.payoffRatio}x</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Expectancy</span>
                  <span className="text-emerald-400">
                    ₹{report.expectancyRupees} (Score: {report.expectancyScore})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Max Consecutive Wins / Losses</span>
                  <span className="text-white">
                    {report.maxConsecutiveWins} / {report.maxConsecutiveLosses}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Max System Drawdown</span>
                  <span className="text-rose-400 font-bold">
                    {report.maxDrawdownPct}% (₹{report.maxDrawdownAmount.toLocaleString('en-IN')})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">Total Brokerage & Slippage</span>
                  <span className="text-slate-300">
                    ₹{(report.totalBrokerage + report.totalSlippageCost).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Total Taxes (STT + Stamp + STCG)</span>
                  <span className="text-amber-300 font-bold">₹{report.totalTaxesPaid.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Trade Statistics */}
      {activeTab === 'trade_stats' && (
        <div className="mt-3 p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-4 text-xs">
          <h3 className="font-bold text-white text-sm">Detailed Trade Analytics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[11px]">Gross Profit</div>
              <div className="text-emerald-400 font-bold text-base mt-1">₹{report.grossProfit.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[11px]">Gross Loss</div>
              <div className="text-rose-400 font-bold text-base mt-1">₹{report.grossLoss.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[11px]">Avg Bars Held (Winners)</div>
              <div className="text-cyan-300 font-bold text-base mt-1">{report.avgBarsHeldWinners} bars</div>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[11px]">Avg Bars Held (Losers)</div>
              <div className="text-amber-300 font-bold text-base mt-1">{report.avgBarsHeldLosers} bars</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Risk & Drawdown */}
      {activeTab === 'risk_drawdown' && (
        <div className="mt-3 p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 text-xs">
          <h3 className="font-bold text-white text-sm">System Risk & Drawdown Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[11px]">Max Drawdown (%)</div>
              <div className="text-rose-400 font-bold text-base mt-1">{report.maxDrawdownPct}%</div>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[11px]">Max Drawdown Amount</div>
              <div className="text-rose-400 font-bold text-base mt-1">₹{report.maxDrawdownAmount.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[11px]">Max DD Duration</div>
              <div className="text-amber-300 font-bold text-base mt-1">{report.maxDrawdownDurationBars} bars</div>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[11px]">Ulcer Index</div>
              <div className="text-purple-300 font-bold text-base mt-1">{report.ulcerIndex}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Monthly Return Matrix */}
      {activeTab === 'monthly_matrix' && (
        <div className="mt-3 p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 text-xs overflow-x-auto">
          <h3 className="font-bold text-white text-sm">Monthly Returns Heatmap (%)</h3>
          <table className="w-full text-center border-collapse font-mono text-[11px]">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2 px-2 text-left">Year</th>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                  <th key={m} className="py-2 px-1">
                    {m}
                  </th>
                ))}
                <th className="py-2 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {report.monthlyReturns.map((row) => (
                <tr key={row.year} className="border-b border-slate-800/40 hover:bg-slate-850">
                  <td className="py-1.5 px-2 text-left font-bold text-white">{row.year}</td>
                  {row.months.map((m, idx) => (
                    <td
                      key={idx}
                      className={`py-1.5 px-1 font-mono ${
                        m === null
                          ? 'text-slate-600'
                          : m > 0
                          ? 'bg-emerald-950/40 text-emerald-400 font-semibold'
                          : 'bg-rose-950/40 text-rose-400 font-semibold'
                      }`}
                    >
                      {m !== null ? `${m > 0 ? '+' : ''}${m}%` : '-'}
                    </td>
                  ))}
                  <td
                    className={`py-1.5 px-2 text-right font-bold ${
                      row.totalYearPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {row.totalYearPct >= 0 ? '+' : ''}
                    {row.totalYearPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: MAE / MFE */}
      {activeTab === 'mae_mfe' && (
        <div className="mt-3 p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 text-xs">
          <h3 className="font-bold text-white text-sm">Maximum Adverse (MAE) & Favorable (MFE) Excursion</h3>
          <div className="grid grid-cols-2 gap-4 font-mono">
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[11px]">Average MAE (Intra-trade Drawdown)</div>
              <div className="text-rose-400 font-bold text-base mt-1">-{report.avgMaePct}%</div>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="text-slate-400 text-[11px]">Average MFE (Intra-trade Runup)</div>
              <div className="text-emerald-400 font-bold text-base mt-1">+{report.avgMfePct}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Trade Log */}
      {activeTab === 'trades' && (
        <div className="mt-3 p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-xs">Filter Trades:</span>
              {(['ALL', 'WINNERS', 'LOSERS'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTradeFilter(mode)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                    tradeFilter === mode
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            <span className="text-slate-400 text-xs font-mono">Showing {filteredTrades.length} trades</span>
          </div>

          <div className="max-h-[500px] overflow-y-auto overflow-x-auto border border-slate-800 rounded">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-2.5">ID</th>
                  <th className="py-2 px-2.5">Symbol</th>
                  <th className="py-2 px-2.5">Entry Date</th>
                  <th className="py-2 px-2.5">Entry Price</th>
                  <th className="py-2 px-2.5">Exit Date</th>
                  <th className="py-2 px-2.5">Exit Price</th>
                  <th className="py-2 px-2.5">Shares</th>
                  <th className="py-2 px-2.5 text-right">Net PnL (₹)</th>
                  <th className="py-2 px-2.5 text-right">Return %</th>
                  <th className="py-2 px-2.5">Exit Reason</th>
                  <th className="py-2 px-2.5">Bars</th>
                  <th className="py-2 px-2.5">MAE %</th>
                  <th className="py-2 px-2.5">MFE %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredTrades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-850/60">
                    <td className="py-1.5 px-2.5 text-slate-400">{t.id}</td>
                    <td
                      onClick={() => onSelectSymbolForChart(t.symbol)}
                      className="py-1.5 px-2.5 text-cyan-400 font-bold hover:underline cursor-pointer"
                    >
                      {t.symbol}
                    </td>
                    <td className="py-1.5 px-2.5 text-slate-300">{t.entryDate}</td>
                    <td className="py-1.5 px-2.5">₹{t.entryPrice.toFixed(2)}</td>
                    <td className="py-1.5 px-2.5 text-slate-300">{t.exitDate}</td>
                    <td className="py-1.5 px-2.5">₹{t.exitPrice.toFixed(2)}</td>
                    <td className="py-1.5 px-2.5 text-slate-300">{t.shares}</td>
                    <td
                      className={`py-1.5 px-2.5 text-right font-bold ${
                        t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {t.pnl >= 0 ? '+' : ''}₹{t.pnl.toLocaleString('en-IN')}
                    </td>
                    <td
                      className={`py-1.5 px-2.5 text-right font-bold ${
                        t.returnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {t.returnPct >= 0 ? '+' : ''}
                      {t.returnPct}%
                    </td>
                    <td className="py-1.5 px-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                        {t.exitReason}
                      </span>
                    </td>
                    <td className="py-1.5 px-2.5 text-slate-400">{t.barsHeld}</td>
                    <td className="py-1.5 px-2.5 text-rose-400">-{t.maePct}%</td>
                    <td className="py-1.5 px-2.5 text-emerald-400">+{t.mfePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Parameter Optimizer */}
      {activeTab === 'optimizer' && (
        <div className="mt-3 p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Multi-Pass Strategy Parameter Optimizer</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Exhaustive parameter sweep to find optimal risk-adjusted settings for maximum CAR/MDD and profit factor.
              </p>
            </div>
            <button
              onClick={handleRunOptimization}
              disabled={isOptimizing}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-md disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>{isOptimizing ? 'Sweeping Grid...' : 'Run Optimization'}</span>
            </button>
          </div>

          {/* Results table */}
          {optimizationResults.length > 0 && (
            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Rank</th>
                    <th className="py-2 px-3">Parameters</th>
                    <th className="py-2 px-3 text-right">Net Profit</th>
                    <th className="py-2 px-3 text-right">CAGR %</th>
                    <th className="py-2 px-3 text-right">CAR / MDD</th>
                    <th className="py-2 px-3 text-right">Win Rate</th>
                    <th className="py-2 px-3 text-right">Profit Factor</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {optimizationResults.slice(0, 20).map((row) => (
                    <tr key={row.rank} className="hover:bg-slate-850">
                      <td className="py-2 px-3 font-bold text-cyan-400">#{row.rank}</td>
                      <td className="py-2 px-3 text-slate-300">
                        {Object.entries(row.params)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(', ')}
                      </td>
                      <td
                        className={`py-2 px-3 text-right font-bold ${
                          row.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        ₹{row.netProfit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 text-right text-cyan-300">{row.cagrPct}%</td>
                      <td className="py-2 px-3 text-right font-bold text-amber-300">{row.carMdd.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-sky-400">{row.winRatePct}%</td>
                      <td className="py-2 px-3 text-right text-emerald-400">{row.profitFactor}</td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => applyOptimizedRow(row)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-800 text-[10px] font-semibold"
                        >
                          Apply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* AmiBroker Settings Properties Modal (Matching https://www.amibroker.com/guide/w_settings.html) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  AmiBroker Backtester Settings & Portfolio Properties (w_settings.html)
                </h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-900 text-xs">
              {[
                { id: 'general', label: '1. General' },
                { id: 'portfolio', label: '2. Portfolio' },
                { id: 'commission_taxes', label: '3. Commission & Taxes' },
                { id: 'stops', label: '4. Stops & Exits' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSettingsTab(t.id as SettingsModalTab)}
                  className={`px-3.5 py-2 font-medium border-b-2 transition-colors ${
                    settingsTab === t.id
                      ? 'border-cyan-400 text-cyan-300 font-bold bg-slate-950/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Tab Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              {/* Tab 1: General Settings */}
              {settingsTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Initial Capital (₹)</label>
                      <input
                        type="number"
                        value={settings.initialCapital}
                        onChange={(e) => setSettings({ ...settings, initialCapital: Number(e.target.value) || 100000 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-cyan-300"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">AFL Override: InitialEquity = ...</span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Default Position Size (%)</label>
                      <input
                        type="number"
                        value={settings.positionSizePct}
                        onChange={(e) => setSettings({ ...settings, positionSizePct: Number(e.target.value) || 10 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-cyan-300"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">AFL Override: PositionSize = -...</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Timeframe Interval</label>
                      <select
                        value={settings.timeframe || '1D'}
                        onChange={(e) => setSettings({ ...settings, timeframe: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-slate-200"
                      >
                        <option value="1D">Daily (1D)</option>
                        <option value="1W">Weekly (1W)</option>
                        <option value="1M">Monthly (1M)</option>
                        <option value="1h">1 Hour (60m)</option>
                        <option value="15m">15 Minutes</option>
                        <option value="5m">5 Minutes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Strategy Logic</label>
                      <select
                        value={settings.strategyName}
                        onChange={(e) => setSettings({ ...settings, strategyName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-200"
                      >
                        <option value="DELIVERY_BREAKOUT">Institutional Delivery Breakout</option>
                        <option value="ATR_TRAILING_STOP">ATR Trailing Stop</option>
                        <option value="EMA_CROSSOVER">EMA Crossover</option>
                        <option value="SUPERTREND">Supertrend Reversal</option>
                        <option value="RSI_MEAN_REVERSION">RSI Oversold Bounce</option>
                        <option value="BOLLINGER_SQUEEZE">Bollinger Volatility Squeeze</option>
                        <option value="CUSTOM_AFL">Custom AFL Strategy Formula</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Portfolio Settings */}
              {settingsTab === 'portfolio' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Max Open Positions</label>
                      <input
                        type="number"
                        value={settings.maxPositions}
                        onChange={(e) => setSettings({ ...settings, maxPositions: Number(e.target.value) || 1 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-cyan-300"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">AFL Override: MaxOpenPositions = ...</span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Position Ranking Priority</label>
                      <select
                        value={settings.positionRanking || 'PositionScore'}
                        onChange={(e) => setSettings({ ...settings, positionRanking: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-slate-200"
                      >
                        <option value="PositionScore">PositionScore (from AFL)</option>
                        <option value="deliveryShock">Delivery Shock (Highest)</option>
                        <option value="rsi">RSI Momentum</option>
                        <option value="roc">Rate of Change (ROC)</option>
                        <option value="volume">Trading Volume</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Portfolio Symbol Universe</label>
                    <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-400 space-y-1">
                      <div>
                        Selected Universe:{' '}
                        <strong className="text-cyan-300">{settings.universe.toUpperCase()}</strong> (
                        {candidateSymbols.length} candidate stocks)
                      </div>
                      <p className="text-[11px] text-slate-500">
                        In portfolio mode, capital is allocated across candidate symbols ranked by priority score on each bar.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Commission, Slippage & Taxes (Default 0) */}
              {settingsTab === 'commission_taxes' && (
                <div className="space-y-4">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                    ℹ️ All taxes and commission settings default to <strong className="text-white">0</strong>. Enter custom percentages to simulate exact exchange costs and taxes.
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Brokerage per Trade (₹)</label>
                      <input
                        type="number"
                        step="1"
                        value={settings.brokeragePerTrade}
                        onChange={(e) => setSettings({ ...settings, brokeragePerTrade: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-slate-200"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Default: 0</span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Slippage %</label>
                      <input
                        type="number"
                        step="0.01"
                        value={settings.slippagePct}
                        onChange={(e) => setSettings({ ...settings, slippagePct: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-slate-200"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Default: 0%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">STT Tax % (Sell)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={settings.sttTaxPct}
                        onChange={(e) => setSettings({ ...settings, sttTaxPct: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-slate-200"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Default: 0% (e.g. 0.1%)</span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Stamp Duty % (Buy)</label>
                      <input
                        type="number"
                        step="0.005"
                        value={settings.stampDutyPct}
                        onChange={(e) => setSettings({ ...settings, stampDutyPct: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-slate-200"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Default: 0%</span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">STCG Capital Gains %</label>
                      <input
                        type="number"
                        step="1"
                        value={settings.stcgTaxPct}
                        onChange={(e) => setSettings({ ...settings, stcgTaxPct: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-slate-200"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">Default: 0% (e.g. 15%)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Stops & Exits (Default 0) */}
              {settingsTab === 'stops' && (
                <div className="space-y-4">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                    ℹ️ All stop settings default to <strong className="text-white">0 (Disabled)</strong>. Set non-zero values to activate stops, or define them in your AFL formula via <code className="text-cyan-300 font-mono">ApplyStop(...)</code> or variables.
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Stop Loss % (0 = Disabled)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={settings.stopLossPct}
                        onChange={(e) => setSettings({ ...settings, stopLossPct: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-rose-300"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">AFL Override: StopLoss = ...</span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Profit Target % (0 = Disabled)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={settings.profitTargetPct}
                        onChange={(e) => setSettings({ ...settings, profitTargetPct: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-emerald-300"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">AFL Override: ProfitTarget = ...</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Trailing Stop % (0 = Disabled)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={settings.trailingStopPct}
                        onChange={(e) => setSettings({ ...settings, trailingStopPct: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-amber-300"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">AFL Override: TrailingStop = ...</span>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Max Holding Bars (0 = Disabled)</label>
                      <input
                        type="number"
                        step="1"
                        value={settings.maxHoldingBars}
                        onChange={(e) => setSettings({ ...settings, maxHoldingBars: Number(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 font-mono text-slate-200"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">AFL Override: MaxHoldingBars = ...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-slate-400 text-xs">
                Changes apply instantly to current backtest run.
              </span>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-sm"
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
