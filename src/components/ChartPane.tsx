import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CandleBar,
  ChartSheet,
  ChartType,
  CorporateAction,
  CustomMaConfig,
  DrawingItem,
  DrawingToolType,
  IndicatorSettings,
  MovingAverageSource,
  MovingAverageType,
  SubIndicatorType,
  Timeframe,
  VolumePlotMode,
} from '../types/market';
import {
  calculateADX,
  calculateATR,
  calculateATRTrailingStop,
  calculateBollingerBands,
  calculateCCI,
  calculateDeliveryShock,
  calculateDonchian,
  calculateEMA,
  calculateHeikinAshi,
  calculateMACD,
  calculateMFI,
  calculateMovingAverage,
  calculateOBV,
  calculateParabolicSAR,
  calculateROC,
  calculateRSI,
  calculateSMA,
  calculateStochastic,
  calculateSupertrend,
  calculateVWAP,
  calculateWilliamsR,
  resampleCandles,
} from '../utils/indicators';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Settings2,
  MousePointer,
  TrendingUp,
  Minus,
  Maximize2,
  Ruler,
  Eraser,
  Split,
  Eye,
  EyeOff,
  Square,
  Columns,
  Layers,
  Copy,
  Edit2,
  Check,
  X,
  Activity,
  ArrowUpRight,
  Sliders,
  BarChart2,
  CheckSquare,
  Square as SquareIcon,
  Lock,
  Unlock,
  Link2,
  Crosshair,
} from 'lucide-react';
import { DrawingOverlay } from './DrawingOverlay';
import {
  loadDrawings,
  saveDrawings,
  clearDrawings,
} from '../utils/drawingStorage';

import { adjustCandleHistory } from '../utils/corporateActions';

interface ChartPaneProps {
  candles: CandleBar[];
  symbol: string;
  corporateActions: CorporateAction[];
  isAdjusted: boolean;
  onToggleAdjusted: () => void;
  allMarketData?: Record<string, CandleBar[]>;
  onSelectSymbol?: (symbol: string) => void;
}

const DEFAULT_SETTINGS: IndicatorSettings = {
  mas: [
    { id: 'ma-1', name: 'Fast EMA', type: 'EMA', sourceField: 'close', period: 20, color: '#06b6d4', strokeWidth: 1.5, visible: true },
    { id: 'ma-2', name: 'Slow EMA', type: 'EMA', sourceField: 'close', period: 50, color: '#f59e0b', strokeWidth: 1.5, visible: true },
    { id: 'ma-3', name: 'Long Term SMA', type: 'SMA', sourceField: 'close', period: 200, color: '#a855f7', strokeWidth: 1.8, visible: true },
  ],
  bollinger: {
    enabled: false,
    period: 20,
    stdDev: 2.0,
    color: '#38bdf8',
  },
  supertrend: {
    enabled: false,
    period: 10,
    multiplier: 3.0,
  },
  atrTrailingStop: {
    enabled: false,
    period: 14,
    multiplier: 3.0,
    type: 'chandelier',
    color: '#10b981',
  },
  parabolicSar: {
    enabled: false,
    acceleration: 0.02,
    maximum: 0.2,
    color: '#c084fc',
  },
  donchian: {
    enabled: false,
    period: 20,
    color: '#f97316',
  },
  rsi: {
    period: 14,
    overbought: 70,
    oversold: 30,
    color: '#818cf8',
  },
  macd: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
  },
  stochastic: {
    kPeriod: 14,
    dPeriod: 3,
    slowing: 3,
    overbought: 80,
    oversold: 20,
  },
  adx: {
    period: 14,
    threshold: 25,
  },
  atr: {
    period: 14,
    color: '#ec4899',
  },
  cci: {
    period: 20,
    color: '#eab308',
  },
  mfi: {
    period: 14,
    color: '#14b8a6',
  },
  williamsR: {
    period: 14,
    color: '#a855f7',
  },
  obv: {
    enabled: false,
    color: '#06b6d4',
  },
  roc: {
    period: 14,
    color: '#f43f5e',
  },
  showVolume: true,
  showDeliveryOverlay: true,
  showVwap: false,
  volumeMode: 'both',
  volumeMa: {
    enabled: true,
    period: 20,
    color: '#f59e0b',
  },
};

const INITIAL_SHEETS: ChartSheet[] = [
  {
    id: 'sheet-1',
    chartId: 1001,
    name: 'Sheet 1: Daily Trend',
    symbol: 'RELIANCE',
    timeframe: '1D',
    chartType: 'candlestick',
    subIndicator: 'rsi',
    indicatorSettings: { ...DEFAULT_SETTINGS },
    drawings: loadDrawings('RELIANCE', 1001),
    symbolLocked: false,
    symbolLinkGroup: 'green',
    timeframeLocked: false,
    timeframeLinkGroup: 'green',
  },
  {
    id: 'sheet-2',
    chartId: 1002,
    name: 'Sheet 2: Intraday Scalp',
    symbol: 'RELIANCE',
    timeframe: '15m',
    chartType: 'candlestick',
    subIndicator: 'macd',
    indicatorSettings: {
      ...DEFAULT_SETTINGS,
      atrTrailingStop: { enabled: true, period: 14, multiplier: 3.0, type: 'chandelier', color: '#10b981' },
      supertrend: { enabled: true, period: 10, multiplier: 3.0 },
    },
    drawings: loadDrawings('RELIANCE', 1002),
    symbolLocked: false,
    symbolLinkGroup: 'green',
    timeframeLocked: true,
    timeframeLinkGroup: 'none',
  },
  {
    id: 'sheet-3',
    chartId: 1003,
    name: 'Sheet 3: Weekly Structural',
    symbol: 'RELIANCE',
    timeframe: '1W',
    chartType: 'candlestick',
    subIndicator: 'stochastic',
    indicatorSettings: { ...DEFAULT_SETTINGS },
    drawings: loadDrawings('RELIANCE', 1003),
    symbolLocked: false,
    symbolLinkGroup: 'green',
    timeframeLocked: true,
    timeframeLinkGroup: 'none',
  },
];

/**
 * Extracts number series array from candle bars based on source field
 */
function extractSeries(candles: CandleBar[], source: MovingAverageSource = 'close'): number[] {
  switch (source) {
    case 'open':
      return candles.map((c) => c.open);
    case 'high':
      return candles.map((c) => c.high);
    case 'low':
      return candles.map((c) => c.low);
    case 'volume':
      return candles.map((c) => c.volume);
    case 'deliveryQty':
      return candles.map((c) => c.deliveryQty ?? Math.round(c.volume * 0.45));
    case 'hl2':
      return candles.map((c) => (c.high + c.low) / 2);
    case 'hlc3':
      return candles.map((c) => (c.high + c.low + c.close) / 3);
    case 'close':
    default:
      return candles.map((c) => c.close);
  }
}

