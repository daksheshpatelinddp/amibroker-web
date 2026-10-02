import React, { useState, useMemo } from 'react';
import { BacktestUniverseType, CandleBar, ExplorationRow } from '../types/market';
import { AFL_TEMPLATES, executeAfl } from '../utils/aflEngine';
import {
  calculateDeliveryShock,
  calculateEMA,
  calculateRSI,
  calculateSMA,
  calculateSupertrend,
} from '../utils/indicators';
import { STOCK_UNIVERSE } from '../utils/sampleData';
import { getSavedFavorites, getSavedWatchlists } from '../utils/categoriesWatchlists';
import {
  Search,
  Filter,
  Download,
  ArrowUpDown,
  Play,
  Code2,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Layers,
  Calendar,
  Clock,
  Globe,
} from 'lucide-react';

interface ScannerExplorationProps {
  allMarketData: Record<string, CandleBar[]>;
  onSelectSymbolForChart: (symbol: string) => void;
  customAflCode?: string;
  onOpenAflEditor?: () => void;
}

export type ScanMode = 'prebuilt' | 'custom_afl';

export type ScanPresetId =
  | 'DELIVERY_SHOCK'
  | 'GOLDEN_CROSS'
  | 'SUPERTREND_BULL'
  | 'RSI_OVERSOLD'
  | 'HIGH_52W_BREAKOUT'
  | 'ALL_EXPLORATION';

