import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Sliders,
  PlayCircle,
  Layers,
  Database,
  Cloud,
  Code2,
  Star,
  Search,
  BookOpen,
  ChevronDown,
  Sparkles,
  RefreshCw,
  FolderTree,
  X,
  ExternalLink,
  Menu,
  CheckCircle,
  TrendingUp,
  BarChart2,
  Download,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Box,
  Settings,
  Settings2,
} from 'lucide-react';
import { STOCK_UNIVERSE } from '../utils/sampleData';
import { ChartType, SubIndicatorType } from '../types/market';

export type ActiveTab =
  | 'chart'
  | 'scanner'
  | 'afl_ide'
  | 'backtest'
  | 'corporate_actions'
  | 'bhavcopy'
  | 'cloud_setup';

interface AmiBrokerHeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  availableSymbols: string[];
  isAdjusted: boolean;
  onToggleAdjusted: () => void;
  onOpenCloudGuide: () => void;
  onOpenCategoriesWatchlists: () => void;
  onOpenUserGuide: () => void;
  onOpenIndicatorCustomizer?: () => void;
  onSelectChartStyle?: (style: ChartType) => void;
  onSelectSubIndicator?: (indicator: SubIndicatorType) => void;
}

export const AmiBrokerHeader: React.FC<AmiBrokerHeaderProps> = ({
  activeTab,
  onTabChange,
  selectedSymbol,
  onSelectSymbol,
  availableSymbols,
  isAdjusted,
  onToggleAdjusted,
  onOpenCloudGuide,
  onOpenCategoriesWatchlists,
  onOpenUserGuide,
  onOpenIndicatorCustomizer,
  onSelectChartStyle,
  onSelectSubIndicator,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState<string | null>('workspaces');

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mainMenuRef = useRef<HTMLDivElement>(null);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (mainMenuRef.current && !mainMenuRef.current.contains(e.target as Node)) {
        setIsMainMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter available symbols matching search query
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return availableSymbols.slice(0, 8);
    }
    const q = searchQuery.trim().toUpperCase();
    return availableSymbols.filter((sym) => {
      if (sym.toUpperCase().includes(q)) return true;
      const meta = STOCK_UNIVERSE.find((s) => s.symbol === sym);
      if (meta && (meta.name.toUpperCase().includes(q) || meta.sector.toUpperCase().includes(q))) {
        return true;
      }
      return false;
    });
  }, [searchQuery, availableSymbols]);

  const currentMeta = STOCK_UNIVERSE.find((s) => s.symbol === selectedSymbol);

  const toggleSubmenu = (menuId: string) => {
    setExpandedSubmenu(expandedSubmenu === menuId ? null : menuId);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 px-3 py-1 flex items-center justify-between sticky top-0 z-40 select-none text-xs backdrop-blur">
      {/* ===================================================================== */}
      {/* LEFT SIDE: Symbol Search, Metadata & Quick Adjust (NO Logo on left)   */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Searchable Symbol Input Box */}
        <div className="relative" ref={searchContainerRef}>
          <div className="flex items-center bg-slate-900 border border-slate-700 hover:border-slate-600 focus-within:border-cyan-500 rounded px-2 py-1 gap-1.5 transition-colors">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              placeholder={`Symbol: ${selectedSymbol}`}
              className="bg-transparent text-xs font-mono font-bold text-cyan-300 placeholder-slate-500 focus:outline-none w-28 sm:w-40 uppercase"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-slate-300">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchOpen && (
            <div className="absolute left-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 max-h-64 overflow-y-auto font-mono text-[11px]">
              <div className="px-2.5 py-1 text-[10px] uppercase text-slate-500 font-semibold border-b border-slate-800">
                NSE Equity Universe ({searchResults.length})
              </div>
              {searchResults.length === 0 ? (
                <div className="p-2 text-center">
                  <div className="text-slate-400 text-[10px] mb-1.5">No loaded symbol for &quot;{searchQuery}&quot;</div>
                  <button
                    onClick={() => {
                      const cleanSym = searchQuery.trim().toUpperCase();
                      if (cleanSym) {
                        onSelectSymbol(cleanSym);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }
                    }}
                    className="w-full py-1.5 px-2 rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-[11px] shadow transition-all"
                  >
                    + Add & Load &quot;{searchQuery.trim().toUpperCase()}&quot; (Full History)
                  </button>
                </div>
              ) : (
                searchResults.map((sym) => {
                  const meta = STOCK_UNIVERSE.find((s) => s.symbol === sym);
                  const isCur = sym === selectedSymbol;
                  return (
                    <button
                      key={sym}
                      onClick={() => {
                        onSelectSymbol(sym);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition-colors ${
                        isCur ? 'bg-cyan-950/80 text-cyan-300 font-bold' : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{sym}</span>
                          {isCur && <span className="text-[9px] text-cyan-400">● Active</span>}
                        </div>
                        {meta && <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{meta.name}</div>}
                      </div>
                      {meta && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {meta.sector}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Selected Symbol Badge Tag */}
        {currentMeta && (
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400">{currentMeta.market}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300 truncate max-w-[120px]">{currentMeta.sector}</span>
          </div>
        )}

        {/* Adjusted vs Raw Bhavcopy Toggle */}
        <button
          onClick={onToggleAdjusted}
          title={
            isAdjusted
              ? 'Corporate Action Adjusted prices (splits/bonuses smoothed)'
              : 'Raw unadjusted historical Bhavcopy prices'
          }
          className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors ${
            isAdjusted
              ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300'
              : 'bg-amber-950/80 border-amber-500/60 text-amber-300'
          }`}
        >
          {isAdjusted ? 'ADJ: ON' : 'RAW BHAV'}
        </button>
      </div>

      {/* ===================================================================== */}
      {/* CENTER: Quick Nav Tabs on Large Screens                              */}
      {/* ===================================================================== */}
      <nav className="hidden lg:flex items-center gap-1 text-[11px] font-medium">
        <button
          onClick={() => onTabChange('chart')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            activeTab === 'chart'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Charts</span>
        </button>

        <button
          onClick={() => onTabChange('scanner')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            activeTab === 'scanner'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Scanner</span>
        </button>

        <button
          onClick={() => onTabChange('afl_ide')}
          title="AFL Formula Strategy IDE"
          className={`relative flex items-center gap-1.5 px-3 py-1 rounded border transition-all ${
            activeTab === 'afl_ide'
              ? 'bg-cyan-950 text-cyan-300 font-bold border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
              : 'bg-cyan-950/40 text-cyan-300 hover:text-white hover:bg-cyan-900/60 border-cyan-800/60'
          }`}
        >
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>AFL Strategy IDE</span>
        </button>

        <button
          onClick={() => onTabChange('backtest')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            activeTab === 'backtest'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>Backtest</span>
        </button>

        <button
          onClick={() => onTabChange('bhavcopy')}
          className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
            activeTab === 'bhavcopy'
              ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Bhavcopy</span>
        </button>
      </nav>

      {/* ===================================================================== */}
      {/* RIGHT SIDE: Action Buttons, Main Menu on Right & "AB" Logo on Right   */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-2">
        {/* Watchlists Button */}
        <button
          onClick={onOpenCategoriesWatchlists}
          className="hidden sm:flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/50 rounded transition-colors"
          title="AmiBroker Watchlists & Categories"
        >
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>Watchlists</span>
        </button>

        {/* Direct One-Tap ZIP Download Button - Instant Mobile Download */}
        <button
          onClick={async () => {
            try {
              const res = await fetch('/amibroker-web-project.zip');
              if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'amibroker-web-project.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } else {
                onOpenUserGuide();
              }
            } catch {
              onOpenUserGuide();
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded border border-cyan-400/50 shadow-sm transition-all cursor-pointer"
          title="Download Complete Project ZIP directly to your device"
        >
          <Download className="w-3.5 h-3.5 text-white animate-pulse" />
          <span>ZIP</span>
        </button>

        {/* User Guide Button - Visible on Mobile and Desktop */}
        <button
          onClick={onOpenUserGuide}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-cyan-300 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-700/60 rounded transition-colors shadow-sm"
          title="User Manual, Setup Files & Downloads"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">User Guide</span>
        </button>

        {/* ------------------------------------------------------------- */}
        {/* MAIN MENU ON RIGHT (Includes All Workspaces & Submenus)       */}
        {/* ------------------------------------------------------------- */}
        <div className="relative" ref={mainMenuRef}>
          <button
            onClick={() => setIsMainMenuOpen(!isMainMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-semibold text-xs shadow-sm transition-all"
            title="Open Main Menu (Charts, File, Analysis, Indicators, Moving Averages)"
          >
            <Menu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">Main Menu</span>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition-transform ${isMainMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Scrollable Right Dropdown Menu (Accessible on Mobile and Desktop) */}
          {isMainMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-slate-900/98 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-xs backdrop-blur max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-800/60">
              {/* Menu Header */}
              <div className="flex items-center justify-between pb-2 mb-2">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>AmiBroker Main Navigation</span>
                </span>
                <button
                  onClick={() => setIsMainMenuOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Direct Quick Action: Download Project ZIP & User Manual */}
              <div className="pb-2 space-y-1.5">
                <button
                  onClick={() => {
                    onOpenUserGuide();
                    setIsMainMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  title="Direct download amibroker-web-project.zip"
                >
                  <span className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-white" />
                    <span>Download Project ZIP & Files</span>
                  </span>
                  <Download className="w-3.5 h-3.5 text-white" />
                </button>

                <button
                  onClick={() => {
                    onOpenUserGuide();
                    setIsMainMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-cyan-200 text-xs font-semibold transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>View & Copy All Project Files</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              {/* Submenu 1: Charts & Workspaces */}
              <div className="py-2">
                <button
                  onClick={() => toggleSubmenu('workspaces')}
                  className="w-full flex items-center justify-between py-1 text-[11px] font-bold text-cyan-300 uppercase tracking-wider font-mono hover:text-white"
                >
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Workspaces & Charts</span>
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      expandedSubmenu === 'workspaces' ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {expandedSubmenu === 'workspaces' && (
                  <div className="mt-1 space-y-1 pl-1">
                    {[
                      { id: 'chart', label: 'Charts & Multi-Sheets', desc: 'Candlestick, indicators & drawings' },
                      { id: 'scanner', label: 'Scanner & Exploration', desc: 'Multi-symbol NSE filters' },
                      { id: 'afl_ide', label: 'AFL Strategy IDE (4 Momentum)', desc: 'Custom formulas & backtesting rules' },
                      { id: 'backtest', label: 'Portfolio Backtest Suite', desc: 'CAGR, MaxDD, Sharpe, Tax & Slippage' },
                      { id: 'bhavcopy', label: 'Bhavcopy Data Manager', desc: 'Import CSV, 20-yr historical EOD' },
                      { id: 'corporate_actions', label: 'Corporate Actions', desc: 'Splits, bonuses & adjustment' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => {
                          onTabChange(tab.id as ActiveTab);
                          setIsMainMenuOpen(false);
                        }}
                        className={`w-full text-left p-1.5 rounded transition-colors ${
                          activeTab === tab.id
                            ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="font-medium text-xs">{tab.label}</div>
                        <div className="text-[10px] text-slate-500">{tab.desc}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Submenu 2: File Menu */}
              <div className="py-2">
                <button
                  onClick={() => toggleSubmenu('file')}
                  className="w-full flex items-center justify-between py-1 text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono hover:text-white"
                >
                  <span className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>File</span>
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${expandedSubmenu === 'file' ? 'rotate-90' : ''}`}
                  />
                </button>

                {expandedSubmenu === 'file' && (
                  <div className="mt-1 space-y-1 pl-1">
                    <button
                      onClick={() => {
                        onTabChange('chart');
                        setIsMainMenuOpen(false);
                      }}
                      className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-slate-300 text-xs"
                    >
                      New Chart Sheet
                    </button>
                    <button
                      onClick={() => {
                        onTabChange('bhavcopy');
                        setIsMainMenuOpen(false);
                      }}
                      className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-slate-300 text-xs"
                    >
                      Import Bhavcopy (CSV / JSON)
                    </button>
                    <button
                      onClick={() => {
                        onOpenUserGuide();
                        setIsMainMenuOpen(false);
                      }}
                      className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-cyan-300 text-xs font-semibold flex items-center justify-between"
                    >
                      <span>Download User Manual (.md)</span>
                      <Download className="w-3 h-3 text-cyan-400" />
                    </button>
                    <button
                      onClick={() => {
                        onOpenUserGuide();
                        setIsMainMenuOpen(false);
                      }}
                      className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-emerald-300 text-xs font-semibold flex items-center justify-between"
                    >
                      <span>Download Setup Files & Scripts</span>
                      <Download className="w-3 h-3 text-emerald-400" />
                    </button>
                    <button
                      onClick={() => {
                        onOpenCloudGuide();
                        setIsMainMenuOpen(false);
                      }}
                      className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-slate-300 text-xs"
                    >
                      Cloudflare R2 Free Storage Pipeline
                    </button>
                  </div>
                )}
              </div>

              {/* Submenu 3: Analysis */}
              <div className="py-2">
                <button
                  onClick={() => toggleSubmenu('analysis')}
                  className="w-full flex items-center justify-between py-1 text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono hover:text-white"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Analysis</span>
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${expandedSubmenu === 'analysis' ? 'rotate-90' : ''}`}
                  />
                </button>

                {expandedSubmenu === 'analysis' && (
                  <div className="mt-1 space-y-1 pl-1">
                    <button
                      onClick={() => {
                        onTabChange('scanner');
                        setIsMainMenuOpen(false);
                      }}
                      className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-slate-300 text-xs"
                    >
                      Scanner & Exploration Filter
                    </button>
                    <button
                      onClick={() => {
                        onTabChange('afl_ide');
                        setIsMainMenuOpen(false);
                      }}
                      className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-slate-300 text-xs"
                    >
                      AFL Strategy & Formula IDE
                    </button>
                    <button
                      onClick={() => {
                        onTabChange('backtest');
                        setIsMainMenuOpen(false);
                      }}
                      className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-slate-300 text-xs"
                    >
                      Portfolio Backtester & Optimizer
                    </button>
                    <button
                      onClick={() => {
                        onOpenCategoriesWatchlists();
                        setIsMainMenuOpen(false);
                      }}
                      className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-slate-300 text-xs"
                    >
                      Symbol Categories & Watchlists (.abw)
                    </button>
                  </div>
                )}
              </div>

              {/* Submenu 4: Candle Styles */}
              <div className="py-2">
                <button
                  onClick={() => toggleSubmenu('candles')}
                  className="w-full flex items-center justify-between py-1 text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono hover:text-white"
                >
                  <span className="flex items-center gap-1.5">
                    <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Candle & Chart Styles</span>
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${expandedSubmenu === 'candles' ? 'rotate-90' : ''}`}
                  />
                </button>

                {expandedSubmenu === 'candles' && (
                  <div className="mt-1 space-y-1 pl-1">
                    <div className="text-[10px] text-slate-500 mb-1">
                      Click style to apply immediately:
                    </div>
                    {[
                      { id: 'candlestick' as ChartType, label: 'Candlestick' },
                      { id: 'ohlc_bar' as ChartType, label: 'OHLC Bar Chart' },
                      { id: 'line' as ChartType, label: 'Line Chart' },
                      { id: 'heikin_ashi' as ChartType, label: 'Heikin Ashi' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => {
                          onSelectChartStyle?.(st.id);
                          onTabChange('chart');
                          setIsMainMenuOpen(false);
                        }}
                        className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 text-xs flex items-center justify-between transition-colors"
                      >
                        <span>• {st.label}</span>
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Submenu 5: Moving Averages */}
              <div className="py-2">
                <button
                  onClick={() => toggleSubmenu('ma')}
                  className="w-full flex items-center justify-between py-1 text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono hover:text-white"
                >
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Moving Averages</span>
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${expandedSubmenu === 'ma' ? 'rotate-90' : ''}`}
                  />
                </button>

                {expandedSubmenu === 'ma' && (
                  <div className="mt-1 space-y-1.5 pl-1 text-slate-300 text-xs">
                    <button
                      onClick={() => {
                        onTabChange('chart');
                        onOpenIndicatorCustomizer?.();
                        setIsMainMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Settings2 className="w-4 h-4 text-white" />
                        <span>Customize All Moving Averages</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-white" />
                    </button>

                    <div className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                      Click to customize period, type (EMA/SMA/Hull), source & color:
                    </div>

                    {[
                      { name: 'Fast EMA (Period 20)', desc: 'Short-term momentum' },
                      { name: 'Slow EMA (Period 50)', desc: 'Medium-term trend' },
                      { name: 'Long Term SMA (Period 200)', desc: 'Institutional baseline' },
                      { name: 'Hull Moving Average (HULL)', desc: 'Zero-lag smoothing' },
                      { name: 'DEMA / TMA / WMA', desc: 'Advanced weighted averages' },
                      { name: 'Volume-Weighted Average Price (VWAP)', desc: 'Intraday volume anchor' },
                    ].map((ma) => (
                      <button
                        key={ma.name}
                        onClick={() => {
                          onTabChange('chart');
                          onOpenIndicatorCustomizer?.();
                          setIsMainMenuOpen(false);
                        }}
                        className="w-full text-left p-1.5 rounded hover:bg-slate-800 text-slate-200 hover:text-cyan-300 text-xs flex items-center justify-between transition-colors"
                      >
                        <div>
                          <div className="font-semibold">• {ma.name}</div>
                          <div className="text-[10px] text-slate-500 pl-2">{ma.desc}</div>
                        </div>
                        <Settings className="w-3 h-3 text-slate-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Submenu 6: Indicators (Overlays & Lower Panes) */}
              <div className="py-2">
                <button
                  onClick={() => toggleSubmenu('indicators')}
                  className="w-full flex items-center justify-between py-1 text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono hover:text-white"
                >
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Indicators & Lower Panes</span>
                  </span>
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${expandedSubmenu === 'indicators' ? 'rotate-90' : ''}`}
                  />
                </button>

                {expandedSubmenu === 'indicators' && (
                  <div className="mt-1 space-y-2 pl-1 text-[11px]">
                    <button
                      onClick={() => {
                        onTabChange('chart');
                        onOpenIndicatorCustomizer?.();
                        setIsMainMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-4 h-4 text-white" />
                        <span>Open Indicator Customizer (Popup)</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-white" />
                    </button>

                    {/* Chart Overlays */}
                    <div className="border-b border-slate-800 pb-2">
                      <span className="text-cyan-400 font-bold block mb-1">Chart Overlays (Click to customize):</span>
                      <div className="space-y-1">
                        {[
                          { name: 'Bollinger Bands (20, 2.0σ)', desc: 'Volatility bands' },
                          { name: 'Supertrend (10, 3.0 ATR)', desc: 'Trend direction stop' },
                          { name: 'ATR Trailing Stop (Chandelier)', desc: 'AmiBroker trailing exit' },
                          { name: 'Parabolic SAR (0.02, 0.20)', desc: 'Reversal accelerator' },
                          { name: 'Donchian Channels (20-bar)', desc: 'High-Low breakout channel' },
                          { name: 'Volume Profile & Delivery %', desc: 'Institutional volume shock' },
                        ].map((ov) => (
                          <button
                            key={ov.name}
                            onClick={() => {
                              onTabChange('chart');
                              onOpenIndicatorCustomizer?.();
                              setIsMainMenuOpen(false);
                            }}
                            className="w-full text-left p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 flex items-center justify-between transition-colors"
                          >
                            <span>• {ov.name}</span>
                            <span className="text-[10px] text-slate-500">{ov.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Lower Sub-Indicator Panes */}
                    <div>
                      <span className="text-amber-400 font-bold block mb-1">Lower Pane Oscillators (Click to apply):</span>
                      <div className="space-y-1">
                        {[
                          { id: 'rsi' as SubIndicatorType, name: 'RSI (Relative Strength Index 14)' },
                          { id: 'macd' as SubIndicatorType, name: 'MACD (12, 26, Signal 9)' },
                          { id: 'stochastic' as SubIndicatorType, name: 'Stochastic Oscillator (14, 3, 3)' },
                          { id: 'adx' as SubIndicatorType, name: 'ADX / Directional Movement Index' },
                          { id: 'atr' as SubIndicatorType, name: 'ATR (Average True Range 14)' },
                          { id: 'cci' as SubIndicatorType, name: 'CCI (Commodity Channel Index 20)' },
                          { id: 'williams_r' as SubIndicatorType, name: 'Williams %R Oscillator' },
                          { id: 'mfi' as SubIndicatorType, name: 'MFI (Money Flow Index 14)' },
                          { id: 'obv' as SubIndicatorType, name: 'OBV (On Balance Volume)' },
                          { id: 'roc' as SubIndicatorType, name: 'ROC (Rate of Change Momentum)' },
                        ].map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => {
                              onSelectSubIndicator?.(sub.id);
                              onTabChange('chart');
                              setIsMainMenuOpen(false);
                            }}
                            className="w-full text-left p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-amber-300 flex items-center justify-between transition-colors"
                          >
                            <span>• {sub.name}</span>
                            <ChevronRight className="w-3 h-3 text-slate-500" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* LOGO ON THE RIGHT: "AB" BADGE                                 */}
        {/* ------------------------------------------------------------- */}
        <div
          className="flex items-center justify-center px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/80 font-mono font-black text-xs text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)] tracking-wider"
          title="AmiBroker Web Edition"
        >
          AB
        </div>
      </div>
    </header>
  );
};
