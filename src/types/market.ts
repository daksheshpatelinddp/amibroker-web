export interface CandleBar {
  date: string; // YYYY-MM-DD or YYYY-MM-DD HH:mm
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  deliveryQty?: number;
  deliveryPct?: number; // e.g. 54.2 (%)
  turnover?: number;
  trades?: number;
  isAdjusted?: boolean;
}

export type Timeframe =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '3h'
  | '4h'
  | '1D'
  | '1W'
  | '1M'
  | '3M'
  | '1Y'
  | string;

export type ChartType = 'candlestick' | 'ohlc_bar' | 'heikin_ashi' | 'line';

export type SubIndicatorType =
  | 'rsi'
  | 'macd'
  | 'stochastic'
  | 'atr'
  | 'adx'
  | 'cci'
  | 'mfi'
  | 'williams_r'
  | 'obv'
  | 'roc'
  | 'delivery_trend'
  | 'none';

export type MovingAverageType = 'SMA' | 'EMA' | 'WMA' | 'DEMA' | 'HULL' | 'TMA';

export type MovingAverageSource =
  | 'close'
  | 'open'
  | 'high'
  | 'low'
  | 'volume'
  | 'deliveryQty'
  | 'hl2'
  | 'hlc3';

export type VolumePlotMode = 'volume' | 'delivery' | 'both' | 'none';

export interface CustomMaConfig {
  id: string;
  name: string;
  type: MovingAverageType;
  sourceField?: MovingAverageSource;
  period: number;
  color: string;
  strokeWidth: number;
  visible: boolean;
}

export interface IndicatorSettings {
  mas: CustomMaConfig[];
  bollinger: {
    enabled: boolean;
    period: number;
    stdDev: number;
    color: string;
  };
  supertrend: {
    enabled: boolean;
    period: number;
    multiplier: number;
  };
  atrTrailingStop: {
    enabled: boolean;
    period: number;
    multiplier: number; // e.g. 3x ATR
    type: 'chandelier' | 'trailing';
    color: string;
  };
  parabolicSar: {
    enabled: boolean;
    acceleration: number;
    maximum: number;
    color: string;
  };
  donchian: {
    enabled: boolean;
    period: number;
    color: string;
  };
  rsi: {
    period: number;
    overbought: number;
    oversold: number;
    color: string;
  };
  macd: {
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
  };
  stochastic: {
    kPeriod: number;
    dPeriod: number;
    slowing: number;
    overbought: number;
    oversold: number;
  };
  adx: {
    period: number;
    threshold: number;
  };
  atr: {
    period: number;
    color: string;
  };
  cci: {
    period: number;
    color: string;
  };
  mfi: {
    period: number;
    color: string;
  };
  williamsR: {
    period: number;
    color: string;
  };
  obv: {
    enabled: boolean;
    color: string;
  };
  roc: {
    period: number;
    color: string;
  };
  showVolume: boolean;
  showDeliveryOverlay: boolean;
  showVwap: boolean;
  volumeMode?: VolumePlotMode; // 'volume' | 'delivery' | 'both' | 'none'
  volumeMa?: {
    enabled: boolean;
    period: number;
    color: string;
    source?: 'volume' | 'deliveryQty';
  };
}

export type DrawingToolType =
  | 'cursor'
  | 'trendline'
  | 'ray'
  | 'horizontal_line'
  | 'horizontal_ray'
  | 'vertical_line'
  | 'parallel_lines'
  | 'parallel_channel'
  | 'rectangle'
  | 'gann_fan'
  | 'fibonacci'
  | 'price_range'
  | 'eraser';

