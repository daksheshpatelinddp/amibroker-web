import React, { useState, useEffect } from 'react';
import {
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Copy,
  Check,
  Database,
  ArrowRight,
  ShieldCheck,
  Layers,
  Calendar,
  Zap,
  HardDrive,
  FileCheck,
  Lock,
  Search,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import {
  loadR2EndpointUrl,
  saveR2EndpointUrl,
  loadR2AutoSync,
  saveR2AutoSync,
  syncCloudflareR2Data,
  R2SyncResult,
} from '../utils/marketStorage';
import {
  loadDuckDBR2Url,
  saveDuckDBR2Url,
  loadDuckDBStartYear,
  saveDuckDBStartYear,
  getCurrentCalendarYear,
  getContinuousYearList,
  loadContinuousParquetRangeIntoDuckDB,
  getStockUniverseFromDuckDB,
  querySymbolCandlesFromDuckDB,
  getCachedParquetFiles,
  scanAndDiscoverAvailableYears,
} from '../utils/duckdbService';
import { CandleBar, StockMetadata } from '../types/market';

interface R2SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableSymbolsCount: number;
  activeSymbol?: string;
  onImportData: (marketData: Record<string, CandleBar[]>, stockUniverse?: StockMetadata[]) => void;
  onImportDuckDBSuccess?: (totalSymbols: number, years: number[]) => void;
}