export const ChartPane: React.FC<ChartPaneProps> = ({
  candles,
  symbol,
  corporateActions,
  isAdjusted,
  onToggleAdjusted,
  allMarketData,
  onSelectSymbol,
}) => {
  // Chart Sheets State
  const [sheets, setSheets] = useState<ChartSheet[]>(INITIAL_SHEETS);
  const [activeSheetId, setActiveSheetId] = useState<string>('sheet-1');
  const [layoutMode, setLayoutMode] = useState<'single' | 'split-h' | 'split-v' | 'quad'>('single');
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editSheetName, setEditSheetName] = useState<string>('');

  // Active sheet
  const activeSheet = useMemo(() => {
    return sheets.find((s) => s.id === activeSheetId) || sheets[0];
  }, [sheets, activeSheetId]);

  // Sync symbol changes to active sheet and any linked sheets
  useEffect(() => {
    setSheets((prev) => {
      const active = prev.find((s) => s.id === activeSheetId) || prev[0];
      const linkGroup = active?.symbolLinkGroup || 'green';

      return prev.map((s) => {
        if (s.symbolLocked) return s;
        if (s.id === activeSheetId || (linkGroup !== 'none' && (s.symbolLinkGroup || 'green') === linkGroup)) {
          return { ...s, symbol };
        }
        return s;
      });
    });
  }, [symbol, activeSheetId]);

  // Handle Sheet updates with symbol and timeframe linking across panes
  const handleUpdateSheet = (updated: ChartSheet) => {
    setSheets((prev) => {
      const oldSheet = prev.find((s) => s.id === updated.id);
      return prev.map((s) => {
        if (s.id === updated.id) return updated;

        let nextSheet = { ...s };

        // Symbol Link Syncing across sheets
        if (oldSheet && oldSheet.symbol !== updated.symbol) {
          const group = updated.symbolLinkGroup || 'green';
          if (!s.symbolLocked && group !== 'none' && (s.symbolLinkGroup || 'green') === group) {
            nextSheet.symbol = updated.symbol;
          }
        }

        // Timeframe Link Syncing across sheets
        if (oldSheet && oldSheet.timeframe !== updated.timeframe) {
          const group = updated.timeframeLinkGroup || 'green';
          if (!s.timeframeLocked && group !== 'none' && (s.timeframeLinkGroup || 'green') === group) {
            nextSheet.timeframe = updated.timeframe;
          }
        }

        return nextSheet;
      });
    });
  };

  // Add new sheet
  const handleAddSheet = () => {
    const nextChartId = 1000 + sheets.length + 1;
    const initialDrawings = loadDrawings(activeSheet.symbol, nextChartId);
    const newSheet: ChartSheet = {
      id: `sheet-${Date.now()}`,
      chartId: nextChartId,
      name: `Sheet ${sheets.length + 1}: Chart #${nextChartId}`,
      symbol: activeSheet.symbol,
      timeframe: '1D',
      chartType: 'candlestick',
      subIndicator: 'rsi',
      indicatorSettings: { ...DEFAULT_SETTINGS },
      drawings: initialDrawings,
      symbolLocked: false,
      symbolLinkGroup: 'green',
      timeframeLocked: false,
      timeframeLinkGroup: 'green',
    };
    setSheets([...sheets, newSheet]);
    setActiveSheetId(newSheet.id);
  };

  // Duplicate sheet
  const handleDuplicateSheet = (sheetId: string) => {
    const source = sheets.find((s) => s.id === sheetId);
    if (!source) return;
    const nextChartId = 1000 + sheets.length + 1;
    const clonedDrawings = (source.drawings || []).map((d) => ({
      ...d,
      id: `draw-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      chartId: nextChartId,
    }));
    saveDrawings(source.symbol, nextChartId, clonedDrawings);
    const duplicated: ChartSheet = {
      ...source,
      id: `sheet-${Date.now()}`,
      chartId: nextChartId,
      name: `${source.name} (Copy)`,
      drawings: clonedDrawings,
    };
    setSheets([...sheets, duplicated]);
    setActiveSheetId(duplicated.id);
  };

  // Delete sheet
  const handleDeleteSheet = (sheetId: string) => {
    if (sheets.length <= 1) return;
    const filtered = sheets.filter((s) => s.id !== sheetId);
    setSheets(filtered);
    if (activeSheetId === sheetId) {
      setActiveSheetId(filtered[0].id);
    }
  };

  // Sheets to display based on layout mode
  const displayedSheets = useMemo(() => {
    if (layoutMode === 'single') return [activeSheet];
    if (layoutMode === 'split-h' || layoutMode === 'split-v') {
      return sheets.slice(0, 2);
    }
    return sheets.slice(0, 4);
  }, [layoutMode, activeSheet, sheets]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Chart Workspace (Single, Split, or Quad Grid) */}
      <div
        className={`flex-1 overflow-hidden grid ${
          layoutMode === 'single'
            ? 'grid-cols-1 grid-rows-1'
            : layoutMode === 'split-h'
            ? 'grid-cols-2 grid-rows-1 gap-1'
            : layoutMode === 'split-v'
            ? 'grid-cols-1 grid-rows-2 gap-1'
            : 'grid-cols-2 grid-rows-2 gap-1'
        }`}
      >
        {displayedSheets.map((sheet) => {
          const sheetCandles =
            allMarketData && allMarketData[sheet.symbol]
              ? allMarketData[sheet.symbol]
              : candles;

          return (
            <SingleChartEngine
              key={sheet.id}
              sheet={sheet}
              baseCandles={sheetCandles}
              corporateActions={corporateActions}
              isAdjusted={isAdjusted}
              onToggleAdjusted={onToggleAdjusted}
              isActive={sheet.id === activeSheetId}
              onActivate={() => setActiveSheetId(sheet.id)}
              onUpdateSheet={handleUpdateSheet}
              onSelectSymbol={onSelectSymbol}
              availableSymbols={allMarketData ? Object.keys(allMarketData) : [sheet.symbol]}
            />
          );
        })}
      </div>

      {/* Bottom AmiBroker Sheet Tabs & Layout Controls */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-950 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {sheets.map((sheet) => {
            const isCur = sheet.id === activeSheetId;
            return (
              <div
                key={sheet.id}
                onClick={() => setActiveSheetId(sheet.id)}
                className={`group flex items-center gap-1.5 px-3 py-1 rounded text-xs cursor-pointer border transition-colors ${
                  isCur
                    ? 'bg-slate-800 text-cyan-300 font-semibold border-cyan-500/50 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800'
                }`}
              >
                <span className="font-mono text-[10px] text-slate-500">#{sheet.chartId}</span>
                {editingSheetId === sheet.id ? (
                  <input
                    type="text"
                    value={editSheetName}
                    autoFocus
                    onChange={(e) => setEditSheetName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSheets((prev) =>
                          prev.map((s) => (s.id === sheet.id ? { ...s, name: editSheetName } : s))
                        );
                        setEditingSheetId(null);
                      } else if (e.key === 'Escape') {
                        setEditingSheetId(null);
                      }
                    }}
                    onBlur={() => {
                      setSheets((prev) =>
                        prev.map((s) => (s.id === sheet.id ? { ...s, name: editSheetName } : s))
                      );
                      setEditingSheetId(null);
                    }}
                    className="bg-slate-950 text-cyan-300 px-1 py-0.5 rounded text-xs font-mono outline-none border border-cyan-500"
                  />
                ) : (
                  <span
                    onDoubleClick={() => {
                      setEditingSheetId(sheet.id);
                      setEditSheetName(sheet.name);
                    }}
                    title="Double click or use edit icon to rename"
                    className="cursor-pointer hover:underline"
                  >
                    {sheet.name}
                  </span>
                )}

                {/* Rename Sheet Button */}
                {editingSheetId !== sheet.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSheetId(sheet.id);
                      setEditSheetName(sheet.name);
                    }}
                    title="Rename this Sheet"
                    className={`${
                      isCur ? 'opacity-70 hover:opacity-100 text-cyan-400' : 'opacity-0 group-hover:opacity-100 text-slate-400'
                    } hover:text-cyan-300 transition-opacity ml-0.5 p-0.5`}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}

                {/* Duplicate Sheet */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateSheet(sheet.id);
                  }}
                  title="Duplicate Sheet"
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition-opacity p-0.5"
                >
                  <Copy className="w-3 h-3" />
                </button>

                {/* Close / Remove Sheet */}
                {sheets.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSheet(sheet.id);
                    }}
                    title="Remove this Sheet"
                    className={`${
                      isCur ? 'opacity-80 hover:opacity-100 text-rose-400' : 'opacity-0 group-hover:opacity-100 text-slate-500'
                    } hover:text-rose-300 hover:bg-rose-950/40 rounded p-0.5 transition-all`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add Sheet (+) */}
          <button
            onClick={handleAddSheet}
            title="Add New AmiBroker Chart Sheet"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 transition-colors text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="font-sans font-medium">Add Sheet</span>
          </button>
        </div>

        {/* Right: Layout Switcher (Single, 2-Split, 4-Quad) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">LAYOUT:</span>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
            <button
              onClick={() => setLayoutMode('single')}
              title="Single Sheet Full View"
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                layoutMode === 'single' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              1
            </button>
            <button
              onClick={() => setLayoutMode('split-h')}
              title="2-Split Side by Side (Horizontal)"
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                layoutMode === 'split-h' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              2H
            </button>
            <button
              onClick={() => setLayoutMode('split-v')}
              title="2-Split Top & Bottom (Vertical)"
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                layoutMode === 'split-v' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              2V
            </button>
            <button
              onClick={() => setLayoutMode('quad')}
              title="4-Quad Grid View (4 Charts Simultaneously)"
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                layoutMode === 'quad' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              4 Quad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SINGLE CHART ENGINE (Per Sheet Canvas, Timeframe, Overlays, Drawings)
// ============================================================================
interface SingleChartEngineProps {
  sheet: ChartSheet;
  baseCandles: CandleBar[];
  corporateActions: CorporateAction[];
  isAdjusted: boolean;
  onToggleAdjusted: () => void;
  isActive: boolean;
  onActivate: () => void;
  onUpdateSheet: (updated: ChartSheet) => void;
  onSelectSymbol?: (symbol: string) => void;
  availableSymbols: string[];
}

const SingleChartEngine: React.FC<SingleChartEngineProps> = ({
  sheet,
  baseCandles,
  corporateActions,
  isAdjusted,
  onToggleAdjusted,
  isActive,
  onActivate,
  onUpdateSheet,
  onSelectSymbol,
  availableSymbols,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);

  // Viewport Scroll & Zoom State
  const [scrollOffset, setScrollOffset] = useState<number>(0); // 0 = latest, >0 = scrolled back in time
  const [visibleBarsCount, setVisibleBarsCount] = useState<number>(110); // number of bars visible

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Dropdown Popovers State
  const [showTfPopover, setShowTfPopover] = useState(false);
  const [showIndicatorsPopover, setShowIndicatorsPopover] = useState(false);
  const [showLowerPanePopover, setShowLowerPanePopover] = useState(false);
  const [showLowerSettingsModal, setShowLowerSettingsModal] = useState(false);
  const [showMaPopover, setShowMaPopover] = useState(false);
  const [showVolumePopover, setShowVolumePopover] = useState(false);
  const [showStylePopover, setShowStylePopover] = useState(false);
  const [isCrosshairEnabled, setIsCrosshairEnabled] = useState(true);

  // Drawing Tools State
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType>('cursor');
  
  //correction 
  // BEFORE:
const timeframedCandles = useMemo(() => {
  return resampleCandles(baseCandles, sheet.timeframe);
}, [baseCandles, sheet.timeframe]);
  
  // Resample candles according to sheet timeframe
  const timeframedCandles = useMemo(() => {
    return resampleCandles(baseCandles, sheet.timeframe);
  }, [baseCandles, sheet.timeframe]);

  // Sliced Visible Candles (Controlled by scrollbar and zoom)
  const totalCandles = timeframedCandles.length;
  const maxScroll = Math.max(0, totalCandles - visibleBarsCount);
  const safeOffset = Math.min(maxScroll, Math.max(0, scrollOffset));
  const endIndex = Math.max(0, totalCandles - safeOffset);
  const startIndex = Math.max(0, endIndex - visibleBarsCount);

  const displayCandles = useMemo(() => {
    const slice = timeframedCandles.slice(startIndex, endIndex);
    if (sheet.chartType === 'heikin_ashi') {
      return calculateHeikinAshi(slice);
    }
    return slice;
  }, [timeframedCandles, startIndex, endIndex, sheet.chartType]);

  const n = displayCandles.length;
  const closes = useMemo(() => displayCandles.map((c) => c.close), [displayCandles]);

  // Indicator computations on display slice
  const settings = sheet.indicatorSettings;

  // Computed Moving Averages supporting ANY source variable (Close, High, Low, Volume, etc.)
  const computedMAs = useMemo(() => {
    return settings.mas.map((ma) => {
      if (!ma.visible) return { ...ma, series: displayCandles.map(() => null) };
      const srcArray = extractSeries(displayCandles, ma.sourceField || 'close');
      const series = calculateMovingAverage(srcArray, ma.period, ma.type);
      return { ...ma, series };
    });
  }, [settings.mas, displayCandles]);

  const bb = useMemo(() => calculateBollingerBands(closes, settings.bollinger.period, settings.bollinger.stdDev), [closes, settings.bollinger]);
  const { supertrend } = useMemo(() => calculateSupertrend(displayCandles, settings.supertrend.period, settings.supertrend.multiplier), [displayCandles, settings.supertrend]);
  const atrTrailing = useMemo(() => calculateATRTrailingStop(displayCandles, settings.atrTrailingStop.period, settings.atrTrailingStop.multiplier), [displayCandles, settings.atrTrailingStop]);
  const sarData = useMemo(() => calculateParabolicSAR(displayCandles, settings.parabolicSar.acceleration, settings.parabolicSar.maximum), [displayCandles, settings.parabolicSar]);
  const donchian = useMemo(() => calculateDonchian(displayCandles, settings.donchian.period), [displayCandles, settings.donchian]);

  // Sub Indicators
  const rsi = useMemo(() => calculateRSI(closes, settings.rsi.period), [closes, settings.rsi]);
  const macdData = useMemo(() => calculateMACD(closes, settings.macd.fastPeriod, settings.macd.slowPeriod, settings.macd.signalPeriod), [closes, settings.macd]);
  const stochData = useMemo(() => calculateStochastic(displayCandles, settings.stochastic.kPeriod, settings.stochastic.dPeriod, settings.stochastic.slowing), [displayCandles, settings.stochastic]);
  const adxData = useMemo(() => calculateADX(displayCandles, settings.adx.period), [displayCandles, settings.adx]);
  const atrSeries = useMemo(() => calculateATR(displayCandles, settings.atr.period), [displayCandles, settings.atr]);
  const cciSeries = useMemo(() => calculateCCI(displayCandles, settings.cci.period), [displayCandles, settings.cci]);
  const williamsSeries = useMemo(() => calculateWilliamsR(displayCandles, settings.williamsR.period), [displayCandles, settings.williamsR]);
  const mfiSeries = useMemo(() => calculateMFI(displayCandles, settings.mfi.period), [displayCandles, settings.mfi]);
  const obvSeries = useMemo(() => calculateOBV(displayCandles), [displayCandles]);
  const rocSeries = useMemo(() => calculateROC(closes, settings.roc.period), [closes, settings.roc]);
  const vwapSeries = useMemo(() => calculateVWAP(displayCandles), [displayCandles]);

  // Sub-Indicator popover state
  const [showSubIndicatorConfig, setShowSubIndicatorConfig] = useState(false);

  // SVG Container Dimensions measured accurately
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 480 });

  useEffect(() => {
    const updateSize = () => {
      if (svgContainerRef.current) {
        const clientW = svgContainerRef.current.clientWidth || 800;
        const clientH = svgContainerRef.current.clientHeight || 480;
        setDimensions({
          width: Math.max(300, clientW),
          height: Math.max(280, clientH),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && svgContainerRef.current) {
      ro = new ResizeObserver(updateSize);
      ro.observe(svgContainerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateSize);
      if (ro) ro.disconnect();
    };
  }, []);

  // Split heights based on user volumeMode and subIndicator selection
  const totalSvgHeight = dimensions.height;
  const isVolumeHidden = settings.volumeMode === 'none';
  const isIndicatorHidden = sheet.subIndicator === 'none';
  const volumeHeight = isVolumeHidden ? 0 : Math.min(55, Math.max(40, Math.floor(totalSvgHeight * 0.12)));
  const indicatorHeight = isIndicatorHidden ? 0 : Math.min(105, Math.max(70, Math.floor(totalSvgHeight * 0.2)));
  const priceHeight = Math.max(160, totalSvgHeight - volumeHeight - indicatorHeight);
  const paddingRight = 65; // dedicated price axis width
  const plotWidth = Math.max(150, dimensions.width - paddingRight);

  // Volume Moving Average computation for overlay
  const volMaPeriod = settings.volumeMa?.period || 20;
  const isVolMaEnabled = settings.volumeMa?.enabled ?? true;
  const volSeries = useMemo(() => displayCandles.map((c) => c.volume), [displayCandles]);
  const computedVolMA = useMemo(() => {
    return calculateSMA(volSeries, volMaPeriod);
  }, [volSeries, volMaPeriod]);

  // Automatic Dynamic Price Scale strictly fitted to the visible slice of candles
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (displayCandles.length === 0) return { minPrice: 0, maxPrice: 100, priceRange: 100 };
    let min = Infinity;
    let max = -Infinity;

    displayCandles.forEach((c, idx) => {
      min = Math.min(min, c.low);
      max = Math.max(max, c.high);

      computedMAs.forEach((ma) => {
        // Only include in scale if this MA is calculated on price fields (not volume)
        if (ma.visible && ma.series[idx] !== null && (!ma.sourceField || ['close', 'open', 'high', 'low', 'hl2', 'hlc3'].includes(ma.sourceField))) {
          min = Math.min(min, ma.series[idx] as number);
          max = Math.max(max, ma.series[idx] as number);
        }
      });

      if (settings.bollinger.enabled && bb.lower[idx] !== null && bb.upper[idx] !== null) {
        min = Math.min(min, bb.lower[idx] as number);
        max = Math.max(max, bb.upper[idx] as number);
      }

      if (settings.atrTrailingStop.enabled && atrTrailing.longStop[idx] !== null) {
        min = Math.min(min, atrTrailing.longStop[idx] as number);
        max = Math.max(max, (atrTrailing.shortStop[idx] ?? max) as number);
      }
    });

    const pad = (max - min) * 0.06 || 1;
    return { minPrice: min - pad, maxPrice: max + pad, priceRange: max - min + 2 * pad };
  }, [displayCandles, computedMAs, settings.bollinger, bb, settings.atrTrailingStop, atrTrailing]);

  // Volume Scale
  const maxVolume = useMemo(() => {
    if (displayCandles.length === 0) return 1;
    return Math.max(...displayCandles.map((c) => c.volume)) * 1.15;
  }, [displayCandles]);

  // Coordinates helper functions
  const getX = (index: number) => {
    if (n <= 1) return plotWidth / 2;
    return (index / (n - 1)) * (plotWidth - 24) + 12;
  };

  const getYPrice = (price: number) => {
    if (priceRange === 0) return priceHeight / 2;
    return priceHeight - ((price - minPrice) / priceRange) * (priceHeight - 24) - 12;
  };

  const getPriceFromY = (y: number) => {
    const ratio = (priceHeight - 12 - y) / (priceHeight - 24);
    return minPrice + ratio * priceRange;
  };

  const getBarIndexFromX = (x: number) => {
    if (!plotWidth || n <= 1) return 0;
    const clampedX = Math.max(12, Math.min(plotWidth - 12, x));
    const ratio = (clampedX - 12) / (plotWidth - 24);
    return Math.max(0, Math.min(n - 1, Math.round(ratio * (n - 1))));
  };

  const getYVolume = (vol: number) => {
    if (isVolumeHidden || volumeHeight === 0) return priceHeight;
    const h = (vol / maxVolume) * (volumeHeight - 8);
    return priceHeight + volumeHeight - h;
  };

  // Crosshair Active Bar
  const activeIdx = hoverIndex !== null && hoverIndex < n ? hoverIndex : n - 1;
  const activeBar = displayCandles[activeIdx];
  const prevBar = activeIdx > 0 ? displayCandles[activeIdx - 1] : activeBar;
  const barChange = activeBar && prevBar ? activeBar.close - prevBar.close : 0;
  const barChangePct = activeBar && prevBar && prevBar.close > 0 ? (barChange / prevBar.close) * 100 : 0;

  // Drawings list
  const currentDrawings = sheet.drawings || [];

  const clearAllDrawings = () => {
    clearDrawings(sheet.symbol, sheet.chartId);
    onUpdateSheet({ ...sheet, drawings: [] });
    setActiveDrawingTool('cursor');
  };

  // Sync loaded drawings when symbol or chartId changes
  useEffect(() => {
    const loaded = loadDrawings(sheet.symbol, sheet.chartId);
    if (loaded && loaded.length > 0 && (!sheet.drawings || sheet.drawings.length === 0)) {
      onUpdateSheet({ ...sheet, drawings: loaded });
    }
  }, [sheet.symbol, sheet.chartId]);

  return (
    <div
      ref={containerRef}
      onClick={onActivate}
      className={`flex flex-col h-full bg-slate-950 border ${
        isActive ? 'border-cyan-500/70 shadow-md' : 'border-slate-800'
      } relative overflow-hidden select-none`}
    >
      {/* ===================================================================== */}
      {/* 1. TOP TOOLBAR: SYMBOL, TIMEFRAME, CANDLE STYLE, MAs, DRAWINGS, ZOOM  */}
      {/* ===================================================================== */}
      <div className="flex flex-wrap items-center justify-between px-2.5 py-1 border-b border-slate-800 bg-slate-900/80 text-xs gap-1.5 backdrop-blur">
        {/* Left: Chart ID, Symbol with Lock & Link, Timeframe with Lock & Link, Candle Style */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold border border-slate-700">
            #{sheet.chartId}
          </span>

          {/* Symbol Selector + Lock + Link Group */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded px-1 py-0.5 gap-1">
            <select
              value={sheet.symbol}
              onChange={(e) => {
                const newSym = e.target.value;
                onUpdateSheet({ ...sheet, symbol: newSym });
                if (onSelectSymbol) onSelectSymbol(newSym);
              }}
              className="bg-transparent text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
            >
              {availableSymbols.map((sym) => (
                <option key={sym} value={sym} className="bg-slate-900 text-white font-mono">
                  {sym}
                </option>
              ))}
            </select>

            {/* Symbol Lock Button */}
            <button
              onClick={() => onUpdateSheet({ ...sheet, symbolLocked: !sheet.symbolLocked })}
              title={
                sheet.symbolLocked
                  ? 'Symbol Locked (Global changes will NOT affect this sheet)'
                  : 'Symbol Unlocked (Syncs with global changes)'
              }
              className={`p-0.5 rounded transition-colors ${
                sheet.symbolLocked ? 'text-amber-400 bg-amber-950/60' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {sheet.symbolLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>

            {/* Symbol Link Group */}
            <select
              value={sheet.symbolLinkGroup || 'green'}
              onChange={(e) => onUpdateSheet({ ...sheet, symbolLinkGroup: e.target.value as any })}
              title="Symbol Link Group (Charts in the same group switch symbol simultaneously)"
              className="bg-slate-800 text-[10px] font-mono text-cyan-300 rounded px-1 py-0.2 focus:outline-none"
            >
              <option value="green">🔗 G1</option>
              <option value="red">🔗 G2</option>
              <option value="blue">🔗 G3</option>
              <option value="none">No Link</option>
            </select>
          </div>

          {/* Timeframe Presets + Lock + Link (No unnecessary custom builder) */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800 gap-0.5">
            {(['1m', '5m', '15m', '1h', '1D', '1W', '1M', '1Y'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => onUpdateSheet({ ...sheet, timeframe: tf })}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  sheet.timeframe === tf
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}

            {/* Timeframe Lock Button */}
            <button
              onClick={() => onUpdateSheet({ ...sheet, timeframeLocked: !sheet.timeframeLocked })}
              title={sheet.timeframeLocked ? 'Timeframe Locked' : 'Timeframe Unlocked'}
              className={`p-0.5 rounded ml-0.5 transition-colors ${
                sheet.timeframeLocked ? 'text-amber-400 bg-amber-950/60' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {sheet.timeframeLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
            </button>

            {/* Timeframe Link Group */}
            <select
              value={sheet.timeframeLinkGroup || 'green'}
              onChange={(e) => onUpdateSheet({ ...sheet, timeframeLinkGroup: e.target.value as any })}
              title="Timeframe Link Group"
              className="bg-slate-800 text-[9px] font-mono text-cyan-300 rounded px-1 py-0.2 focus:outline-none"
            >
              <option value="green">🔗 T1</option>
              <option value="red">🔗 T2</option>
              <option value="none">No Link</option>
            </select>
          </div>

          {/* Candle Style Dropdown: BARCHART, HEIKEN ASHI, LINE, CANDLESTICK */}
          <div className="relative">
            <button
              onClick={() => setShowStylePopover(!showStylePopover)}
              className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-300 font-medium"
            >
              <span>
                {sheet.chartType === 'candlestick'
                  ? 'Candlestick'
                  : sheet.chartType === 'ohlc_bar'
                  ? 'Bar Chart'
                  : sheet.chartType === 'heikin_ashi'
                  ? 'Heikin Ashi'
                  : 'Line Chart'}
              </span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>
            {showStylePopover && (
              <div className="absolute left-0 mt-1 w-36 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-[11px]">
                {[
                  { id: 'candlestick', label: 'Candlestick' },
                  { id: 'ohlc_bar', label: 'Bar Chart (OHLC)' },
                  { id: 'heikin_ashi', label: 'Heikin Ashi' },
                  { id: 'line', label: 'Line Chart' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      onUpdateSheet({ ...sheet, chartType: st.id as ChartType });
                      setShowStylePopover(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 ${
                      sheet.chartType === st.id ? 'text-cyan-300 font-bold bg-cyan-950/40' : 'text-slate-300'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: MAs, Indicators, Volume, Drawings, Zoom */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Volume vs Delivery Volume Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowVolumePopover(!showVolumePopover)}
              className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded px-2 py-0.5 text-[10px] text-slate-300 font-mono"
              title="Volume and Delivery Volume display mode"
            >
              <BarChart2 className="w-3 h-3 text-cyan-400" />
              <span>
                {settings.volumeMode === 'both'
                  ? 'Vol + Delivery'
                  : settings.volumeMode === 'volume'
                  ? 'Volume Only'
                  : settings.volumeMode === 'delivery'
                  ? 'Delivery Only'
                  : 'Vol: Hidden'}
              </span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>
            {showVolumePopover && (
              <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-[11px]">
                {[
                  { id: 'both', label: 'Volume + Delivery (Both)' },
                  { id: 'volume', label: 'Volume Only (Trade Qty)' },
                  { id: 'delivery', label: 'Delivery Volume Only' },
                  { id: 'none', label: 'Hide Volume Pane' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: { ...settings, volumeMode: opt.id as VolumePlotMode },
                      });
                      setShowVolumePopover(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 ${
                      settings.volumeMode === opt.id ? 'text-cyan-300 font-bold bg-cyan-950/40' : 'text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Moving Averages Dropdown & Any-Variable Manager */}
          <div className="relative">
            <button
              onClick={() => setShowMaPopover(!showMaPopover)}
              className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded px-2 py-0.5 text-[10px] text-cyan-300 font-mono"
              title="Moving Averages on any variable (Close, High, Low, Volume, etc.)"
            >
              <span>MAs ({settings.mas.filter((m) => m.visible).length})</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>
            {showMaPopover && (
              <div className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 z-50 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="font-bold text-white font-mono text-[10px] uppercase">Active Moving Averages</span>
                  <button
                    onClick={() => {
                      setShowSettingsModal(true);
                      setShowMaPopover(false);
                    }}
                    className="text-cyan-400 hover:underline text-[10px]"
                  >
                    Manage / Add
                  </button>
                </div>
                {settings.mas.map((ma, idx) => (
                  <div key={ma.id} className="flex items-center justify-between p-1 hover:bg-slate-800 rounded">
                    <button
                      onClick={() => {
                        const updated = [...settings.mas];
                        updated[idx].visible = !updated[idx].visible;
                        onUpdateSheet({ ...sheet, indicatorSettings: { ...settings, mas: updated } });
                      }}
                      className="flex items-center gap-1.5 text-left"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ma.color }} />
                      <span className={ma.visible ? 'text-white' : 'text-slate-500 line-through'}>
                        {ma.type} {ma.period} on {ma.sourceField || 'close'}
                      </span>
                    </button>
                    <span className="text-[10px] font-mono text-slate-400">{ma.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Indicators Dropdown (RSI, MACD, Stochastics, Bollinger, Supertrend, etc.) */}
          <div className="relative">
            <button
              onClick={() => setShowIndicatorsPopover(!showIndicatorsPopover)}
              className="flex items-center gap-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded px-2 py-0.5 text-[10px] text-slate-300 font-mono"
            >
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span>Indicators</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>
            {showIndicatorsPopover && (
              <div className="absolute right-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 z-50 text-[11px] space-y-1 max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
                  <span className="font-bold text-white font-mono text-[10px] uppercase">Overlay & Sub Indicators</span>
                  <button
                    onClick={() => {
                      setShowSettingsModal(true);
                      setShowIndicatorsPopover(false);
                    }}
                    className="text-cyan-400 hover:underline text-[10px]"
                  >
                    Settings
                  </button>
                </div>

                {/* Overlays */}
                <div className="text-[9px] uppercase font-mono text-slate-500 font-bold pt-1">Price Overlays</div>
                {[
                  {
                    key: 'bollinger',
                    label: 'Bollinger Bands (20, 2)',
                    active: settings.bollinger.enabled,
                    toggle: () =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          bollinger: { ...settings.bollinger, enabled: !settings.bollinger.enabled },
                        },
                      }),
                  },
                  {
                    key: 'supertrend',
                    label: 'Supertrend (10, 3)',
                    active: settings.supertrend.enabled,
                    toggle: () =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          supertrend: { ...settings.supertrend, enabled: !settings.supertrend.enabled },
                        },
                      }),
                  },
                  {
                    key: 'atrTrailingStop',
                    label: 'ATR Trailing Stoploss',
                    active: settings.atrTrailingStop.enabled,
                    toggle: () =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          atrTrailingStop: { ...settings.atrTrailingStop, enabled: !settings.atrTrailingStop.enabled },
                        },
                      }),
                  },
                  {
                    key: 'parabolicSar',
                    label: 'Parabolic SAR',
                    active: settings.parabolicSar.enabled,
                    toggle: () =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          parabolicSar: { ...settings.parabolicSar, enabled: !settings.parabolicSar.enabled },
                        },
                      }),
                  },
                  {
                    key: 'donchian',
                    label: 'Donchian Channel',
                    active: settings.donchian.enabled,
                    toggle: () =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          donchian: { ...settings.donchian, enabled: !settings.donchian.enabled },
                        },
                      }),
                  },
                  {
                    key: 'vwap',
                    label: 'VWAP',
                    active: settings.showVwap,
                    toggle: () =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: { ...settings, showVwap: !settings.showVwap },
                      }),
                  },
                ].map((ind) => (
                  <button
                    key={ind.key}
                    onClick={ind.toggle}
                    className="w-full flex items-center justify-between px-2 py-1 hover:bg-slate-800 rounded text-slate-300"
                  >
                    <span>{ind.label}</span>
                    {ind.active ? <CheckSquare className="w-3.5 h-3.5 text-cyan-400" /> : <SquareIcon className="w-3.5 h-3.5 text-slate-600" />}
                  </button>
                ))}

                {/* Sub-Indicators */}
                <div className="text-[9px] uppercase font-mono text-slate-500 font-bold pt-2 border-t border-slate-800">
                  Lower Indicator Pane
                </div>
                {[
                  { id: 'rsi', label: 'RSI (Relative Strength Index)' },
                  { id: 'macd', label: 'MACD' },
                  { id: 'stochastic', label: 'Stochastics (%K, %D)' },
                  { id: 'atr', label: 'ATR (Average True Range)' },
                  { id: 'adx', label: 'ADX & DMI' },
                  { id: 'cci', label: 'CCI (Commodity Channel)' },
                  { id: 'williams_r', label: 'Williams %R' },
                  { id: 'mfi', label: 'MFI (Money Flow Index)' },
                  { id: 'obv', label: 'OBV (On Balance Volume)' },
                  { id: 'roc', label: 'ROC (Rate of Change)' },
                  { id: 'delivery_trend', label: 'Delivery Volume Trend' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      onUpdateSheet({ ...sheet, subIndicator: sub.id as SubIndicatorType });
                      setShowIndicatorsPopover(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1 hover:bg-slate-800 rounded ${
                      sheet.subIndicator === sub.id ? 'text-cyan-300 font-bold bg-cyan-950/40' : 'text-slate-300'
                    }`}
                  >
                    <span>{sub.label}</span>
                    {sheet.subIndicator === sub.id && <span className="text-[9px] text-cyan-400">● Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dedicated Lower Pane Selector + Customization + Remove */}
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 gap-0.5">
            <button
              onClick={() => setShowLowerPanePopover(!showLowerPanePopover)}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-cyan-300 font-mono hover:text-white"
              title="Select or Remove Lower Indicator Pane"
            >
              <span className="text-slate-400 font-sans">Lower:</span>
              <span className="font-bold uppercase">{sheet.subIndicator === 'none' ? 'None' : sheet.subIndicator}</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {sheet.subIndicator !== 'none' && (
              <button
                onClick={() => setShowLowerSettingsModal(true)}
                title={`Customize ${sheet.subIndicator.toUpperCase()} parameters`}
                className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800"
              >
                <Sliders className="w-3 h-3" />
              </button>
            )}

            {sheet.subIndicator !== 'none' && (
              <button
                onClick={() => onUpdateSheet({ ...sheet, subIndicator: 'none' })}
                title="Remove Lower Indicator Pane"
                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {showLowerPanePopover && (
              <div className="absolute right-0 mt-1 w-52 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50 text-[11px] top-full">
                <div className="px-2.5 py-1 text-[9px] uppercase font-mono text-slate-500 font-bold border-b border-slate-800">
                  Lower Indicator Pane
                </div>
                <button
                  onClick={() => {
                    onUpdateSheet({ ...sheet, subIndicator: 'none' });
                    setShowLowerPanePopover(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${
                    sheet.subIndicator === 'none' ? 'text-rose-400 font-bold bg-rose-950/40' : 'text-rose-300'
                  }`}
                >
                  <span>✕ None (Remove Lower Pane)</span>
                  {sheet.subIndicator === 'none' && <span className="text-[9px]">● Active</span>}
                </button>
                <div className="h-[1px] bg-slate-800 my-1" />
                {[
                  { id: 'rsi', label: 'RSI (Relative Strength Index)' },
                  { id: 'macd', label: 'MACD (Histogram & Signal)' },
                  { id: 'stochastic', label: 'Stochastics (%K, %D)' },
                  { id: 'atr', label: 'ATR (Average True Range)' },
                  { id: 'adx', label: 'ADX & DMI Trend Strength' },
                  { id: 'cci', label: 'CCI (Commodity Channel)' },
                  { id: 'williams_r', label: 'Williams %R' },
                  { id: 'mfi', label: 'MFI (Money Flow Index)' },
                  { id: 'obv', label: 'OBV (On Balance Volume)' },
                  { id: 'roc', label: 'ROC (Rate of Change)' },
                  { id: 'delivery_trend', label: 'Delivery Volume Trend' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      onUpdateSheet({ ...sheet, subIndicator: sub.id as SubIndicatorType });
                      setShowLowerPanePopover(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between ${
                      sheet.subIndicator === sub.id ? 'text-cyan-300 font-bold bg-cyan-950/40' : 'text-slate-300'
                    }`}
                  >
                    <span>{sub.label}</span>
                    {sheet.subIndicator === sub.id && <span className="text-[9px] text-cyan-400">● Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Drawing Tools Palette (Trendline, Ray, Horizontal Line, Vertical Line, Channel, Rect, Gann Fan, etc.) */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800">
            {[
              { id: 'cursor', label: 'Cursor / Select & Customize Drawings (V)', icon: MousePointer },
              { id: 'trendline', label: 'Trendline (2 Points)', icon: TrendingUp },
              { id: 'ray', label: 'Extended Ray (Origin -> Angle -> Edge)', icon: ArrowUpRight },
              { id: 'horizontal_line', label: 'Horizontal Line / S&R (Global Price)', icon: Minus },
              { id: 'vertical_line', label: 'Vertical Line (Date Marker)', icon: Split },
              { id: 'parallel_lines', label: 'Parallel Lines / Corridor Channel', icon: Columns },
              { id: 'rectangle', label: 'Rectangle / Price Range Box', icon: Square },
              { id: 'gann_fan', label: 'Gann Fan (1x1, 1x2, 2x1... angles)', icon: Layers },
              { id: 'fibonacci', label: 'Fibonacci Retracement', icon: SlidersHorizontal },
              { id: 'price_range', label: 'Price Ruler & Bars Counter', icon: Ruler },
            ].map((tool) => {
              const IconComp = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveDrawingTool(tool.id as DrawingToolType)}
                  title={tool.label}
                  className={`p-1 rounded text-[11px] transition-colors ${
                    activeDrawingTool === tool.id
                      ? 'bg-cyan-600 text-white font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                </button>
              );
            })}

            {currentDrawings.length > 0 && (
              <button
                onClick={clearAllDrawings}
                title={`Clear all ${currentDrawings.length} drawings on this chart pane`}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 ml-1 text-[10px] font-mono border border-rose-900/50 transition-colors"
              >
                <Eraser className="w-3 h-3" />
                <span>{currentDrawings.length}</span>
              </button>
            )}
          </div>

          {/* Zoom In & Zoom Out Buttons */}
          <div className="flex items-center bg-slate-900 rounded p-0.5 border border-slate-800 gap-0.5">
            <button
              onClick={() => setVisibleBarsCount((v) => Math.max(20, v - 15))}
              title="Zoom In (Candlesticks)"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setVisibleBarsCount((v) => Math.min(totalCandles, v + 15))}
              title="Zoom Out (Candlesticks)"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setVisibleBarsCount(110);
                setScrollOffset(0);
              }}
              title="Reset Zoom & Scroll"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Crosshair Toggle Button */}
            <button
              onClick={() => setIsCrosshairEnabled(!isCrosshairEnabled)}
              title={isCrosshairEnabled ? 'Crosshair: ACTIVE (Click to toggle)' : 'Crosshair: OFF (Click to toggle)'}
              className={`p-1 rounded flex items-center gap-1 transition-colors ${
                isCrosshairEnabled
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. OHLCV HEADER BAR: ACTIVE CANDLE METRICS & TRAILING STOP VALUES     */}
      {/* ===================================================================== */}
      <div className="px-3 py-1 bg-slate-950 border-b border-slate-900 flex items-center justify-between text-xs font-mono gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-semibold">{activeBar?.date || '—'}</span>
          <div className="flex items-center gap-2">
            <span>O: <b className="text-slate-200">₹{activeBar?.open.toFixed(2) || '—'}</b></span>
            <span>H: <b className="text-emerald-400">₹{activeBar?.high.toFixed(2) || '—'}</b></span>
            <span>L: <b className="text-rose-400">₹{activeBar?.low.toFixed(2) || '—'}</b></span>
            <span>C: <b className={barChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>₹{activeBar?.close.toFixed(2) || '—'}</b></span>
          </div>

          <span className={`px-1.5 py-0.2 rounded text-[11px] font-bold ${barChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {barChange >= 0 ? '+' : ''}{barChange.toFixed(2)} ({barChangePct >= 0 ? '+' : ''}{barChangePct.toFixed(2)}%)
          </span>

          {activeBar?.deliveryPct !== undefined && (
            <span className="text-cyan-400 text-[11px]">
              Deliv: <b>{activeBar.deliveryPct}%</b>
            </span>
          )}

          {/* Active ATR Trailing Stop Display */}
          {settings.atrTrailingStop.enabled && atrTrailing.longStop[activeIdx] !== null && (
            <span className="text-emerald-400 text-[11px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
              ATR Stop: <b>₹{atrTrailing.longStop[activeIdx]}</b>
            </span>
          )}
        </div>

        <div className="text-[10px] text-slate-500 font-mono hidden md:inline">
          Showing {n} bars (Viewport: {startIndex + 1} - {endIndex} of {totalCandles})
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. MAIN SVG CHART AREA: CANDLES, OVERLAYS, AXES & DRAWINGS            */}
      {/* ===================================================================== */}
      <div
        ref={svgContainerRef}
        className="flex-1 relative overflow-hidden bg-slate-950"
        onWheel={(e) => {
          e.preventDefault();
          if (e.deltaY < 0) {
            setVisibleBarsCount((v) => Math.max(20, v - 8));
          } else if (e.deltaY > 0) {
            setVisibleBarsCount((v) => Math.min(totalCandles, v + 8));
          }
        }}
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          onClick={onActivate}
          onMouseMove={(e) => {
            if (!svgContainerRef.current) return;
            const rect = svgContainerRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            setHoverY(mouseY);
            if (mouseX >= 0 && mouseX <= plotWidth && n > 0) {
              const idx = getBarIndexFromX(mouseX);
              setHoverIndex(idx);
            }
          }}
          onMouseLeave={() => {
            setHoverIndex(null);
            setHoverY(null);
          }}
          className="w-full h-full cursor-crosshair"
        >
          <defs>
            <linearGradient id={`gradBull-${sheet.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id={`gradBear-${sheet.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          {/* Price Axis Vertical Border Line */}
          <line x1={plotWidth} y1={0} x2={plotWidth} y2={priceHeight} stroke="#334155" strokeWidth={1} />

          {/* Horizontal Price Grid Lines & Price Axis Numerical Ticks */}
          {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((fraction) => {
            const y = priceHeight * fraction;
            const priceVal = maxPrice - fraction * priceRange;
            return (
              <g key={`grid-p-${fraction}`}>
                <line x1={0} y1={y} x2={plotWidth} y2={y} stroke="#1e293b" strokeDasharray="3 3" strokeOpacity={0.6} />
                <line x1={plotWidth} y1={y} x2={plotWidth + 4} y2={y} stroke="#475569" strokeWidth={1} />
                <text x={plotWidth + 6} y={y + 3.5} fill="#94a3b8" fontSize={9} fontFamily="JetBrains Mono, monospace">
                  ₹{priceVal >= 100 ? priceVal.toFixed(1) : priceVal.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Date / Time Axis: Horizontal Line along bottom of price pane */}
          <line x1={0} y1={priceHeight} x2={plotWidth} y2={priceHeight} stroke="#334155" strokeWidth={1.5} />

          {/* Periodic Date Ticks and Text along X-Axis */}
          {displayCandles.map((bar, idx) => {
            const step = Math.max(8, Math.floor(n / 7));
            if (idx % step !== 0) return null;
            const x = getX(idx);
            const dateLabel = bar.date.includes(' ') ? bar.date.split(' ')[1] : bar.date.substring(5);

            return (
              <g key={`dt-tick-${idx}`}>
                <line x1={x} y1={priceHeight - 3} x2={x} y2={priceHeight + 4} stroke="#475569" strokeWidth={1} />
                <text
                  x={x}
                  y={priceHeight + 14}
                  fill="#94a3b8"
                  fontSize={8.5}
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  {dateLabel}
                </text>
              </g>
            );
          })}

          {/* Price Candles (Candlestick / OHLC / Line) */}
          {displayCandles.map((bar, idx) => {
            const x = getX(idx);
            const isUp = bar.close >= bar.open;
            const yOpen = getYPrice(bar.open);
            const yClose = getYPrice(bar.close);
            const yHigh = getYPrice(bar.high);
            const yLow = getYPrice(bar.low);

            const candleW = Math.max(2, Math.min(18, (plotWidth / n) * 0.72));

            // 1. Line Chart
            if (sheet.chartType === 'line') {
              if (idx === 0) return null;
              const prevX = getX(idx - 1);
              const prevY = getYPrice(displayCandles[idx - 1].close);
              return (
                <line
                  key={`line-${idx}`}
                  x1={prevX}
                  y1={prevY}
                  x2={x}
                  y2={yClose}
                  stroke="#38bdf8"
                  strokeWidth={1.8}
                />
              );
            }

            // 2. Bar Chart (OHLC)
            if (sheet.chartType === 'ohlc_bar') {
              const barColor = isUp ? '#10b981' : '#f43f5e';
              return (
                <g key={`ohlc-${idx}`}>
                  {/* Vertical high-low spine */}
                  <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={barColor} strokeWidth={1.5} />
                  {/* Open tick (left) */}
                  <line x1={x - candleW / 2} y1={yOpen} x2={x} y2={yOpen} stroke={barColor} strokeWidth={1.5} />
                  {/* Close tick (right) */}
                  <line x1={x} y1={yClose} x2={x + candleW / 2} y2={yClose} stroke={barColor} strokeWidth={1.5} />
                </g>
              );
            }

            // 3. Candlestick & Heikin Ashi
            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(1.5, Math.abs(yOpen - yClose));

            return (
              <g key={`candle-${idx}`}>
                {/* Upper and Lower Wicks */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={isUp ? '#10b981' : '#f43f5e'}
                  strokeWidth={1.2}
                />
                {/* Candle Real Body */}
                <rect
                  x={x - candleW / 2}
                  y={bodyTop}
                  width={candleW}
                  height={bodyHeight}
                  fill={`url(#${isUp ? 'gradBull' : 'gradBear'}-${sheet.id})`}
                  stroke={isUp ? '#10b981' : '#f43f5e'}
                  strokeWidth={0.8}
                  rx={1}
                />
              </g>
            );
          })}

          {/* Moving Averages Overlays */}
          {computedMAs.map((ma) => {
            if (!ma.visible) return null;
            const points = ma.series
              .map((val, idx) => (val !== null ? `${getX(idx)},${getYPrice(val)}` : null))
              .filter(Boolean)
              .join(' ');

            return (
              <polyline
                key={`ma-${ma.id}`}
                points={points}
                fill="none"
                stroke={ma.color}
                strokeWidth={ma.strokeWidth || 1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {/* Bollinger Bands Envelope */}
          {settings.bollinger.enabled && (
            <>
              {/* Upper Band */}
              <polyline
                points={bb.upper
                  .map((val, idx) => (val !== null ? `${getX(idx)},${getYPrice(val)}` : null))
                  .filter(Boolean)
                  .join(' ')}
                fill="none"
                stroke={settings.bollinger.color}
                strokeWidth={1.2}
                strokeDasharray="4 3"
              />
              {/* Lower Band */}
              <polyline
                points={bb.lower
                  .map((val, idx) => (val !== null ? `${getX(idx)},${getYPrice(val)}` : null))
                  .filter(Boolean)
                  .join(' ')}
                fill="none"
                stroke={settings.bollinger.color}
                strokeWidth={1.2}
                strokeDasharray="4 3"
              />
            </>
          )}

          {/* Supertrend Overlay */}
          {settings.supertrend.enabled && (
            <polyline
              points={supertrend
                .map((val, idx) => (val !== null ? `${getX(idx)},${getYPrice(val)}` : null))
                .filter(Boolean)
                .join(' ')}
              fill="none"
              stroke="#06b6d4"
              strokeWidth={2}
            />
          )}

          {/* ATR Trailing Stoploss (Chandelier Stop) */}
          {settings.atrTrailingStop.enabled && (
            <polyline
              points={atrTrailing.longStop
                .map((val, idx) => (val !== null ? `${getX(idx)},${getYPrice(val)}` : null))
                .filter(Boolean)
                .join(' ')}
              fill="none"
              stroke={settings.atrTrailingStop.color || '#10b981'}
              strokeWidth={1.8}
              strokeDasharray="3 3"
            />
          )}

          {/* Parabolic SAR Dots */}
          {settings.parabolicSar.enabled &&
            sarData.sar.map((s, idx) => {
              if (s === null) return null;
              const y = getYPrice(s);
              const isUp = sarData.trend[idx] === 'UP';
              return (
                <circle
                  key={`sar-${idx}`}
                  cx={getX(idx)}
                  cy={y}
                  r={2.2}
                  fill={isUp ? '#10b981' : '#f43f5e'}
                />
              );
            })}

          {/* ============================================================= */}
          {/* VALUES DISPLAYED DIRECTLY ON PRICE AXIS (Close, MAs, Bands)   */}
          {/* ============================================================= */}
          {/* Current Close Badge on Price Axis */}
          {displayCandles.length > 0 && (() => {
            const lastBar = displayCandles[displayCandles.length - 1];
            const yClose = getYPrice(lastBar.close);
            const isUp = lastBar.close >= lastBar.open;
            return (
              <g transform={`translate(${plotWidth + 2}, ${yClose - 8})`}>
                <rect
                  width={58}
                  height={16}
                  rx={2}
                  fill={isUp ? '#059669' : '#e11d48'}
                  stroke={isUp ? '#10b981' : '#f43f5e'}
                  strokeWidth={1}
                />
                <text
                  x={29}
                  y={11}
                  fill="#ffffff"
                  fontSize={9}
                  fontWeight="bold"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  ₹{lastBar.close >= 100 ? lastBar.close.toFixed(1) : lastBar.close.toFixed(2)}
                </text>
              </g>
            );
          })()}

          {/* Active MAs Badges on Price Axis */}
          {computedMAs.map((ma) => {
            if (!ma.visible) return null;
            const lastVal = ma.series[ma.series.length - 1];
            if (lastVal === null || lastVal === undefined) return null;
            const yMa = getYPrice(lastVal);
            return (
              <g key={`axis-ma-${ma.id}`} transform={`translate(${plotWidth + 2}, ${yMa - 7})`}>
                <rect width={58} height={14} rx={2} fill="#0f172a" stroke={ma.color} strokeWidth={1.2} />
                <text
                  x={29}
                  y={10}
                  fill={ma.color}
                  fontSize={8}
                  fontWeight="bold"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                >
                  ₹{lastVal.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Bollinger Bands Badges on Price Axis */}
          {settings.bollinger.enabled && bb.upper.length > 0 && (() => {
            const lastUp = bb.upper[bb.upper.length - 1];
            const lastLow = bb.lower[bb.lower.length - 1];
            return (
              <>
                {lastUp !== null && (
                  <g transform={`translate(${plotWidth + 2}, ${getYPrice(lastUp) - 6})`}>
                    <rect width={58} height={12} rx={2} fill="#0f172a" stroke={settings.bollinger.color} strokeWidth={1} strokeDasharray="2 2" />
                    <text x={29} y={9} fill={settings.bollinger.color} fontSize={8} fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                      ₹{lastUp.toFixed(1)}
                    </text>
                  </g>
                )}
                {lastLow !== null && (
                  <g transform={`translate(${plotWidth + 2}, ${getYPrice(lastLow) - 6})`}>
                    <rect width={58} height={12} rx={2} fill="#0f172a" stroke={settings.bollinger.color} strokeWidth={1} strokeDasharray="2 2" />
                    <text x={29} y={9} fill={settings.bollinger.color} fontSize={8} fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                      ₹{lastLow.toFixed(1)}
                    </text>
                  </g>
                )}
              </>
            );
          })()}

          {/* ATR Trailing Stop Badge on Price Axis */}
          {settings.atrTrailingStop.enabled && atrTrailing.longStop.length > 0 && (() => {
            const lastStop = atrTrailing.longStop[atrTrailing.longStop.length - 1];
            if (lastStop === null) return null;
            return (
              <g transform={`translate(${plotWidth + 2}, ${getYPrice(lastStop) - 7})`}>
                <rect width={58} height={14} rx={2} fill="#064e3b" stroke="#10b981" strokeWidth={1.2} />
                <text x={29} y={10} fill="#34d399" fontSize={8} fontWeight="bold" fontFamily="JetBrains Mono, monospace" textAnchor="middle">
                  ₹{lastStop.toFixed(1)}
                </text>
              </g>
            );
          })()}

          {/* ============================================================= */}
          {/* VOLUME & DELIVERABLE VOLUME PANE                              */}
          {/* ============================================================= */}
          {!isVolumeHidden && volumeHeight > 0 && (
            <g transform={`translate(0, 0)`}>
              <line x1={0} y1={priceHeight} x2={dimensions.width} y2={priceHeight} stroke="#334155" strokeWidth={1.5} />

              {/* Volume Bars */}
              {displayCandles.map((bar, idx) => {
                const x = getX(idx);
                const isUp = bar.close >= bar.open;
                const candleW = Math.max(2, Math.min(14, (plotWidth / n) * 0.72));

                const volY = getYVolume(bar.volume);
                const volH = Math.max(1, priceHeight + volumeHeight - volY);

                const delivVol = bar.deliveryQty ?? Math.round(bar.volume * 0.45);
                const delivY = getYVolume(delivVol);
                const delivH = Math.max(1, priceHeight + volumeHeight - delivY);

                return (
                  <g key={`vol-${idx}`}>
                    {/* Total Traded Volume */}
                    {(settings.volumeMode === 'both' || settings.volumeMode === 'volume') && (
                      <rect
                        x={x - candleW / 2}
                        y={volY}
                        width={candleW}
                        height={volH}
                        fill={isUp ? '#10b981' : '#f43f5e'}
                        fillOpacity={settings.volumeMode === 'both' ? 0.35 : 0.8}
                      />
                    )}
                    {/* Pure Delivery Volume Portion */}
                    {(settings.volumeMode === 'both' || settings.volumeMode === 'delivery') && (
                      <rect
                        x={x - candleW / 2}
                        y={delivY}
                        width={candleW}
                        height={delivH}
                        fill="#06b6d4"
                        fillOpacity={0.85}
                      />
                    )}
                  </g>
                );
              })}

              {/* Volume Moving Average Overlay Line */}
              {isVolMaEnabled && computedVolMA.length > 0 && (
                <polyline
                  points={computedVolMA
                    .map((val, idx) => (val !== null ? `${getX(idx)},${getYVolume(val)}` : null))
                    .filter(Boolean)
                    .join(' ')}
                  fill="none"
                  stroke={settings.volumeMa?.color || '#f59e0b'}
                  strokeWidth={1.5}
                />
              )}

              {/* Custom MAs defined on volume or deliveryQty */}
              {computedMAs
                .filter((ma) => ma.visible && (ma.sourceField === 'volume' || ma.sourceField === 'deliveryQty'))
                .map((ma, mIdx) => (
                  <polyline
                    key={`custom-vol-ma-${mIdx}`}
                    points={ma.series
                      .map((val, idx) => (val !== null ? `${getX(idx)},${getYVolume(val)}` : null))
                      .filter(Boolean)
                      .join(' ')}
                    fill="none"
                    stroke={ma.color}
                    strokeWidth={ma.strokeWidth || 1.5}
                  />
                ))}

              {/* Volume Scale Label & MA value */}
              <text x={12} y={priceHeight + 13} fill="#94a3b8" fontSize={8.5} fontFamily="JetBrains Mono, monospace">
                VOL: {(maxVolume / 1000).toFixed(0)}k {isVolMaEnabled && activeIdx < computedVolMA.length && computedVolMA[activeIdx] !== null ? `| Vol MA(${volMaPeriod}): ${(computedVolMA[activeIdx]! / 1000).toFixed(0)}k` : ''}
              </text>

              {/* Remove Volume Pane Button */}
              <g
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateSheet({ ...sheet, indicatorSettings: { ...settings, volumeMode: 'none' } });
                }}
                className="cursor-pointer"
              >
                <title>Remove / Hide Volume Pane</title>
                <rect x={plotWidth + 46} y={priceHeight + 2} width={14} height={14} rx={2} fill="#1e293b" />
                <text x={plotWidth + 53} y={priceHeight + 12.5} fill="#ef4444" fontSize={9.5} fontWeight="bold" textAnchor="middle">✕</text>
              </g>
            </g>
          )}

          {/* ============================================================= */}
          {/* LOWER TECHNICAL INDICATOR SUB-PANE (RSI, MACD, STOCH, ETC.)   */}
          {/* ============================================================= */}
          {(() => {
            if (isIndicatorHidden || indicatorHeight <= 0) return null;
            const subPaneY = priceHeight + volumeHeight;
            const subPaneH = indicatorHeight;

            const getYSub = (val: number, minVal: number, maxVal: number) => {
              const r = maxVal - minVal || 1;
              return subPaneY + subPaneH - ((val - minVal) / r) * (subPaneH - 16) - 8;
            };

            return (
              <g transform={`translate(0, 0)`}>
                {/* Sub-pane divider */}
                <line x1={0} y1={subPaneY} x2={dimensions.width} y2={subPaneY} stroke="#334155" strokeWidth={1.5} />

                {/* Sub Indicator Title */}
                <text x={12} y={subPaneY + 13} fill="#06b6d4" fontSize={9} fontWeight="700" fontFamily="JetBrains Mono, monospace">
                  {sheet.subIndicator.toUpperCase()}{' '}
                  {sheet.subIndicator === 'rsi'
                    ? `(${settings.rsi.period})`
                    : sheet.subIndicator === 'macd'
                    ? `(${settings.macd.fastPeriod},${settings.macd.slowPeriod},${settings.macd.signalPeriod})`
                    : sheet.subIndicator === 'stochastic'
                    ? `(%K ${settings.stochastic.kPeriod}, %D ${settings.stochastic.dPeriod})`
                    : sheet.subIndicator === 'atr'
                    ? `(${settings.atr.period})`
                    : sheet.subIndicator === 'adx'
                    ? `(${settings.adx.period})`
                    : sheet.subIndicator === 'cci'
                    ? `(${settings.cci.period})`
                    : sheet.subIndicator === 'williams_r'
                    ? `(${settings.williamsR.period})`
                    : sheet.subIndicator === 'mfi'
                    ? `(${settings.mfi.period})`
                    : sheet.subIndicator === 'roc'
                    ? `(${settings.roc.period})`
                    : ''}
                </text>

                {/* Remove Lower Indicator Pane Button */}
                <g
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateSheet({ ...sheet, subIndicator: 'none' });
                  }}
                  className="cursor-pointer"
                >
                  <title>Remove Lower Indicator Pane</title>
                  <rect x={plotWidth + 46} y={subPaneY + 2} width={14} height={14} rx={2} fill="#1e293b" />
                  <text x={plotWidth + 53} y={subPaneY + 12.5} fill="#ef4444" fontSize={9.5} fontWeight="bold" textAnchor="middle">✕</text>
                </g>

                {/* Sub Indicator Plots */}
                {sheet.subIndicator === 'rsi' && (
                  <>
                    <line x1={0} y1={getYSub(settings.rsi.overbought || 70, 0, 100)} x2={plotWidth} y2={getYSub(settings.rsi.overbought || 70, 0, 100)} stroke="#f43f5e" strokeDasharray="3 3" strokeOpacity={0.6} />
                    <line x1={0} y1={getYSub(settings.rsi.oversold || 30, 0, 100)} x2={plotWidth} y2={getYSub(settings.rsi.oversold || 30, 0, 100)} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.6} />
                    <polyline
                      points={rsi
                        .map((val, idx) => (val !== null ? `${getX(idx)},${getYSub(val, 0, 100)}` : null))
                        .filter(Boolean)
                        .join(' ')}
                      fill="none"
                      stroke={settings.rsi.color || '#818cf8'}
                      strokeWidth={1.5}
                    />
                    <text x={plotWidth + 6} y={subPaneY + 14} fill="#818cf8" fontSize={9} fontFamily="JetBrains Mono, monospace" fontWeight="bold">
                      {rsi[activeIdx]?.toFixed(1) || '—'}
                    </text>
                  </>
                )}

                {sheet.subIndicator === 'macd' && (
                  <>
                    <line x1={0} y1={getYSub(0, -15, 15)} x2={plotWidth} y2={getYSub(0, -15, 15)} stroke="#475569" strokeDasharray="2 2" strokeOpacity={0.5} />
                    {macdData.histogram.map((h, idx) => {
                      if (h === null) return null;
                      const x = getX(idx);
                      const yZero = getYSub(0, -15, 15);
                      const yH = getYSub(h, -15, 15);
                      return (
                        <line
                          key={`macd-hist-${idx}`}
                          x1={x}
                          y1={yZero}
                          x2={x}
                          y2={yH}
                          stroke={h >= 0 ? '#10b981' : '#f43f5e'}
                          strokeWidth={2}
                        />
                      );
                    })}
                    <polyline
                      points={macdData.macdLine
                        .map((val: number | null, idx: number) => (val !== null ? `${getX(idx)},${getYSub(val, -15, 15)}` : null))
                        .filter(Boolean)
                        .join(' ')}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth={1.5}
                    />
                    <polyline
                      points={macdData.signalLine
                        .map((val: number | null, idx: number) => (val !== null ? `${getX(idx)},${getYSub(val, -15, 15)}` : null))
                        .filter(Boolean)
                        .join(' ')}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={1.2}
                    />
                    <text x={plotWidth + 6} y={subPaneY + 14} fill="#06b6d4" fontSize={8} fontFamily="JetBrains Mono, monospace">
                      M:{macdData.macdLine[activeIdx]?.toFixed(1) || '—'}
                    </text>
                  </>
                )}

                {sheet.subIndicator === 'stochastic' && (
                  <>
                    <line x1={0} y1={getYSub(80, 0, 100)} x2={plotWidth} y2={getYSub(80, 0, 100)} stroke="#f43f5e" strokeDasharray="3 3" strokeOpacity={0.6} />
                    <line x1={0} y1={getYSub(20, 0, 100)} x2={plotWidth} y2={getYSub(20, 0, 100)} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.6} />
                    <polyline
                      points={stochData.kLine
                        .map((val, idx) => (val !== null ? `${getX(idx)},${getYSub(val, 0, 100)}` : null))
                        .filter(Boolean)
                        .join(' ')}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth={1.5}
                    />
                    <polyline
                      points={stochData.dLine
                        .map((val, idx) => (val !== null ? `${getX(idx)},${getYSub(val, 0, 100)}` : null))
                        .filter(Boolean)
                        .join(' ')}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={1.2}
                      strokeDasharray="3 3"
                    />
                    <text x={plotWidth + 6} y={subPaneY + 14} fill="#06b6d4" fontSize={8.5} fontFamily="JetBrains Mono, monospace">
                      %K:{stochData.kLine[activeIdx]?.toFixed(0) || '—'}
                    </text>
                  </>
                )}

                {sheet.subIndicator === 'atr' && (
                  <>
                    <polyline
                      points={atrSeries
                        .map((val, idx) => (val !== null ? `${getX(idx)},${getYSub(val, 0, Math.max(...atrSeries.filter((v): v is number => v !== null), 20) * 1.2)}` : null))
                        .filter(Boolean)
                        .join(' ')}
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth={1.5}
                    />
                    <text x={plotWidth + 6} y={subPaneY + 14} fill="#ec4899" fontSize={8.5} fontFamily="JetBrains Mono, monospace">
                      ₹{atrSeries[activeIdx]?.toFixed(1) || '—'}
                    </text>
                  </>
                )}

                {sheet.subIndicator === 'adx' && (
                  <>
                    <line x1={0} y1={getYSub(settings.adx.threshold || 25, 0, 60)} x2={plotWidth} y2={getYSub(settings.adx.threshold || 25, 0, 60)} stroke="#64748b" strokeDasharray="3 3" />
                    <polyline
                      points={adxData.adx
                        .map((val, idx) => (val !== null ? `${getX(idx)},${getYSub(val, 0, 60)}` : null))
                        .filter(Boolean)
                        .join(' ')}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={1.5}
                    />
                    <polyline
                      points={adxData.plusDI
                        .map((val, idx) => (val !== null ? `${getX(idx)},${getYSub(val, 0, 60)}` : null))
                        .filter(Boolean)
                        .join(' ')}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={1.2}
                    />
                    <polyline
                      points={adxData.minusDI
                        .map((val, idx) => (val !== null ? `${getX(idx)},${getYSub(val, 0, 60)}` : null))
                        .filter(Boolean)
                        .join(' ')}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth={1.2}
                    />
                    <text x={plotWidth + 6} y={subPaneY + 14} fill="#f59e0b" fontSize={8.5} fontFamily="JetBrains Mono, monospace">
                      ADX:{adxData.adx[activeIdx]?.toFixed(0) || '—'}
                    </text>
                  </>
                )}

                {sheet.subIndicator === 'cci' && (
                  <>
                    <line x1={0} y1={getYSub(100, -200, 200)} x2={plotWidth} y2={getYSub(100, -200, 200)} stroke="#f43f5e" strokeDasharray="3 3" strokeOpacity={0.6} />
                    <line x1={0} y1={getYSub(0, -200, 200)} x2={plotWidth} y2={getYSub(0, -200, 200)} stroke="#475569" strokeDasharray="2 2" strokeOpacity={0.4} />
                    <line x1={0} y1={getYSub(-100, -200, 200)} x2={plotWidth} y2={getYSub(-100, -200, 200)} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.6} />
                    <polyline
                      points={cciSeries
                        .map((val, idx) => (val !== null ? `${getX(idx)},${getYSub(val, -200, 200)}` : null))
                        .filter(Boolean)
                        .join(' ')}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth={1.5}
                    />
                    <text x={plotWidth + 6} y={subPaneY + 14} fill="#38bdf8" fontSize={8.5} fontFamily="JetBrains Mono, monospace">
                      {cciSeries[activeIdx]?.toFixed(0) || '—'}
                    </text>
                  </>
                )}

                {sheet.subIndicator === 'williams_r' && (
                  <>
                    <line x1={0} y1={getYSub(-20, -100, 0)} x2={plotWidth} y2={getYSub(-20, -100, 0)} stroke="#f43f5e" strokeDasharray="3 3" strokeOpacity={0.6} />
                    <line x1={0} y1={getYSub(-80, -100, 0)} x2={plotWidth} y2={getYSub(-80, -100, 0)} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.6} />
                    <polyline
                      points={williamsSeries
                        .map((val, idx) => (val !== null ? `${getX(idx)},${getYSub(val, -100, 0)}` : null))
                        .filter(Boolean)
                        .join(' ')}
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth={1.5}
                    />
                    <text x={plotWidth + 6} y={subPaneY + 14} fill="#c084fc" fontSize={8.5} fontFamily="JetBrains Mono, monospace">
                      {williamsSeries[activeIdx]?.toFixed(1) || '—'}
                    </text>
                  </>
                )}

                {sheet.subIndicator === 'mfi' && (
                  <>
                    <line x1={0} y1={getYSub(80, 0, 100)} x2={plotWidth} y2={getYSub(80, 0, 100)} stroke="#f43f5e" strokeDasharray="3 3" strokeOpacity={0.6} />
                    <line x1={0} y1={getYSub(20, 0, 100)} x2={plotWidth} y2={getYSub(20, 0, 100)} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.6} />
                    <polyline
                      points={mfiSeries
                        .map((val, idx) => (val !== null ? `${getX(idx)},${getYSub(val, 0, 100)}` : null))
                        .filter(Boolean)
                        .join(' ')}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth={1.5}
                    />
                    <text x={plotWidth + 6} y={subPaneY + 14} fill="#10b981" fontSize={8.5} fontFamily="JetBrains Mono, monospace">
                      {mfiSeries[activeIdx]?.toFixed(1) || '—'}
                    </text>
                  </>
                )}

                {sheet.subIndicator === 'obv' && (() => {
                  const validObv = obvSeries.filter((v): v is number => v !== null);
                  const minObv = Math.min(...validObv, 0);
                  const maxObv = Math.max(...validObv, 1000);
                  return (
                    <>
                      <line x1={0} y1={getYSub(0, minObv, maxObv)} x2={plotWidth} y2={getYSub(0, minObv, maxObv)} stroke="#475569" strokeDasharray="2 2" strokeOpacity={0.5} />
                      <polyline
                        points={obvSeries
                          .map((val, idx) => (val !== null ? `${getX(idx)},${getYSub(val, minObv, maxObv)}` : null))
                          .filter(Boolean)
                          .join(' ')}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth={1.5}
                      />
                      <text x={plotWidth + 6} y={subPaneY + 14} fill="#06b6d4" fontSize={8} fontFamily="JetBrains Mono, monospace">
                        {(obvSeries[activeIdx] ? (obvSeries[activeIdx]! / 1000).toFixed(0) + 'k' : '—')}
                      </text>
                    </>
                  );
                })()}

                {sheet.subIndicator === 'roc' && (
                  <>
                    <line x1={0} y1={getYSub(0, -20, 20)} x2={plotWidth} y2={getYSub(0, -20, 20)} stroke="#475569" strokeDasharray="2 2" strokeOpacity={0.5} />
                    <polyline
                      points={rocSeries
                        .map((val, idx) => (val !== null ? `${getX(idx)},${getYSub(val, -20, 20)}` : null))
                        .filter(Boolean)
                        .join(' ')}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth={1.5}
                    />
                    <text x={plotWidth + 6} y={subPaneY + 14} fill="#f43f5e" fontSize={8.5} fontFamily="JetBrains Mono, monospace">
                      {rocSeries[activeIdx]?.toFixed(1) || '—'}%
                    </text>
                  </>
                )}

                {sheet.subIndicator === 'delivery_trend' && (
                  <>
                    <line x1={0} y1={getYSub(50, 0, 100)} x2={plotWidth} y2={getYSub(50, 0, 100)} stroke="#475569" strokeDasharray="3 3" strokeOpacity={0.5} />
                    <polyline
                      points={displayCandles
                        .map((c, idx) => `${getX(idx)},${getYSub(c.deliveryPct || 45, 0, 100)}`)
                        .join(' ')}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth={1.5}
                    />
                    <text x={plotWidth + 6} y={subPaneY + 14} fill="#06b6d4" fontSize={8.5} fontFamily="JetBrains Mono, monospace">
                      {displayCandles[activeIdx]?.deliveryPct || 45}%
                    </text>
                  </>
                )}
              </g>
            );
          })()}

          {/* ============================================================= */}
          {/* CROSSHAIR GUIDES & AXES BADGES                                */}
          {/* ============================================================= */}
          {isCrosshairEnabled && hoverIndex !== null && hoverIndex < n && (
            <>
              {/* Vertical Crosshair Line (Spans entire SVG height across all panes) */}
              <line
                x1={getX(hoverIndex)}
                y1={0}
                x2={getX(hoverIndex)}
                y2={dimensions.height}
                stroke="#64748b"
                strokeWidth={1}
                strokeDasharray="3 3"
              />

              {/* Bottom Date Badge on X-Axis */}
              <g
                transform={`translate(${Math.max(
                  0,
                  Math.min(plotWidth - 72, getX(hoverIndex) - 36)
                )}, ${priceHeight + 2})`}
              >
                <rect width={72} height={16} rx={2} fill="#0f172a" stroke="#06b6d4" strokeWidth={1} />
                <text
                  x={36}
                  y={11}
                  fill="#38bdf8"
                  fontSize={8.5}
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {displayCandles[hoverIndex]?.date}
                </text>
              </g>

              {/* Horizontal Crosshair Line & Dynamic Axis Value Badge */}
              {hoverY !== null && (
                <>
                  <line
                    x1={0}
                    y1={hoverY}
                    x2={plotWidth}
                    y2={hoverY}
                    stroke="#64748b"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                  {/* Badge: Price Pane */}
                  {hoverY <= priceHeight && (
                    <g transform={`translate(${plotWidth + 2}, ${hoverY - 8})`}>
                      <rect width={58} height={16} rx={2} fill="#0f172a" stroke="#38bdf8" strokeWidth={1} />
                      <text
                        x={29}
                        y={11}
                        fill="#38bdf8"
                        fontSize={9}
                        fontFamily="JetBrains Mono, monospace"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        ₹{getPriceFromY(hoverY).toFixed(1)}
                      </text>
                    </g>
                  )}
                  {/* Badge: Volume Pane */}
                  {!isVolumeHidden && volumeHeight > 0 && hoverY > priceHeight && hoverY <= priceHeight + volumeHeight && (
                    <g transform={`translate(${plotWidth + 2}, ${hoverY - 8})`}>
                      <rect width={58} height={16} rx={2} fill="#0f172a" stroke="#f59e0b" strokeWidth={1} />
                      <text
                        x={29}
                        y={11}
                        fill="#f59e0b"
                        fontSize={8.5}
                        fontFamily="JetBrains Mono, monospace"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {Math.max(0, Math.round(((priceHeight + volumeHeight - hoverY) / volumeHeight) * maxVolume)).toLocaleString()}
                      </text>
                    </g>
                  )}
                  {/* Badge: Lower Indicator Pane */}
                  {!isIndicatorHidden && indicatorHeight > 0 && hoverY > priceHeight + volumeHeight && (
                    <g transform={`translate(${plotWidth + 2}, ${hoverY - 8})`}>
                      <rect width={58} height={16} rx={2} fill="#0f172a" stroke="#06b6d4" strokeWidth={1} />
                      <text
                        x={29}
                        y={11}
                        fill="#06b6d4"
                        fontSize={8.5}
                        fontFamily="JetBrains Mono, monospace"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        {sheet.subIndicator.toUpperCase()}
                      </text>
                    </g>
                  )}
                </>
              )}
            </>
          )}
        </svg>

        {/* Interactive Drawing Overlay with Per-Symbol & Per-Chart Persistence */}
        <DrawingOverlay
          symbol={sheet.symbol}
          chartPaneId={sheet.chartId}
          activeTool={activeDrawingTool}
          onToolUsed={() => setActiveDrawingTool('cursor')}
          plotWidth={plotWidth}
          plotHeight={priceHeight}
          totalWidth={dimensions.width}
          minPrice={minPrice}
          maxPrice={maxPrice}
          candlesCount={n}
          candleDates={displayCandles.map((c) => c.date)}
          getX={getX}
          getYPrice={getYPrice}
          getPriceFromY={getPriceFromY}
          getBarIndexFromX={getBarIndexFromX}
          currentDrawings={sheet.drawings}
          onDrawingsChange={(newDrawings) => {
            onUpdateSheet({ ...sheet, drawings: newDrawings });
          }}
        />
      </div>

      {/* ===================================================================== */}
      {/* 4. INTERACTIVE HORIZONTAL SCROLLBAR: PAN LEFT/RIGHT, DRAGGABLE THUMB  */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 border-t border-slate-800 text-[10px] font-mono text-slate-400 select-none">
        {/* Pan Left (Back in History) */}
        <button
          onClick={() => setScrollOffset((prev) => Math.min(maxScroll, prev + 15))}
          title="Pan Left (Back in Time)"
          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Scrollbar Track */}
        <div
          className="flex-1 h-3 bg-slate-900 rounded-full relative cursor-pointer border border-slate-800 overflow-hidden"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickRatio = (e.clientX - rect.left) / rect.width;
            const targetStart = Math.round(clickRatio * totalCandles);
            const newOffset = Math.max(0, totalCandles - (targetStart + visibleBarsCount));
            setScrollOffset(Math.min(maxScroll, newOffset));
          }}
        >
          {/* Scrollbar Thumb */}
          <div
            className="absolute top-0 bottom-0 bg-cyan-600/70 hover:bg-cyan-500 rounded-full transition-all cursor-grab active:cursor-grabbing border border-cyan-400/50"
            style={{
              left: `${(startIndex / Math.max(1, totalCandles)) * 100}%`,
              width: `${Math.max(4, (n / Math.max(1, totalCandles)) * 100)}%`,
            }}
          />
        </div>

        {/* Pan Right (Forward in History) */}
        <button
          onClick={() => setScrollOffset((prev) => Math.max(0, prev - 15))}
          title="Pan Right (Forward in Time)"
          className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Jump to Latest Bar */}
        <button
          onClick={() => {
            setScrollOffset(0);
            setVisibleBarsCount(110);
          }}
          title="Reset to Latest Realtime Bar"
          className={`px-2 py-0.5 rounded border text-[10px] font-mono transition-colors ${
            safeOffset === 0
              ? 'bg-cyan-950 text-cyan-400 border-cyan-700 font-bold'
              : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          Latest
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 5. FULL INDICATORS & MOVING AVERAGES CUSTOMIZATION MODAL              */}
      {/* ===================================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Customize Indicators & Moving Averages</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Custom Moving Averages Section supporting ANY variable */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xs block">Moving Averages (on Any Variable)</span>
                  <span className="text-[11px] text-slate-400">
                    Calculate SMA, EMA, TMA, WMA, DEMA, or Hull MA on Close, High, Low, Volume, etc.
                  </span>
                </div>
                <button
                  onClick={() => {
                    const newMa: CustomMaConfig = {
                      id: `ma-${Date.now()}`,
                      name: `MA ${settings.mas.length + 1}`,
                      type: 'EMA',
                      sourceField: 'close',
                      period: 20,
                      color: '#06b6d4',
                      strokeWidth: 1.5,
                      visible: true,
                    };
                    onUpdateSheet({
                      ...sheet,
                      indicatorSettings: { ...settings, mas: [...settings.mas, newMa] },
                    });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add MA</span>
                </button>
              </div>

              <div className="space-y-2">
                {settings.mas.map((ma, idx) => (
                  <div
                    key={ma.id}
                    className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center gap-2 flex-wrap text-[11px]"
                  >
                    <button
                      onClick={() => {
                        const updated = [...settings.mas];
                        updated[idx].visible = !updated[idx].visible;
                        onUpdateSheet({ ...sheet, indicatorSettings: { ...settings, mas: updated } });
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      {ma.visible ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <input
                      type="text"
                      value={ma.name}
                      onChange={(e) => {
                        const updated = [...settings.mas];
                        updated[idx].name = e.target.value;
                        onUpdateSheet({ ...sheet, indicatorSettings: { ...settings, mas: updated } });
                      }}
                      className="w-24 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white"
                    />

                    {/* MA Type */}
                    <select
                      value={ma.type}
                      onChange={(e) => {
                        const updated = [...settings.mas];
                        updated[idx].type = e.target.value as MovingAverageType;
                        onUpdateSheet({ ...sheet, indicatorSettings: { ...settings, mas: updated } });
                      }}
                      className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono"
                    >
                      <option value="SMA">SMA</option>
                      <option value="EMA">EMA</option>
                      <option value="TMA">TMA</option>
                      <option value="WMA">WMA</option>
                      <option value="DEMA">DEMA</option>
                      <option value="HULL">Hull MA</option>
                    </select>

                    {/* Source Field: Close, High, Low, Volume, etc. */}
                    <select
                      value={ma.sourceField || 'close'}
                      onChange={(e) => {
                        const updated = [...settings.mas];
                        updated[idx].sourceField = e.target.value as MovingAverageSource;
                        onUpdateSheet({ ...sheet, indicatorSettings: { ...settings, mas: updated } });
                      }}
                      className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-300 font-mono"
                      title="Variable to calculate MA on"
                    >
                      <option value="close">On: Close</option>
                      <option value="open">On: Open</option>
                      <option value="high">On: High</option>
                      <option value="low">On: Low</option>
                      <option value="volume">On: Volume</option>
                      <option value="deliveryQty">On: Delivery Qty</option>
                      <option value="hl2">On: (H+L)/2</option>
                      <option value="hlc3">On: (H+L+C)/3</option>
                    </select>

                    {/* Period */}
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400">Period:</span>
                      <input
                        type="number"
                        min={1}
                        value={ma.period}
                        onChange={(e) => {
                          const updated = [...settings.mas];
                          updated[idx].period = Number(e.target.value) || 1;
                          onUpdateSheet({ ...sheet, indicatorSettings: { ...settings, mas: updated } });
                        }}
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono"
                      />
                    </div>

                    {/* Color */}
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={ma.color}
                        onChange={(e) => {
                          const updated = [...settings.mas];
                          updated[idx].color = e.target.value;
                          onUpdateSheet({ ...sheet, indicatorSettings: { ...settings, mas: updated } });
                        }}
                        className="w-6 h-6 bg-transparent border-0 cursor-pointer"
                      />
                    </div>

                    <button
                      onClick={() => {
                        const updated = settings.mas.filter((m) => m.id !== ma.id);
                        onUpdateSheet({ ...sheet, indicatorSettings: { ...settings, mas: updated } });
                      }}
                      className="ml-auto text-rose-400 hover:text-rose-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* ATR Trailing Stoploss Settings */}
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-bold text-white text-xs block">ATR Trailing Stop Loss (Chandelier)</span>
                  <span className="text-[11px] text-slate-400">Ratchet stop trailing high-water mark</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.atrTrailingStop.enabled}
                  onChange={(e) =>
                    onUpdateSheet({
                      ...sheet,
                      indicatorSettings: {
                        ...settings,
                        atrTrailingStop: { ...settings.atrTrailingStop, enabled: e.target.checked },
                      },
                    })
                  }
                  className="rounded text-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Lookback Period</label>
                  <input
                    type="number"
                    value={settings.atrTrailingStop.period}
                    onChange={(e) =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          atrTrailingStop: { ...settings.atrTrailingStop, period: Number(e.target.value) || 14 },
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">ATR Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.atrTrailingStop.multiplier}
                    onChange={(e) =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          atrTrailingStop: { ...settings.atrTrailingStop, multiplier: Number(e.target.value) || 3 },
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Bollinger Bands Settings */}
            <div className="p-3 bg-slate-950 rounded border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-white text-xs">Bollinger Bands</span>
                <input
                  type="checkbox"
                  checked={settings.bollinger.enabled}
                  onChange={(e) =>
                    onUpdateSheet({
                      ...sheet,
                      indicatorSettings: {
                        ...settings,
                        bollinger: { ...settings.bollinger, enabled: e.target.checked },
                      },
                    })
                  }
                  className="rounded text-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Period</label>
                  <input
                    type="number"
                    value={settings.bollinger.period}
                    onChange={(e) =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          bollinger: { ...settings.bollinger, period: Number(e.target.value) || 20 },
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">StdDev Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.bollinger.stdDev}
                    onChange={(e) =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          bollinger: { ...settings.bollinger, stdDev: Number(e.target.value) || 2 },
                        },
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lower Indicator Settings Customization Modal */}
      {showLowerSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-white">
                  Customize {sheet.subIndicator.toUpperCase()} Settings
                </span>
              </div>
              <button
                onClick={() => setShowLowerSettingsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {sheet.subIndicator === 'rsi' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">RSI Period</label>
                      <input
                        type="number"
                        min={2}
                        max={100}
                        value={settings.rsi.period}
                        onChange={(e) =>
                          onUpdateSheet({
                            ...sheet,
                            indicatorSettings: {
                              ...settings,
                              rsi: { ...settings.rsi, period: Number(e.target.value) || 14 },
                            },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">Overbought</label>
                      <input
                        type="number"
                        min={50}
                        max={95}
                        value={settings.rsi.overbought}
                        onChange={(e) =>
                          onUpdateSheet({
                            ...sheet,
                            indicatorSettings: {
                              ...settings,
                              rsi: { ...settings.rsi, overbought: Number(e.target.value) || 70 },
                            },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-rose-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1">Oversold</label>
                      <input
                        type="number"
                        min={5}
                        max={50}
                        value={settings.rsi.oversold}
                        onChange={(e) =>
                          onUpdateSheet({
                            ...sheet,
                            indicatorSettings: {
                              ...settings,
                              rsi: { ...settings.rsi, oversold: Number(e.target.value) || 30 },
                            },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {sheet.subIndicator === 'macd' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">Fast Period</label>
                    <input
                      type="number"
                      value={settings.macd.fastPeriod}
                      onChange={(e) =>
                        onUpdateSheet({
                          ...sheet,
                          indicatorSettings: {
                            ...settings,
                            macd: { ...settings.macd, fastPeriod: Number(e.target.value) || 12 },
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">Slow Period</label>
                    <input
                      type="number"
                      value={settings.macd.slowPeriod}
                      onChange={(e) =>
                        onUpdateSheet({
                          ...sheet,
                          indicatorSettings: {
                            ...settings,
                            macd: { ...settings.macd, slowPeriod: Number(e.target.value) || 26 },
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">Signal Period</label>
                    <input
                      type="number"
                      value={settings.macd.signalPeriod}
                      onChange={(e) =>
                        onUpdateSheet({
                          ...sheet,
                          indicatorSettings: {
                            ...settings,
                            macd: { ...settings.macd, signalPeriod: Number(e.target.value) || 9 },
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-400 font-mono"
                    />
                  </div>
                </div>
              )}

              {sheet.subIndicator === 'stochastic' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">%K Period</label>
                    <input
                      type="number"
                      value={settings.stochastic.kPeriod}
                      onChange={(e) =>
                        onUpdateSheet({
                          ...sheet,
                          indicatorSettings: {
                            ...settings,
                            stochastic: { ...settings.stochastic, kPeriod: Number(e.target.value) || 14 },
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">%D Period</label>
                    <input
                      type="number"
                      value={settings.stochastic.dPeriod}
                      onChange={(e) =>
                        onUpdateSheet({
                          ...sheet,
                          indicatorSettings: {
                            ...settings,
                            stochastic: { ...settings.stochastic, dPeriod: Number(e.target.value) || 3 },
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">Slowing</label>
                    <input
                      type="number"
                      value={settings.stochastic.slowing}
                      onChange={(e) =>
                        onUpdateSheet({
                          ...sheet,
                          indicatorSettings: {
                            ...settings,
                            stochastic: { ...settings.stochastic, slowing: Number(e.target.value) || 3 },
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-300 font-mono"
                    />
                  </div>
                </div>
              )}

              {sheet.subIndicator === 'atr' && (
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">ATR Lookback Period</label>
                  <input
                    type="number"
                    value={settings.atr.period}
                    onChange={(e) =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          atr: { ...settings.atr, period: Number(e.target.value) || 14 },
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-mono"
                  />
                </div>
              )}

              {sheet.subIndicator === 'adx' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">Period</label>
                    <input
                      type="number"
                      value={settings.adx.period}
                      onChange={(e) =>
                        onUpdateSheet({
                          ...sheet,
                          indicatorSettings: {
                            ...settings,
                            adx: { ...settings.adx, period: Number(e.target.value) || 14 },
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">Trend Threshold</label>
                    <input
                      type="number"
                      value={settings.adx.threshold}
                      onChange={(e) =>
                        onUpdateSheet({
                          ...sheet,
                          indicatorSettings: {
                            ...settings,
                            adx: { ...settings.adx, threshold: Number(e.target.value) || 25 },
                          },
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-amber-400 font-mono"
                    />
                  </div>
                </div>
              )}

              {sheet.subIndicator === 'cci' && (
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">CCI Period</label>
                  <input
                    type="number"
                    value={settings.cci.period}
                    onChange={(e) =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          cci: { ...settings.cci, period: Number(e.target.value) || 20 },
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-mono"
                  />
                </div>
              )}

              {sheet.subIndicator === 'williams_r' && (
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">Williams %R Period</label>
                  <input
                    type="number"
                    value={settings.williamsR.period}
                    onChange={(e) =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          williamsR: { ...settings.williamsR, period: Number(e.target.value) || 14 },
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-mono"
                  />
                </div>
              )}

              {sheet.subIndicator === 'mfi' && (
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">MFI Period</label>
                  <input
                    type="number"
                    value={settings.mfi.period}
                    onChange={(e) =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          mfi: { ...settings.mfi, period: Number(e.target.value) || 14 },
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-mono"
                  />
                </div>
              )}

              {sheet.subIndicator === 'roc' && (
                <div>
                  <label className="text-slate-400 text-[10px] block mb-1">ROC Period</label>
                  <input
                    type="number"
                    value={settings.roc.period}
                    onChange={(e) =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          roc: { ...settings.roc, period: Number(e.target.value) || 12 },
                        },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-cyan-300 font-mono"
                  />
                </div>
              )}

              {/* Volume Overlay MA quick settings */}
              <div className="pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 font-medium">Volume Moving Average Overlay</span>
                  <input
                    type="checkbox"
                    checked={settings.volumeMa?.enabled ?? true}
                    onChange={(e) =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          volumeMa: {
                            enabled: e.target.checked,
                            period: settings.volumeMa?.period || 20,
                            color: settings.volumeMa?.color || '#f59e0b',
                            source: 'volume',
                          },
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px]">MA Period:</span>
                  <input
                    type="number"
                    value={settings.volumeMa?.period || 20}
                    onChange={(e) =>
                      onUpdateSheet({
                        ...sheet,
                        indicatorSettings: {
                          ...settings,
                          volumeMa: {
                            enabled: settings.volumeMa?.enabled ?? true,
                            period: Number(e.target.value) || 20,
                            color: settings.volumeMa?.color || '#f59e0b',
                            source: 'volume',
                          },
                        },
                      })
                    }
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-amber-400 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800 mt-3">
              <button
                onClick={() => {
                  onUpdateSheet({ ...sheet, subIndicator: 'none' });
                  setShowLowerSettingsModal(false);
                }}
                className="text-rose-400 hover:text-rose-300 text-[11px]"
              >
                Remove Lower Pane
              </button>
              <button
                onClick={() => setShowLowerSettingsModal(false)}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-medium text-xs transition-colors"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