export interface DrawingItem {
  id: string;
  tool: DrawingToolType;
  symbol: string;
  chartId?: number;
  sheetId?: string;
  studyId?: string; // AmiBroker Study ID e.g. "RE1", "SU1", "TL1"
  points: {
    date: string;
    barIndex: number;
    price: number;
  }[];
  color: string;
  fillColor?: string;
  fillOpacity?: number;
  lineWidth?: number;
  lineStyle?: 'solid' | 'dashed' | 'dotted';
  locked?: boolean;
  channelOffset?: number; // for parallel lines / channel
  extendLeft?: boolean;
  extendRight?: boolean;
  showLabels?: boolean;
  text?: string;
  fontSize?: number;
  gannScale?: number;
}

export type LinkGroup = 'none' | 'green' | 'red' | 'blue' | 'yellow' | 'magenta';

export interface ChartSheet {
  id: string;
  chartId: number; // Unique AmiBroker-style Chart ID e.g. 1001, 1002
  name: string;
  symbol: string;
  timeframe: Timeframe;
  chartType: ChartType;
  subIndicator: SubIndicatorType;
  indicatorSettings: IndicatorSettings;
  drawings?: DrawingItem[];
  symbolLocked?: boolean;
  symbolLinkGroup?: LinkGroup;
  timeframeLocked?: boolean;
  timeframeLinkGroup?: LinkGroup;
}