export const ScannerExploration: React.FC<ScannerExplorationProps> = ({
  allMarketData,
  onSelectSymbolForChart,
  customAflCode = AFL_TEMPLATES[0].code,
  onOpenAflEditor,
}) => {
  const [scanMode, setScanMode] = useState<ScanMode>('prebuilt');
  const [selectedPreset, setSelectedPreset] = useState<ScanPresetId>('DELIVERY_SHOCK');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('deliveryShock');
  const [sortAsc, setSortAsc] = useState(false);
  const [showAflDrawer, setShowAflDrawer] = useState(false);

  // Active AFL code in custom mode
  const [activeCustomAfl, setActiveCustomAfl] = useState<string>(customAflCode);

  // Universe and Date-Range Filtering (Portfolio level exploration)
  const [universe, setUniverse] = useState<BacktestUniverseType>('all');
  const [universeFilterValue, setUniverseFilterValue] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2004-01-01');
  const [endDate, setEndDate] = useState<string>('2026-08-28');
  const [timeframe, setTimeframe] = useState<string>('Daily');

  // Categories extraction
  const markets = useMemo(() => Array.from(new Set(STOCK_UNIVERSE.map((s) => s.market))).filter(Boolean), []);
  const groups = useMemo(() => Array.from(new Set(STOCK_UNIVERSE.map((s) => s.group))).filter(Boolean), []);
  const sectors = useMemo(() => Array.from(new Set(STOCK_UNIVERSE.map((s) => s.sector))).filter(Boolean), []);
  const industries = useMemo(() => Array.from(new Set(STOCK_UNIVERSE.map((s) => s.industry))).filter(Boolean), []);
  const savedWatchlists = useMemo(() => getSavedWatchlists(), []);
  const savedFavorites = useMemo(() => getSavedFavorites(), []);

  // Filter symbols based on selected universe
  const candidateSymbols = useMemo(() => {
    if (universe === 'all') {
      return Object.keys(allMarketData);
    }
    if (universe === 'single') {
      return universeFilterValue ? [universeFilterValue] : ['RELIANCE'];
    }
    if (universe === 'market') {
      const target = universeFilterValue || markets[0] || 'NSE_EQ';
      return STOCK_UNIVERSE.filter((s) => s.market === target).map((s) => s.symbol);
    }
    if (universe === 'group') {
      const target = universeFilterValue || groups[0] || 'NIFTY_50';
      return STOCK_UNIVERSE.filter((s) => s.group === target).map((s) => s.symbol);
    }
    if (universe === 'sector') {
      const target = universeFilterValue || sectors[0] || 'Technology';
      return STOCK_UNIVERSE.filter((s) => s.sector === target).map((s) => s.symbol);
    }
    if (universe === 'industry') {
      const target = universeFilterValue || industries[0] || 'IT Consulting';
      return STOCK_UNIVERSE.filter((s) => s.industry === target).map((s) => s.symbol);
    }
    if (universe === 'favorites') {
      const favList = Array.from(savedFavorites);
      return favList.length > 0 ? favList : ['RELIANCE', 'TCS', 'HDFCBANK'];
    }
    if (universe === 'watchlist') {
      const wl = savedWatchlists.find((w) => w.id === universeFilterValue) || savedWatchlists[0];
      return wl ? wl.symbols : Object.keys(allMarketData);
    }
    return Object.keys(allMarketData);
  }, [universe, universeFilterValue, allMarketData, markets, groups, sectors, industries, savedFavorites, savedWatchlists]);

  // 1. Run Prebuilt Exploration
  const prebuiltRows = useMemo(() => {
    const rows: ExplorationRow[] = [];

    for (const symbol of candidateSymbols) {
      const rawCandles = allMarketData[symbol];
      if (!rawCandles || rawCandles.length < 5) continue;

      // Filter candles by user defined date period
      const candles = rawCandles.filter((c) => {
        if (startDate && c.date < startDate) return false;
        if (endDate && c.date > endDate) return false;
        return true;
      });

      if (candles.length < 15) continue;

      const n = candles.length;
      const latest = candles[n - 1];
      const prev = candles[n - 2];
      const closes = candles.map((c) => c.close);

      const ema20 = calculateEMA(closes, 20);
      const ema50 = calculateEMA(closes, 50);
      const sma200 = calculateSMA(closes, Math.min(200, n - 1));
      const rsi = calculateRSI(closes, 14);
      const { trend } = calculateSupertrend(candles, 10, 3);
      const shocks = calculateDeliveryShock(candles, 20);

      const curEma20 = ema20[n - 1] ?? latest.close;
      const curEma50 = ema50[n - 1] ?? latest.close;
      const curSma200 = sma200[n - 1] ?? latest.close;
      const curRsi = rsi[n - 1] ?? 50;
      const curSupertrend = trend[n - 1] ?? 'BULL';
      const curShock = shocks[n - 1] ?? 1.0;
      const deliveryPct = latest.deliveryPct ?? 45.0;

      const lookback52w = Math.min(250, n);
      const high52w = Math.max(...candles.slice(-lookback52w).map((c) => c.high));
      const low52w = Math.min(...candles.slice(-lookback52w).map((c) => c.low));
      const distFrom52wHighPct = ((latest.close - high52w) / high52w) * 100;
      const changePct = ((latest.close - prev.close) / prev.close) * 100;

      let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
      let signalReason = 'No active trigger';

      if (curShock >= 1.4 && deliveryPct >= 48) {
        signal = 'BUY';
        signalReason = `High Delivery Shock (${curShock}x) & ${deliveryPct.toFixed(1)}% Deliv`;
      } else if (curEma20 > curEma50 && ema20[n - 2]! <= ema50[n - 2]!) {
        signal = 'BUY';
        signalReason = 'EMA 20/50 Golden Cross Breakout';
      } else if (curSupertrend === 'BULL' && trend[n - 2] === 'BEAR') {
        signal = 'BUY';
        signalReason = 'Supertrend Bullish Reversal';
      } else if (curRsi < 35) {
        signal = 'BUY';
        signalReason = `RSI Oversold Bounce (${curRsi.toFixed(1)})`;
      } else if (distFrom52wHighPct >= -2) {
        signal = 'BUY';
        signalReason = 'Near 52-Week High Breakout';
      } else if (curSupertrend === 'BEAR' && curEma20 < curEma50) {
        signal = 'SELL';
        signalReason = 'Bearish Supertrend & EMA Breakdown';
      }

      rows.push({
        symbol,
        date: latest.date,
        close: latest.close,
        changePct: Number(changePct.toFixed(2)),
        volume: latest.volume,
        deliveryPct: Number(deliveryPct.toFixed(1)),
        deliveryShock: Number(curShock.toFixed(2)),
        rsi: Number(curRsi.toFixed(1)),
        ema20: Number(curEma20.toFixed(2)),
        ema50: Number(curEma50.toFixed(2)),
        sma200: Number(curSma200.toFixed(2)),
        supertrend: curSupertrend,
        signal,
        signalReason,
        high52w: Number(high52w.toFixed(2)),
        low52w: Number(low52w.toFixed(2)),
        distFrom52wHighPct: Number(distFrom52wHighPct.toFixed(1)),
      });
    }

    return rows;
  }, [candidateSymbols, allMarketData, startDate, endDate]);

  // 2. Run Custom AFL Formula Exploration across market
  const customAflResult = useMemo(() => {
    if (scanMode !== 'custom_afl') {
      return { rows: [], columns: [], error: null };
    }

    const rows: ExplorationRow[] = [];
    const discoveredColumnNames: string[] = [];

    for (const symbol of candidateSymbols) {
      const rawCandles = allMarketData[symbol];
      if (!rawCandles || rawCandles.length < 5) continue;

      const candles = rawCandles.filter((c) => {
        if (startDate && c.date < startDate) return false;
        if (endDate && c.date > endDate) return false;
        return true;
      });

      if (candles.length < 10) continue;
      const n = candles.length;
      const latest = candles[n - 1];
      const prev = candles[n - 2];

      const res = executeAfl(candles, activeCustomAfl);
      if (!res.success) {
        return { rows: [], columns: [], error: res.error };
      }

      // Check if latest bar matches Filter or Buy/Sell condition
      const isFiltered = res.filterSignals[n - 1] || res.buySignals[n - 1] || res.sellSignals[n - 1];

      if (isFiltered) {
        const customCols: Record<string, string | number> = {};
        res.columns.forEach((col) => {
          if (!discoveredColumnNames.includes(col.header)) {
            discoveredColumnNames.push(col.header);
          }
          const val = col.values[n - 1];
          customCols[col.header] = typeof val === 'number' ? Number(val.toFixed(2)) : String(val ?? '-');
        });

        const isBuy = res.buySignals[n - 1];
        const isSell = res.sellSignals[n - 1];

        rows.push({
          symbol,
          date: latest.date,
          close: latest.close,
          changePct: Number((((latest.close - prev.close) / prev.close) * 100).toFixed(2)),
          volume: latest.volume,
          deliveryPct: Number((latest.deliveryPct ?? 45).toFixed(1)),
          deliveryShock: 1.0,
          rsi: 50,
          ema20: latest.close,
          ema50: latest.close,
          sma200: latest.close,
          supertrend: 'BULL',
          signal: isBuy ? 'BUY' : isSell ? 'SELL' : 'NEUTRAL',
          signalReason: isBuy ? 'AFL Buy Trigger' : isSell ? 'AFL Sell Trigger' : 'AFL Filter Match',
          high52w: latest.high,
          low52w: latest.low,
          distFrom52wHighPct: 0,
          customColumns: customCols,
        });
      }
    }

    return { rows, columns: discoveredColumnNames, error: null };
  }, [candidateSymbols, allMarketData, scanMode, activeCustomAfl, startDate, endDate]);

  // Active Rows
  const activeRows = useMemo(() => {
    let base = scanMode === 'prebuilt' ? prebuiltRows : customAflResult.rows;

    return base.filter((row) => {
      if (searchTerm && !row.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      if (scanMode === 'prebuilt') {
        if (selectedPreset === 'DELIVERY_SHOCK') return row.deliveryShock >= 1.3 || row.deliveryPct >= 50;
        if (selectedPreset === 'GOLDEN_CROSS') return row.ema20 > row.ema50;
        if (selectedPreset === 'SUPERTREND_BULL') return row.supertrend === 'BULL';
        if (selectedPreset === 'RSI_OVERSOLD') return row.rsi < 45;
        if (selectedPreset === 'HIGH_52W_BREAKOUT') return row.distFrom52wHighPct >= -4;
      }
      return true;
    });
  }, [scanMode, prebuiltRows, customAflResult.rows, searchTerm, selectedPreset]);

  // Sorted Rows
  const sortedRows = useMemo(() => {
    return [...activeRows].sort((a, b) => {
      let aVal = (a as any)[sortField] ?? a.customColumns?.[sortField];
      let bVal = (b as any)[sortField] ?? b.customColumns?.[sortField];

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? (Number(aVal) || 0) - (Number(bVal) || 0) : (Number(bVal) || 0) - (Number(aVal) || 0);
    });
  }, [activeRows, sortField, sortAsc]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportCsv = () => {
    if (sortedRows.length === 0) return;
    const isCustom = scanMode === 'custom_afl';

    let headers: string[] = [];
    if (isCustom && customAflResult.columns.length > 0) {
      headers = ['Symbol', 'Date', 'Signal', ...customAflResult.columns];
    } else {
      headers = ['Symbol', 'Date', 'Close', 'Chg%', 'Deliv%', 'DelivShock', 'RSI', 'Signal'];
    }

    const lines = [headers.join(',')];
    sortedRows.forEach((r) => {
      if (isCustom && customAflResult.columns.length > 0) {
        const rowVals = [r.symbol, r.date, r.signal];
        customAflResult.columns.forEach((col) => {
          rowVals.push(String(r.customColumns?.[col] ?? ''));
        });
        lines.push(rowVals.join(','));
      } else {
        lines.push([r.symbol, r.date, r.close, r.changePct, r.deliveryPct, r.deliveryShock, r.rsi, r.signal].join(','));
      }
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AmiBroker_${scanMode}_Exploration_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 overflow-y-auto">
      {/* Title & Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span>AmiBroker Exploration & Market Scanner</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">({sortedRows.length} matches in {candidateSymbols.length} symbols)</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Portfolio-level exploration across Symbol, Market, Group, Sector, Industry, Favorites or Watchlists for any custom date range.
          </p>
        </div>

        {/* Mode Selector & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-xs">
            <button
              onClick={() => setScanMode('prebuilt')}
              className={`px-3 py-1 rounded transition-colors font-medium ${
                scanMode === 'prebuilt' ? 'bg-slate-700 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Classic Scans
            </button>
            <button
              onClick={() => setScanMode('custom_afl')}
              className={`px-3 py-1 rounded transition-colors font-medium flex items-center gap-1.5 ${
                scanMode === 'custom_afl' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>My Custom AFL Formula</span>
            </button>
          </div>

          <button
            onClick={() => setShowAflDrawer(!showAflDrawer)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showAflDrawer ? 'Hide Script' : 'Edit AFL Script'}</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={sortedRows.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Universe & Date Scope Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 mt-3 p-3 bg-slate-900/90 border border-slate-800 rounded-lg text-xs">
        {/* Universe Selector */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Universe Scope</span>
          </label>
          <div className="flex gap-1.5">
            <select
              value={universe}
              onChange={(e) => {
                const val = e.target.value as BacktestUniverseType;
                setUniverse(val);
                if (val === 'single') setUniverseFilterValue('RELIANCE');
                else if (val === 'market') setUniverseFilterValue(markets[0] || 'NSE_EQ');
                else if (val === 'group') setUniverseFilterValue(groups[0] || 'NIFTY_50');
                else if (val === 'sector') setUniverseFilterValue(sectors[0] || 'Technology');
                else if (val === 'industry') setUniverseFilterValue(industries[0] || 'IT Consulting');
                else if (val === 'watchlist') setUniverseFilterValue(savedWatchlists[0]?.id || '');
                else setUniverseFilterValue('');
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Stocks ({Object.keys(allMarketData).length})</option>
              <option value="single">Single Symbol</option>
              <option value="market">Market Segment</option>
              <option value="group">Index / Group</option>
              <option value="sector">Sector</option>
              <option value="industry">Industry</option>
              <option value="favorites">★ Favorites ({savedFavorites.size})</option>
              <option value="watchlist">Watchlist</option>
            </select>
          </div>
        </div>

        {/* Sub-filter Value for Universe */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Target Selection</span>
          </label>
          {universe === 'all' && (
            <div className="px-2 py-1.5 bg-slate-950/60 border border-slate-800 rounded text-slate-400 text-xs">
              Entire NSE Market ({Object.keys(allMarketData).length} Symbols)
            </div>
          )}
          {universe === 'single' && (
            <select
              value={universeFilterValue || 'RELIANCE'}
              onChange={(e) => setUniverseFilterValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {Object.keys(allMarketData).map((sym) => (
                <option key={sym} value={sym}>
                  {sym}
                </option>
              ))}
            </select>
          )}
          {universe === 'market' && (
            <select
              value={universeFilterValue || markets[0]}
              onChange={(e) => setUniverseFilterValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {markets.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
          {universe === 'group' && (
            <select
              value={universeFilterValue || groups[0]}
              onChange={(e) => setUniverseFilterValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}
          {universe === 'sector' && (
            <select
              value={universeFilterValue || sectors[0]}
              onChange={(e) => setUniverseFilterValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
          {universe === 'industry' && (
            <select
              value={universeFilterValue || industries[0]}
              onChange={(e) => setUniverseFilterValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          )}
          {universe === 'favorites' && (
            <div className="px-2 py-1.5 bg-slate-950/60 border border-slate-800 rounded text-amber-300 text-xs">
              ★ {savedFavorites.size} Saved Favorites
            </div>
          )}
          {universe === 'watchlist' && (
            <select
              value={universeFilterValue || savedWatchlists[0]?.id}
              onChange={(e) => setUniverseFilterValue(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {savedWatchlists.map((wl) => (
                <option key={wl.id} value={wl.id}>
                  {wl.name} ({wl.symbols.length} stocks)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* User-Defined Date Range */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Date Range Period</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Timeframe */}
        <div>
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mb-1">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Timeframe Interval</span>
          </label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="Daily">Daily (EOD)</option>
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="60m">60 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="5m">5 Minutes</option>
            <option value="1m">1 Minute</option>
          </select>
        </div>
      </div>

      {/* AFL Script Editor Drawer */}
      {showAflDrawer && (
        <div className="mt-3 p-3.5 bg-slate-900 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>AFL Exploration Formula (Edit & Re-Scan Instantly)</span>
            </span>
            <button
              onClick={() => setScanMode('custom_afl')}
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] rounded transition-colors"
            >
              Execute AFL Scan Across Selected Universe
            </button>
          </div>
          <textarea
            rows={6}
            value={activeCustomAfl}
            onChange={(e) => setActiveCustomAfl(e.target.value)}
            className="w-full bg-slate-950 p-3 rounded border border-slate-800 font-mono text-xs text-emerald-400 focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
            spellCheck={false}
          />
        </div>
      )}

      {/* Error Banner if AFL Syntax Fails */}
      {scanMode === 'custom_afl' && customAflResult.error && (
        <div className="mt-3 p-3 bg-rose-950/80 border border-rose-700 rounded-lg text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>AFL Execution Error: {customAflResult.error}</span>
        </div>
      )}

      {/* Filters & Presets Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        {scanMode === 'prebuilt' ? (
          <div className="flex flex-wrap items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            {[
              { id: 'DELIVERY_SHOCK', label: 'Delivery Volume Shock (>1.3x)' },
              { id: 'GOLDEN_CROSS', label: 'EMA 20/50 Golden Cross' },
              { id: 'SUPERTREND_BULL', label: 'Supertrend Bullish Reversal' },
              { id: 'RSI_OVERSOLD', label: 'RSI Oversold (<45)' },
              { id: 'HIGH_52W_BREAKOUT', label: '52-Week High Breakout (<4%)' },
              { id: 'ALL_EXPLORATION', label: 'Show All Signals' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => setSelectedPreset(preset.id as ScanPresetId)}
                className={`px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                  selectedPreset === preset.id
                    ? 'bg-slate-700 text-cyan-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="font-mono text-cyan-400">AddColumn()</span> columns exported dynamically from your custom AFL script.
          </div>
        )}

        {/* Search Input */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter symbols..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Exploration Results Table */}
      <div className="mt-3 flex-1 overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 font-mono border-b border-slate-800 select-none">
              <th className="py-2.5 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('symbol')}>
                <div className="flex items-center gap-1">
                  <span>Symbol</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('close')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Price (₹)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('changePct')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Change %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>

              {/* Dynamic AFL Columns or Standard Columns */}
              {scanMode === 'custom_afl' && customAflResult.columns.length > 0 ? (
                customAflResult.columns.map((col) => (
                  <th
                    key={col}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-cyan-300 font-bold"
                    onClick={() => handleSort(col)}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{col}</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                ))
              ) : (
                <>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('deliveryPct')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Delivery %</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('deliveryShock')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Deliv Shock</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('rsi')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>RSI (14)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center">Supertrend</th>
                </>
              )}

              <th className="py-2.5 px-3">Signal</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500">
                  No stocks match the exploration criteria in this universe or date range. Try adjusting the AFL Filter or preset.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr
                  key={row.symbol}
                  className="hover:bg-slate-800/50 transition-colors group cursor-pointer"
                  onClick={() => onSelectSymbolForChart(row.symbol)}
                >
                  <td className="py-2 px-3 font-bold text-white group-hover:text-cyan-400">{row.symbol}</td>
                  <td className="py-2 px-3 text-right text-slate-200 tabular-nums">{row.close.toFixed(2)}</td>
                  <td className={`py-2 px-3 text-right font-medium tabular-nums ${row.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {row.changePct >= 0 ? '+' : ''}{row.changePct.toFixed(2)}%
                  </td>

                  {/* Render Custom AFL Columns or Prebuilt Columns */}
                  {scanMode === 'custom_afl' && customAflResult.columns.length > 0 ? (
                    customAflResult.columns.map((col) => (
                      <td key={col} className="py-2 px-3 text-right text-cyan-300 tabular-nums font-semibold">
                        {row.customColumns?.[col] ?? '-'}
                      </td>
                    ))
                  ) : (
                    <>
                      <td className="py-2 px-3 text-right font-semibold text-cyan-400 tabular-nums">{row.deliveryPct.toFixed(1)}%</td>
                      <td className="py-2 px-3 text-right tabular-nums text-amber-300 font-semibold">{row.deliveryShock.toFixed(2)}x</td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-300">{row.rsi.toFixed(1)}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.supertrend === 'BULL' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                          {row.supertrend}
                        </span>
                      </td>
                    </>
                  )}

                  <td className="py-2 px-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${row.signal === 'BUY' ? 'bg-emerald-900 text-emerald-200' : row.signal === 'SELL' ? 'bg-rose-900 text-rose-200' : 'bg-slate-800 text-slate-400'}`}>
                      {row.signal}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSymbolForChart(row.symbol);
                      }}
                      className="px-2 py-0.5 text-[11px] rounded bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 transition-colors"
                    >
                      Open Chart
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