export const R2SyncModal: React.FC<R2SyncModalProps> = ({
  isOpen,
  onClose,
  availableSymbolsCount,
  activeSymbol,
  onImportData,
  onImportDuckDBSuccess,
}) => {
  const currentCalendarYear = getCurrentCalendarYear();
  const [activeMode, setActiveMode] = useState<'duckdb_parquet' | 'daily_bhavcopy'>('duckdb_parquet');

  // Daily Bhavcopy State
  const [r2Url, setR2Url] = useState(() => loadR2EndpointUrl());
  const [autoSync, setAutoSync] = useState(() => loadR2AutoSync());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<R2SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<'bse' | 'nse' | 'cors'>('bse');

  // DuckDB WASM Parquet State
  const [duckdbR2Url, setDuckdbR2Url] = useState(() => loadDuckDBR2Url() || loadR2EndpointUrl());
  const [startYear, setStartYear] = useState<number>(() => loadDuckDBStartYear());
  const [isDuckDBLoading, setIsDuckDBLoading] = useState(false);
  const [duckdbProgress, setDuckdbProgress] = useState(0);
  const [duckdbStatusText, setDuckdbStatusText] = useState('');
  const [duckdbSuccessMsg, setDuckdbSuccessMsg] = useState<string | null>(null);
  const [duckdbError, setDuckdbError] = useState<string | null>(null);
  const [cachedParquetList, setCachedParquetList] = useState<string[]>([]);
  const [isScanningYears, setIsScanningYears] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [customYearInput, setCustomYearInput] = useState('');

  const startYearOptions = [
    { year: 2023, label: '2023 (Active in R2)' },
    { year: 2020, label: '2020 (6 Yrs)' },
    { year: 2015, label: '2015 (11 Yrs)' },
    { year: 2010, label: '2010 (16 Yrs)' },
    { year: 2005, label: '2005 (21 Yrs)' },
    { year: 2000, label: '2000 (Historical Backfill)' },
    { year: 1990, label: '1990 (Full Max History)' },
  ];
  const activeYearList = getContinuousYearList(startYear);

  useEffect(() => {
    if (isOpen && duckdbR2Url) {
      getCachedParquetFiles(duckdbR2Url, activeYearList).then(setCachedParquetList);
    }
  }, [isOpen, duckdbR2Url, startYear]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStartYearChange = (yr: number) => {
    if (yr >= 1990 && yr <= currentCalendarYear) {
      setStartYear(yr);
      saveDuckDBStartYear(yr);
      setScanMessage(null);
    }
  };

  const handleApplyCustomYear = () => {
    const yr = parseInt(customYearInput.trim(), 10);
    if (!isNaN(yr) && yr >= 1990 && yr <= currentCalendarYear) {
      handleStartYearChange(yr);
      setCustomYearInput('');
    } else {
      setDuckdbError(`Please enter a valid starting year between 1990 and ${currentCalendarYear}`);
    }
  };

  const handleReloadActiveSymbol = async () => {
    const sym = (activeSymbol || 'RELIANCE').trim().toUpperCase();
    try {
      const bars = await querySymbolCandlesFromDuckDB(sym);
      if (bars && bars.length > 0) {
        onImportData({ [sym]: bars });
        setDuckdbSuccessMsg(
          `Successfully loaded ${bars.length.toLocaleString()} continuous corporate-adjusted candles for ${sym} (${bars[0].date} to ${bars[bars.length - 1].date}) into the active chart!`
        );
      } else {
        setDuckdbError(`No candles found in DuckDB for ${sym}. Click "Load Parquet History" first.`);
      }
    } catch (e: any) {
      setDuckdbError(e.message || `Error loading candles for ${sym}`);
    }
  };

  // Auto-Scan R2 & Browser Cache for all available yearly Parquet files (1990 - current)
  const handleScanAvailableYears = async () => {
    const cleanUrl = duckdbR2Url.trim();
    if (!cleanUrl) {
      setDuckdbError('Please enter your Cloudflare R2 bucket public URL first to scan for available Parquet files.');
      return;
    }

    setIsScanningYears(true);
    setDuckdbError(null);
    setScanMessage(`Scanning Cloudflare R2 & Browser Cache for yearly parquet files (1990 - ${currentCalendarYear})...`);

    try {
      const scanRes = await scanAndDiscoverAvailableYears(cleanUrl, 1990, (pct, msg) => {
        setDuckdbProgress(pct);
        setDuckdbStatusText(msg);
      });

      if (scanRes.availableYears.length > 0) {
        const earliest = Math.min(...scanRes.availableYears);
        setStartYear(earliest);
        saveDuckDBStartYear(earliest);

        const cached = await getCachedParquetFiles(cleanUrl, scanRes.availableYears);
        setCachedParquetList(cached);

        setScanMessage(
          `Discovered ${scanRes.availableYears.length} available yearly parquet files: ${earliest} to ${Math.max(...scanRes.availableYears)}. (${scanRes.cachedYears.length} permanently cached in browser, ${scanRes.availableYears.length - scanRes.cachedYears.length} in R2). Starting year set to ${earliest}.`
        );
      } else {
        setScanMessage(
          `No yearly parquet files found between 1990 and ${currentCalendarYear}. Ensure your files are named like 2023.parquet, 2024.parquet, etc., and CORS is enabled in R2.`
        );
      }
    } catch (err: any) {
      setDuckdbError(err.message || 'Error scanning available years in R2.');
    } finally {
      setIsScanningYears(false);
    }
  };

  // Handle DuckDB WASM Continuous Parquet Ingestion
  const handleLoadDuckDB = async () => {
    const cleanUrl = duckdbR2Url.trim();
    if (!cleanUrl) {
      setDuckdbError('Please enter your Cloudflare R2 bucket public URL where your yearly .parquet files are stored.');
      return;
    }

    setIsDuckDBLoading(true);
    setDuckdbError(null);
    setDuckdbSuccessMsg(null);
    setDuckdbProgress(10);
    setDuckdbStatusText('Initializing DuckDB WASM In-Browser Engine...');

    try {
      saveDuckDBR2Url(cleanUrl);
      const res = await loadContinuousParquetRangeIntoDuckDB(cleanUrl, startYear, (pct, msg) => {
        setDuckdbProgress(pct);
        setDuckdbStatusText(msg);
      });

      // Update cached list
      const cached = await getCachedParquetFiles(cleanUrl, activeYearList);
      setCachedParquetList(cached);

      setDuckdbStatusText('Retrieving distinct stock universe from DuckDB...');
      const universe = await getStockUniverseFromDuckDB();

      // Preload active symbol and high-liquidity bellwethers directly so chart updates immediately!
      const targetActive = (activeSymbol || 'RELIANCE').trim().toUpperCase();
      const prioritySymbols = Array.from(new Set([
        targetActive,
        'RELIANCE',
        'TCS',
        'INFY',
        'HDFCBANK',
        'ICICIBANK',
        'TATAMOTORS',
        'TATASTEEL',
        'SBIN',
        ...universe.slice(0, 50).map((u) => u.symbol),
      ]));

      const marketDataBatch: Record<string, CandleBar[]> = {};
      for (const sym of prioritySymbols) {
        try {
          const bars = await querySymbolCandlesFromDuckDB(sym);
          if (bars && bars.length > 0) marketDataBatch[sym] = bars;
        } catch (e) {}
      }

      onImportData(marketDataBatch, universe);
      onImportDuckDBSuccess?.(universe.length, res.registeredYears);

      const newListings = universe.filter((u) => u.isNewListing);

      setDuckdbSuccessMsg(
        `Continuous chart history from ${Math.min(...res.registeredYears)} to ${Math.max(...res.registeredYears)} successfully loaded! ${universe.length.toLocaleString()} symbols ready with corporate action adjustments.${
          newListings.length > 0
            ? ` ${newListings.length} newly listed symbols detected with first day of trading in ${currentCalendarYear}.parquet (e.g. ${newListings.slice(0, 3).map((s) => s.symbol).join(', ')})!`
            : ''
        } Historical years cached permanently; ${currentCalendarYear} updates daily.`
      );
    } catch (err: any) {
      setDuckdbError(err.message || 'Failed to load continuous Parquet files into DuckDB WASM.');
    } finally {
      setIsDuckDBLoading(false);
    }
  };

  // Handle Standard Daily Bhavcopy Sync
  const handleSyncDailyBhavcopy = async () => {
    const clean = r2Url.trim();
    if (!clean) {
      setSyncError('Please enter your Cloudflare R2 bucket public URL (e.g. https://pub-xxxx.r2.dev)');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    setSyncResult(null);

    try {
      saveR2EndpointUrl(clean);
      const res = await syncCloudflareR2Data(clean);
      setSyncResult(res);

      if (res.marketData && Object.keys(res.marketData).length > 0) {
        onImportData(res.marketData, res.stockUniverse);
      }
    } catch (err: any) {
      setSyncError(err.message || 'Failed to sync with Cloudflare R2.');
    } finally {
      setIsSyncing(false);
    }
  };

  const corsSnippet = JSON.stringify(
    [
      {
        AllowedOrigins: ['*'],
        AllowedMethods: ['GET', 'HEAD'],
        AllowedHeaders: ['*'],
        MaxAgeSeconds: 86400,
      },
    ],
    null,
    2
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-600/40 text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Cloudflare R2 Parquet & DuckDB WASM Engine
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono border border-emerald-700/50">
                  {availableSymbolsCount > 100 ? `${availableSymbolsCount.toLocaleString()} Symbols Active` : `${availableSymbolsCount} Symbols (Local Sample)`}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Continuous Corporate-Adjusted Parquet History · Permanent Browser Caching · Read-Only
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-950/90 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveMode('duckdb_parquet')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-2 transition-all ${
              activeMode === 'duckdb_parquet'
                ? 'bg-slate-900 text-cyan-300 border-b-2 border-cyan-400 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Corporate-Adjusted Parquet (DuckDB WASM)</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50 font-mono">
              Continuous
            </span>
          </button>
          <button
            onClick={() => setActiveMode('daily_bhavcopy')}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-2 transition-all ${
              activeMode === 'daily_bhavcopy'
                ? 'bg-slate-900 text-emerald-300 border-b-2 border-emerald-400 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Legacy Bhavcopy Delta (JSON/CSV)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* ========================================================================= */}
          {/* TAB 1: DUCKDB WASM CONTINUOUS PARQUET                                    */}
          {/* ========================================================================= */}
          {activeMode === 'duckdb_parquet' && (
            <div className="space-y-4">
              {/* Feature highlight card */}
              <div className="p-3.5 bg-gradient-to-r from-cyan-950/40 via-slate-950 to-slate-950 border border-cyan-800/40 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-cyan-200 text-xs">
                      Continuous Unbroken History (Read-Only Guaranteed)
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700/50">
                    Zero R2 Class B Reads
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-cyan-300 flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-cyan-400" />
                      <span>Historical Years ({startYear} - {currentCalendarYear - 1})</span>
                    </div>
                    <p className="text-slate-400">
                      <strong>Permanently Cached</strong> in browser. Downloaded once, never queried from R2 again.
                    </p>
                  </div>

                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-amber-300 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-amber-400" />
                      <span>Current Year ({currentCalendarYear})</span>
                    </div>
                    <p className="text-slate-400">
                      <strong>Refreshed Daily</strong> once per day on first load to capture today's EOD data.
                    </p>
                  </div>

                  <div className="p-2 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
                    <div className="font-bold text-emerald-300 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Strictly Read-Only</span>
                    </div>
                    <p className="text-slate-400">
                      Only HTTP GET calls. The app will <strong>never write, edit, or delete</strong> files in R2.
                    </p>
                  </div>
                </div>
              </div>

              {/* Parquet Endpoint Input Card */}
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span>R2 Parquet Bucket Public URL / Domain</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Contains: {startYear}.parquet ... {currentCalendarYear}.parquet
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={duckdbR2Url}
                    onChange={(e) => setDuckdbR2Url(e.target.value)}
                    placeholder="https://pub-xxxx.r2.dev or https://parquet-data.yourdomain.com"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded text-slate-100 font-mono text-xs placeholder:text-slate-600 outline-none"
                  />
                  <button
                    onClick={handleLoadDuckDB}
                    disabled={isDuckDBLoading}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold rounded flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-w-[170px]"
                  >
                    {isDuckDBLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading ({duckdbProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-yellow-300" />
                        <span>Load Parquet History</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Continuous Range Config: Choose Start Year */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-300">
                    <span className="font-semibold text-slate-200">History Starting Year:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400">
                        Unbroken Range: {startYear} $\rightarrow$ {currentCalendarYear} Live ({activeYearList.length} Years)
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {startYearOptions.map((opt) => (
                      <button
                        key={opt.year}
                        onClick={() => handleStartYearChange(opt.year)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
                          startYear === opt.year
                            ? 'bg-cyan-600 text-white font-bold shadow-sm'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}

                    <div className="flex items-center gap-1 pl-1">
                      <input
                        type="number"
                        min={1990}
                        max={currentCalendarYear}
                        value={customYearInput}
                        onChange={(e) => setCustomYearInput(e.target.value)}
                        placeholder="Year"
                        className="w-16 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] font-mono text-white text-center"
                      />
                      <button
                        onClick={handleApplyCustomYear}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded text-[11px] font-medium"
                      >
                        Set
                      </button>
                    </div>

                    <button
                      onClick={handleScanAvailableYears}
                      disabled={isScanningYears || isDuckDBLoading}
                      className="ml-auto px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-cyan-500/50 text-cyan-300 font-semibold text-[11px] flex items-center gap-1.5 transition-all disabled:opacity-50"
                      title="Probe Cloudflare R2 bucket to auto-discover all uploaded yearly files (1990-present)"
                    >
                      {isScanningYears ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                      ) : (
                        <Search className="w-3 h-3 text-cyan-400" />
                      )}
                      <span>Auto-Scan R2 for Uploaded Years (1990 - {currentCalendarYear})</span>
                    </button>
                  </div>

                  {scanMessage && (
                    <div className="p-2 rounded bg-cyan-950/60 border border-cyan-700/60 text-cyan-200 text-[11px] flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{scanMessage}</span>
                    </div>
                  )}

                  {/* Active sequence display */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {activeYearList.map((yr) => {
                      const isCur = yr === currentCalendarYear;
                      const isCached = cachedParquetList.includes(`${yr}.parquet`);
                      return (
                        <div
                          key={yr}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 ${
                            isCur
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-600/60 font-bold'
                              : isCached
                              ? 'bg-slate-900 text-emerald-300 border border-emerald-800/60'
                              : 'bg-slate-900 text-cyan-300 border border-slate-800'
                          }`}
                        >
                          <span>{yr}.parquet</span>
                          {isCur ? (
                            <span className="text-[9px] text-amber-400">● Daily EOD</span>
                          ) : isCached ? (
                            <span className="text-[9px] text-emerald-400">✓ Permanently Cached</span>
                          ) : (
                            <span className="text-[9px] text-slate-500">Ready in R2</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quick Chart Ingestion Card if cached files exist */}
              {cachedParquetList.length > 0 && (
                <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-950/70 via-slate-900 to-slate-950 border border-cyan-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-md">
                  <div className="text-[11px] text-cyan-200">
                    <div className="font-bold flex items-center gap-1.5 text-cyan-300">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Cached Parquet History Ready ({cachedParquetList.length} Years)</span>
                    </div>
                    <span className="text-slate-400 block text-[10px] pt-0.5">
                      Active Chart Symbol: <strong className="text-white font-mono">{activeSymbol || 'RELIANCE'}</strong>. Replaces stale single-day Bhavcopy bars with complete multi-year corporate-adjusted candles.
                    </span>
                  </div>
                  <button
                    onClick={handleReloadActiveSymbol}
                    disabled={isDuckDBLoading}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shrink-0 shadow transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Load {activeSymbol || 'RELIANCE'} into Chart</span>
                  </button>
                </div>
              )}

              {/* Progress Bar */}
              {isDuckDBLoading && (
                <div className="p-3 bg-slate-950 border border-cyan-800/60 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-cyan-300 font-medium flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                      <span>{duckdbStatusText || 'Loading continuous history in DuckDB WASM...'}</span>
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">{duckdbProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                      style={{ width: `${duckdbProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success Banner */}
              {duckdbSuccessMsg && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-lg text-emerald-200 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Continuous History Successfully Loaded!</span>
                  </div>
                  <p className="text-[11px] text-emerald-300/90 leading-relaxed">{duckdbSuccessMsg}</p>
                  <div className="flex items-center gap-3 pt-1 text-[10px] font-mono text-slate-300">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-cyan-400" />
                      <span>Zero Chart Continuity Gaps</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <FileCheck className="w-3 h-3 text-emerald-400" />
                      <span>Corporate Action Adjustments Integrated</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {duckdbError && (
                <div className="p-3 bg-rose-950/60 border border-rose-700/60 rounded-lg text-rose-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Notice</span>
                  </div>
                  <p className="text-[11px] text-rose-300/90">{duckdbError}</p>
                </div>
              )}

              {/* Comprehensive Architecture Guarantees & Backfill Guide */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5 text-[11px]">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>How Corporate-Adjusted Parquet Caching Operates in Your App</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-400 text-[10px] leading-relaxed">
                  <div className="p-2 bg-slate-900/60 border border-slate-800/80 rounded-lg space-y-1">
                    <div className="font-semibold text-cyan-300 flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-cyan-400" />
                      <span>Permanent Browser Caching (Zero Class B Reads)</span>
                    </div>
                    <p>
                      Historical files (e.g. <code>2023.parquet</code>, <code>2024.parquet</code>, <code>2025.parquet</code>) never change once a year closes. The browser saves them in <code>CacheStorage</code>. Every future visit loads directly from local disk with <strong>0 Class B read requests</strong> to Cloudflare R2!
                    </p>
                  </div>

                  <div className="p-2 bg-slate-900/60 border border-slate-800/80 rounded-lg space-y-1">
                    <div className="font-semibold text-amber-300 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-amber-400" />
                      <span>Daily Auto-Refresh for Current Year ({currentCalendarYear})</span>
                    </div>
                    <p>
                      The current year file (<code>{currentCalendarYear}.parquet</code>) is updated daily in R2 at market close. The app checks once per calendar day, downloads the fresh EOD update, and merges it seamlessly with your historical candles.
                    </p>
                  </div>

                  <div className="p-2 bg-slate-900/60 border border-slate-800/80 rounded-lg space-y-1">
                    <div className="font-semibold text-emerald-300 flex items-center gap-1">
                      <FileCheck className="w-3 h-3 text-emerald-400" />
                      <span>Gapless Chart Continuity</span>
                    </div>
                    <p>
                      DuckDB WASM unifies all yearly Parquet files chronologically in memory. All 3000+ NSE & BSE scrips display continuous multi-year candles with corporate action adjustments baked in.
                    </p>
                  </div>

                  <div className="p-2 bg-slate-900/60 border border-slate-800/80 rounded-lg space-y-1">
                    <div className="font-semibold text-purple-300 flex items-center gap-1">
                      <Search className="w-3 h-3 text-purple-400" />
                      <span>Historical Backfill Ready (1990 - 2022)</span>
                    </div>
                    <p>
                      Right now R2 contains 2023 to {currentCalendarYear}. Whenever you upload older years (e.g. <code>2000.parquet</code> or <code>1990.parquet</code>), click <strong>Auto-Scan R2</strong>. The browser will detect and permanently cache them without re-downloading existing files.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/30 p-2 rounded border border-emerald-800/40">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>
                    <strong>Strictly Read-Only Guarantee:</strong> The app only performs read-only HTTP GET/HEAD requests. It will never write, alter, or delete any files in your R2 bucket.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: STANDARD DAILY LIVE BHAVCOPY DELTA                                 */}
          {/* ========================================================================= */}
          {activeMode === 'daily_bhavcopy' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Daily EOD Bhavcopy R2 Bucket URL</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">Zero Egress Fees</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={r2Url}
                    onChange={(e) => setR2Url(e.target.value)}
                    placeholder="https://pub-xxxx.r2.dev or https://your-custom-domain.com"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded text-slate-100 font-mono text-xs placeholder:text-slate-600 outline-none"
                  />
                  <button
                    onClick={handleSyncDailyBhavcopy}
                    disabled={isSyncing}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold rounded flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-w-[130px]"
                  >
                    {isSyncing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Sync Daily Data</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => {
                        setAutoSync(e.target.checked);
                        saveR2AutoSync(e.target.checked);
                      }}
                      className="rounded text-cyan-500"
                    />
                    <span>Automatically sync daily bhavcopy on app startup</span>
                  </label>
                </div>
              </div>

              {syncResult && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-lg text-emerald-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Daily Bhavcopy Synchronization Successful!</span>
                  </div>
                  <div className="text-[11px] text-emerald-300/90">{syncResult.message}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
                    <div className="p-1.5 bg-black/40 rounded">
                      <span className="text-slate-400 block">Total Symbols:</span>
                      <span className="text-white font-bold">{syncResult.totalSymbols.toLocaleString()}</span>
                    </div>
                    <div className="p-1.5 bg-black/40 rounded">
                      <span className="text-slate-400 block">Total Candles:</span>
                      <span className="text-white font-bold">{syncResult.totalBars.toLocaleString()}</span>
                    </div>
                    <div className="p-1.5 bg-black/40 rounded">
                      <span className="text-slate-400 block">Source:</span>
                      <span className="text-white font-bold">{syncResult.source}</span>
                    </div>
                    <div className="p-1.5 bg-black/40 rounded">
                      <span className="text-slate-400 block">Storage:</span>
                      <span className="text-white font-bold">IndexedDB</span>
                    </div>
                  </div>
                </div>
              )}

              {syncError && (
                <div className="p-3 bg-rose-950/60 border border-rose-700/60 rounded-lg text-rose-200 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Sync Notice</span>
                  </div>
                  <p className="text-[11px] text-rose-300/90">{syncError}</p>
                </div>
              )}
            </div>
          )}

          {/* CORS Help Box */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Cloudflare R2 CORS Configuration</span>
              <button
                onClick={() => handleCopy(corsSnippet, 'cors')}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                {copiedKey === 'cors' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy CORS Rule</span>
              </button>
            </div>
            <p className="text-slate-400 text-[10px]">
              In Cloudflare Dashboard $\rightarrow$ <strong>R2</strong> $\rightarrow$ Select your bucket $\rightarrow$ <strong>Settings</strong> $\rightarrow$ <strong>CORS Policy</strong> $\rightarrow$ Paste:
            </p>
            <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[10px] text-cyan-300 overflow-x-auto">
              <pre>{corsSnippet}</pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Historical years permanently cached · Current year refreshed daily · Read-only
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