export interface AflParamVariable {
  id: string;
  name: string;
  label: string;
  type: 'number' | 'color' | 'string' | 'list';
  value: number | string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export type CorporateActionType = 'SPLIT' | 'BONUS' | 'RIGHTS' | 'DEMERGER' | 'MERGER' | 'SYMBOL_CHANGE';

export interface CorporateAction {
  id: string;
  symbol: string;
  exDate: string; // YYYY-MM-DD
  actionType: CorporateActionType;
  ratio?: string; // e.g. "1:1" for bonus, "10:1" for split
  factor: number; // multiplier for prior prices
  details: string;
  oldSymbol?: string;
  newSymbol?: string;
}

export type MarketCategory = 'NSE_EQ' | 'NSE_FNO' | 'NSE_SME' | 'BSE' | 'INDEX';

export interface StockMetadata {
  symbol: string;
  name: string;
  market: MarketCategory;
  group: string; // e.g. "Nifty 50", "Nifty Next 50", "Midcap 100", "Smallcap"
  sector: string; // e.g. "Financial Services", "Information Technology", "Energy"
  industry: string; // e.g. "Private Sector Bank", "IT Consulting", "Refineries"
  marketCapCr: number;
  isFnO: boolean;
  isFavorite?: boolean;
  scripCode?: string;
  latestClose?: number;
  latestDate?: string;
  startDate?: string; // First day of trading
  candlesCount?: number;
  isNewListing?: boolean; // First traded in current calendar year
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  symbols: string[];
  isDefault?: boolean;
  color?: string;
  createdAt?: string;
}

export interface ExplorationColumn {
  key: string;
  label: string;
  format?: 'number' | 'currency' | 'percent' | 'text' | 'badge';
  decimals?: number;
}

export interface ExplorationRow {
  symbol: string;
  date: string;
  close: number;
  changePct: number;
  volume: number;
  deliveryPct: number;
  deliveryShock: number; // Delivery Vol / 20D Avg Delivery Vol
  rsi: number;
  ema20: number;
  ema50: number;
  sma200: number;
  supertrend: 'BULL' | 'BEAR';
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  signalReason: string;
  high52w: number;
  low52w: number;
  distFrom52wHighPct: number;
  customColumns?: Record<string, string | number>;
}

export type BacktestUniverseType =
  | 'single'
  | 'market'
  | 'group'
  | 'sector'
  | 'industry'
  | 'favorites'
  | 'watchlist'
  | 'all';

export interface BacktestSettings {
  symbol: string;
  universe: BacktestUniverseType;
  universeFilterValue?: string; // e.g. "NSE_FNO", "Financial Services", "Nifty 50", etc.
  strategyName: string;
  initialCapital: number;
  positionSizePct: number; // e.g. 20%
  maxPositions: number; // for multi-symbol portfolio (e.g. 5, 10, 20)
  positionRanking?: 'PositionScore' | 'deliveryShock' | 'rsi' | 'roc' | 'volume';
  slippagePct: number; // default 0
  brokeragePerTrade: number; // default 0
  sttTaxPct: number; // Securities Transaction Tax % (default 0)
  stampDutyPct: number; // Stamp Duty & Exchange charges % (default 0)
  stcgTaxPct: number; // Short Term Capital Gains Tax % (default 0)
  stopLossPct: number; // default 0 (0 = disabled)
  profitTargetPct: number; // default 0 (0 = disabled)
  trailingStopPct: number; // default 0 (0 = disabled)
  maxHoldingBars: number; // default 0 (0 = disabled)
  startDate: string; // e.g. "2004-01-01"
  endDate: string; // e.g. "2026-08-28"
  timeframe?: string; // e.g. "1D", "1W", "1M", "5m"
  // Strategy specific custom parameters
  fastPeriod?: number;
  slowPeriod?: number;
  rsiThreshold?: number;
  delivShockThreshold?: number;
  customAflCode?: string;
  paramVariables?: Record<string, any>;
  aflOverridesActive?: boolean;
  aflOverrideDetails?: string[];
}

export interface Trade {
  id: string;
  symbol: string;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  shares: number;
  pnl: number;
  returnPct: number;
  exitReason: 'TARGET' | 'STOP_LOSS' | 'TRAILING_STOP' | 'SIGNAL_EXIT' | 'MAX_BARS';
  barsHeld: number;
  highestPriceDuringTrade: number;
  lowestPriceDuringTrade: number;
  maePct: number; // Maximum Adverse Excursion %
  mfePct: number; // Maximum Favorable Excursion %
}

export interface EquityPoint {
  date: string;
  equity: number;
  drawdownPct: number;
  benchmarkEquity: number;
  inTrade: boolean;
}

export interface MonthlyReturn {
  year: number;
  months: (number | null)[]; // 0 to 11 (Jan to Dec)
  totalYearPct: number;
}

export interface RichPerformanceReport {
  initialCapital: number;
  endingEquity: number;
  netProfit: number;
  netProfitPct: number;
  cagrPct: number;
  exposurePct: number;
  totalBrokerage: number;
  totalSlippageCost: number;
  totalTaxesPaid: number;
  sttPaid: number;
  stampDutyPaid: number;
  stcgPaid: number;
  carMdd: number;
  kRatio: number;
  benchmarkReturnPct: number;
  buyAndHoldReturnPct: number;
  aflOverridesApplied?: string[];

  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRatePct: number;
  lossRatePct: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  avgConsecutiveWins: number;
  avgConsecutiveLosses: number;

  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  expectancyRupees: number;
  expectancyScore: number;
  payoffRatio: number;

  avgTradePnl: number;
  avgTradePct: number;
  avgWinRupees: number;
  avgWinPct: number;
  avgLossRupees: number;
  avgLossPct: number;
  avgBarsHeldAll: number;
  avgBarsHeldWinners: number;
  avgBarsHeldLosers: number;

  maxDrawdownPct: number;
  maxDrawdownAmount: number;
  maxDrawdownDurationBars: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  recoveryFactor: number;
  ulcerIndex: number;
  annualizedVolatilityPct: number;

  avgMaePct: number;
  avgMfePct: number;

  monthlyReturns: MonthlyReturn[];
  trades: Trade[];
  equityCurve: EquityPoint[];
}

export interface OptimizationParamConfig {
  name: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultVal: number;
}

export interface OptimizationResultRow {
  rank: number;
  params: Record<string, number>;
  netProfit: number;
  netProfitPct: number;
  cagrPct: number;
  winRatePct: number;
  profitFactor: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  carMdd: number;
  totalTrades: number;
  avgWinLossRatio: number;
}
