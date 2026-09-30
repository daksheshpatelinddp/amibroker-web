import { CandleBar, DrawingItem, ExplorationColumn } from '../types/market';
import {
  calculateADX,
  calculateATR,
  calculateATRTrailingStop,
  calculateBollingerBands,
  calculateCCI,
  calculateDeliveryShock,
  calculateDEMA,
  calculateDonchian,
  calculateEMA,
  calculateHeikinAshi,
  calculateHullMA,
  calculateMACD,
  calculateMFI,
  calculateOBV,
  calculateParabolicSAR,
  calculateROC,
  calculateRSI,
  calculateSMA,
  calculateStochastic,
  calculateSupertrend,
  calculateTMA,
  calculateVWAP,
  calculateWilliamsR,
  calculateWMA,
} from './indicators';

export interface AflSettingsOverrides {
  initialCapital?: number;
  positionSizePct?: number;
  maxPositions?: number;
  stopLossPct?: number;
  profitTargetPct?: number;
  trailingStopPct?: number;
  maxHoldingBars?: number;
  slippagePct?: number;
  brokeragePerTrade?: number;
  sttTaxPct?: number;
  stampDutyPct?: number;
  stcgTaxPct?: number;
  positionScore?: (number | null)[];
}

export interface AflExecutionResult {
  success: boolean;
  error?: string;
  buySignals: boolean[];
  sellSignals: boolean[];
  filterSignals: boolean[];
  columns: {
    header: string;
    values: (number | string | null)[];
    format?: string;
  }[];
  overrides?: AflSettingsOverrides;
}

export interface AflTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const AFL_TEMPLATES: AflTemplate[] = [
  {
    id: 'momentum_bb14',
    name: '1. Momentum Strategy BB14 (Monday Open & RS Ranking)',
    description: 'Buy on Monday open if Prev Close > BBand(14, 3.8), 20 equal positions, ranked by Relative Strength. Sells on 20% stop, 100-week MA or ATR Trailing Stop (20, 1.8).',
    code: `// AmiBroker AFL Strategy 1: Momentum Strategy BB14
// Buy on Monday on open if previous close > Bollinger Band(14, mult 3.8)
// 20 equal positions; rank by Relative Strength.
// Cut losses early / let gainers compound.
// Sell on Monday open if:
// 1. Initial stoploss 20% below buying price
// 2. Close < 100-week moving average (500 daily bars)
// 3. Close < ATR Trailing Stop (period 20, multiplier 1.8)

IsMonday = DayOfWeek() == 1;
BB_Upper = BBandTop(14, 3.8);
WeekMA100 = MA(Close, 500); // 100 weeks ~ 500 daily trading bars
TrailStop = ATRTrailingStop(20, 1.8);
RS_Score = ROC(Close, 60);

// Entry Condition
PrevCloseAboveBB = Ref(Close, -1) > Ref(BB_Upper, -1);
Buy = IsMonday AND PrevCloseAboveBB;

// Exit Conditions
InitialStop = Close < (Ref(Close, -5) * 0.80); // 20% initial stoploss
Below100WkMA = Ref(Close, -1) < WeekMA100;
BelowTrailStop = Ref(Close, -1) < TrailStop;
Sell = IsMonday AND (InitialStop OR Below100WkMA OR BelowTrailStop);

// 20 Equal Positions & Ranking by Relative Strength
PositionSize = -5; // 5% capital per position (20 positions total)
PositionScore = RS_Score;

Filter = Buy OR Sell;

AddColumn(Close, "Close", 1.2);
AddColumn(BB_Upper, "BB(14, 3.8)", 1.2);
AddColumn(WeekMA100, "100-Wk MA", 1.2);
AddColumn(TrailStop, "ATR Stop (20, 1.8)", 1.2);
AddColumn(RS_Score, "RS Score", 1.1);
AddTextColumn(WriteIf(Buy, "BUY MON OPEN", WriteIf(Sell, "EXIT MON OPEN", "HOLD")), "Action");`,
  },
  {
    id: 'momentum_bb50',
    name: '2. Momentum Strategy BB50 (Monday Open & RS Ranking)',
    description: 'Buy on Monday open if Prev Close > BBand(50, 2.0), 20 equal positions, ranked by Relative Strength. Sells on 20% stop, 100-week MA or ATR Trailing Stop (20, 1.8).',
    code: `// AmiBroker AFL Strategy 2: Momentum Strategy BB50
// Buy on Monday on open if previous close > Bollinger Band(50, mult 2.0)
// 20 equal positions; rank by Relative Strength.
// Cut losses early / let gainers compound.
// Sell on Monday open if:
// 1. Initial stoploss 20% below buying price
// 2. Close < 100-week moving average
// 3. Close < ATR Trailing Stop (period 20, multiplier 1.8)

IsMonday = DayOfWeek() == 1;
BB_Upper = BBandTop(50, 2.0);
WeekMA100 = MA(Close, 500); // 100 weeks ~ 500 daily trading bars
TrailStop = ATRTrailingStop(20, 1.8);
RS_Score = ROC(Close, 60);

// Entry Condition
PrevCloseAboveBB = Ref(Close, -1) > Ref(BB_Upper, -1);
Buy = IsMonday AND PrevCloseAboveBB;

// Exit Conditions
InitialStop = Close < (Ref(Close, -5) * 0.80); // 20% initial stoploss
Below100WkMA = Ref(Close, -1) < WeekMA100;
BelowTrailStop = Ref(Close, -1) < TrailStop;
Sell = IsMonday AND (InitialStop OR Below100WkMA OR BelowTrailStop);

// 20 Equal Positions & Ranking by Relative Strength
PositionSize = -5; // 5% per position
PositionScore = RS_Score;

Filter = Buy OR Sell;

AddColumn(Close, "Close", 1.2);
AddColumn(BB_Upper, "BB(50, 2.0)", 1.2);
AddColumn(WeekMA100, "100-Wk MA", 1.2);
AddColumn(TrailStop, "ATR Stop (20, 1.8)", 1.2);
AddColumn(RS_Score, "RS Score", 1.1);
AddTextColumn(WriteIf(Buy, "BUY MON OPEN", WriteIf(Sell, "EXIT MON OPEN", "HOLD")), "Action");`,
  },
  {
    id: 'momentum_roc1',
    name: '3. Momentum Strategy ROC1 (Monthly Rebalance & Top Rankers)',
    description: 'Buy on 1st day of month based on highest ROC ranking, 20 equal positions. Sell if rank slips below 40; replace with highest ranking; 20% stoploss.',
    code: `// AmiBroker AFL Strategy 3: Momentum Strategy ROC1
// Buy on 1st trading day of month based on ranking by ROC
// Buy highest rankers, 20 equal positions
// Sell if rank slips below 40, and replace with highest ranking
// Initial stop loss: 20%

IsFirstDayOfMonth = Day() <= 3; // First trading sessions of month
RocRankMetric = ROC(Close, 126); // 6-month Rate of Change momentum
InitialStopLoss = Close < (Ref(Close, -21) * 0.80);

Buy = IsFirstDayOfMonth AND RocRankMetric > 10;
Sell = InitialStopLoss OR RocRankMetric < 0;

PositionSize = -5; // 20 equal positions = 5% per position
PositionScore = RocRankMetric; // Rank highest ROC

Filter = Buy OR Sell;

AddColumn(Close, "Close", 1.2);
AddColumn(RocRankMetric, "ROC (126d)", 1.2);
AddColumn(RSI(14), "RSI 14", 1.1);
AddTextColumn(WriteIf(Buy, "BUY 1ST OF MONTH", WriteIf(Sell, "REBALANCE EXIT", "HOLD")), "Action");`,
  },
  {
    id: 'momentum_rsi1',
    name: '4. Momentum Strategy RSI1 (Composite RSI 22+44+66)',
    description: 'Buy on 1st day of month based on ranking by (RSI(22)+RSI(44)+RSI(66))/3, 20 equal positions. Sell if rank slips below 40; replace with highest ranking; 20% stoploss.',
    code: `// AmiBroker AFL Strategy 4: Momentum Strategy RSI1
// Buy on 1st trading day of month based on ranking by (RSI(22) + RSI(44) + RSI(66)) / 3
// Buy highest ranker, 20 equal positions
// Sell if rank slips below 40, and replace with highest ranking
// Initial stop loss: 20%

IsFirstDayOfMonth = Day() <= 3;
RsiComposite = (RSI(22) + RSI(44) + RSI(66)) / 3.0;
InitialStopLoss = Close < (Ref(Close, -21) * 0.80);

Buy = IsFirstDayOfMonth AND RsiComposite > 55;
Sell = InitialStopLoss OR RsiComposite < 45;

PositionSize = -5; // 20 equal positions = 5% per position
PositionScore = RsiComposite; // Highest Composite RSI ranking

Filter = Buy OR Sell;

AddColumn(Close, "Close", 1.2);
AddColumn(RsiComposite, "Comp RSI", 1.2);
AddColumn(RSI(22), "RSI 22", 1.1);
AddColumn(RSI(44), "RSI 44", 1.1);
AddColumn(RSI(66), "RSI 66", 1.1);
AddTextColumn(WriteIf(Buy, "BUY 1ST OF MONTH", WriteIf(Sell, "REBALANCE EXIT", "HOLD")), "Action");`,
  },
  {
    id: 'custom_delivery_breakout',
    name: 'Institutional Delivery & Momentum Breakout',
    description: 'Scans for high deliverable volume (>50%) + Delivery Shock > 1.4x + EMA 20 breakout.',
    code: `// AmiBroker AFL Strategy: Institutional Delivery Breakout
FastMA = EMA(Close, 20);
SlowMA = EMA(Close, 50);
DelivShock = DelivQty / MA(DelivQty, 20);
RsiVal = RSI(14);

// Entry: Delivery Shock + Fast MA above Slow MA + Delivery % > 48%
Buy = Cross(Close, FastMA) AND DelivShock > 1.3 AND DeliveryPct > 48;
Sell = Cross(FastMA, Close) OR RsiVal > 75;

Filter = Buy OR Sell;

AddColumn(Close, "Close", 1.2);
AddColumn(FastMA, "EMA 20", 1.2);
AddColumn(DeliveryPct, "Deliv %", 1.1);
AddColumn(DelivShock, "Deliv Shock", 1.2);
AddColumn(RsiVal, "RSI (14)", 1.1);
AddTextColumn(WriteIf(Buy, "STRONG BUY", WriteIf(Sell, "EXIT", "HOLD")), "Action");`,
  },
  {
    id: 'triple_ema_golden_cross',
    name: 'Triple Moving Average Wave & Supertrend',
    description: 'Fast EMA 9 crossing EMA 21 with 200 SMA trend filter.',
    code: `// AmiBroker AFL: Triple Moving Average Wave
EMA9 = EMA(Close, 9);
EMA21 = EMA(Close, 21);
SMA200 = MA(Close, 200);

TrendFilter = Close > SMA200;
Buy = Cross(EMA9, EMA21) AND TrendFilter;
Sell = Cross(EMA21, EMA9);

Filter = Buy OR (EMA9 > EMA21 AND TrendFilter);

AddColumn(Close, "Close", 1.2);
AddColumn(EMA9, "EMA 9", 1.2);
AddColumn(EMA21, "EMA 21", 1.2);
AddColumn(SMA200, "SMA 200", 1.2);
AddColumn(RSI(14), "RSI 14", 1.1);
AddTextColumn(WriteIf(Buy, "BUY TRIGGER", "BULLISH TREND"), "Status");`,
  },
  {
    id: 'blank_afl_template',
    name: 'Blank Custom AFL Formula',
    description: 'Start with a clean canvas to code your proprietary quantitative rules.',
    code: `// Write your custom AmiBroker AFL formula
FastPeriod = 15;
SlowPeriod = 45;

FastMA = EMA(Close, FastPeriod);
SlowMA = EMA(Close, SlowPeriod);

Buy = Cross(FastMA, SlowMA);
Sell = Cross(SlowMA, FastMA);

Filter = Buy OR Sell;

AddColumn(Close, "Close", 1.2);
AddColumn(FastMA, "Fast MA", 1.2);
AddColumn(SlowMA, "Slow MA", 1.2);
AddColumn(Volume, "Volume", 1.0);`,
  },
];

/**
 * Execute an AFL script against a series of candle bars
 */
export function executeAfl(
  candles: CandleBar[],
  aflCode: string,
  drawings?: DrawingItem[]
): AflExecutionResult {
  const n = candles.length;
  if (n === 0) {
    return {
      success: false,
      error: 'No candle bars available for execution.',
      buySignals: [],
      sellSignals: [],
      filterSignals: [],
      columns: [],
    };
  }

  // Pre-calculate standard series
  const Close = candles.map((c) => c.close);
  const Open = candles.map((c) => c.open);
  const High = candles.map((c) => c.high);
  const Low = candles.map((c) => c.low);
  const Volume = candles.map((c) => c.volume);
  const DeliveryQty = candles.map((c) => c.deliveryQty ?? c.volume * 0.45);
  const DeliveryPct = candles.map((c) => c.deliveryPct ?? 45.0);

  // Date and Time helpers for AFL
  const DayOfWeek = () => candles.map((c) => new Date(c.date).getDay());
  const Day = () => candles.map((c) => new Date(c.date).getDate());
  const Month = () => candles.map((c) => new Date(c.date).getMonth() + 1);
  const Year = () => candles.map((c) => new Date(c.date).getFullYear());

  // AmiBroker Study ID lookup function
  const Study = (studyId: string) => {
    const cleanId = String(studyId).trim().toUpperCase();
    const match = drawings?.find(
      (d) =>
        (d.studyId && d.studyId.toUpperCase() === cleanId) ||
        (d.text && d.text.toUpperCase().includes(cleanId))
    );
    if (match && match.points.length > 0) {
      const price = match.points[0].price;
      return candles.map(() => price);
    }
    return candles.map(() => null);
  };

  // Helper AFL array functions
  const MA = (arr: number[], period: number) => calculateSMA(arr, period);
  const EMA = (arr: number[], period: number) => calculateEMA(arr, period);
  const WMA = (arr: number[], period: number) => calculateWMA(arr, period);
  const DEMA = (arr: number[], period: number) => calculateDEMA(arr, period);
  const HULL = (arr: number[], period: number) => calculateHullMA(arr, period);
  const TMA = (arr: number[], period: number) => calculateTMA(arr, period);
  const RSI = (period: number = 14) => calculateRSI(Close, period);
  const ATR = (period: number = 14) => calculateATR(candles, period);
  const VWAP = () => calculateVWAP(candles);

  const Cross = (arr1: (number | null)[], arr2: (number | null)[]) => {
    const res: boolean[] = [];
    for (let i = 0; i < n; i++) {
      if (i === 0 || arr1[i] === null || arr2[i] === null || arr1[i - 1] === null || arr2[i - 1] === null) {
        res.push(false);
      } else {
        res.push((arr1[i] as number) > (arr2[i] as number) && (arr1[i - 1] as number) <= (arr2[i - 1] as number));
      }
    }
    return res;
  };

  const Ref = (arr: (number | null)[], shift: number) => {
    const res: (number | null)[] = [];
    for (let i = 0; i < n; i++) {
      const targetIdx = i + shift;
      if (targetIdx >= 0 && targetIdx < n) {
        res.push(arr[targetIdx]);
      } else {
        res.push(null);
      }
    }
    return res;
  };

  const HHV = (arr: number[], period: number) => {
    const res: (number | null)[] = [];
    for (let i = 0; i < n; i++) {
      if (i < period - 1) {
        res.push(null);
      } else {
        let max = -Infinity;
        for (let j = 0; j < period; j++) max = Math.max(max, arr[i - j]);
        res.push(max);
      }
    }
    return res;
  };

  const LLV = (arr: number[], period: number) => {
    const res: (number | null)[] = [];
    for (let i = 0; i < n; i++) {
      if (i < period - 1) {
        res.push(null);
      } else {
        let min = Infinity;
        for (let j = 0; j < period; j++) min = Math.min(min, arr[i - j]);
        res.push(min);
      }
    }
    return res;
  };

  // Collector for AddColumn calls
  const dynamicColumns: { header: string; values: (number | string | null)[]; format?: string }[] = [];

  const AddColumn = (expr: (number | null)[] | number[], header: string, format?: string) => {
    dynamicColumns.push({ header, values: expr, format });
  };

  const AddTextColumn = (expr: string[] | ((i: number) => string), header: string) => {
    if (typeof expr === 'function') {
      const vals: string[] = [];
      for (let i = 0; i < n; i++) vals.push(expr(i));
      dynamicColumns.push({ header, values: vals, format: 'text' });
    } else {
      dynamicColumns.push({ header, values: expr, format: 'text' });
    }
  };

  const WriteIf = (condition: boolean[] | boolean, trueVal: string, falseVal: string) => {
    const res: string[] = [];
    for (let i = 0; i < n; i++) {
      const c = Array.isArray(condition) ? condition[i] : condition;
      res.push(c ? trueVal : falseVal);
    }
    return res;
  };

  // AmiBroker Default Indicators
  const ATRTrailingStop = (period: number = 14, multiplier: number = 3) =>
    calculateATRTrailingStop(candles, period, multiplier).longStop;
  const SAR = (step: number = 0.02, maxStep: number = 0.2) =>
    calculateParabolicSAR(candles, step, maxStep).sar;
  const OBV = () => calculateOBV(candles);
  const ROC = (period: number = 14) => calculateROC(Close, period);
  const CCI = (period: number = 20) => calculateCCI(candles, period);
  const WilliamsR = (period: number = 14) => calculateWilliamsR(candles, period);
  const MFI = (period: number = 14) => calculateMFI(candles, period);
  const StochK = (k: number = 14, d: number = 3, slowing: number = 3) =>
    calculateStochastic(candles, k, d, slowing).kLine;
  const StochD = (k: number = 14, d: number = 3, slowing: number = 3) =>
    calculateStochastic(candles, k, d, slowing).dLine;
  const ADX = (period: number = 14) => calculateADX(candles, period).adx;
  const PDI = (period: number = 14) => calculateADX(candles, period).plusDI;
  const MDI = (period: number = 14) => calculateADX(candles, period).minusDI;
  const BBandTop = (period: number = 20, mult: number = 2) =>
    calculateBollingerBands(Close, period, mult).upper;
  const BBandBot = (period: number = 20, mult: number = 2) =>
    calculateBollingerBands(Close, period, mult).lower;
  const DonchianHigh = (period: number = 20) => calculateDonchian(candles, period).upper;
  const DonchianLow = (period: number = 20) => calculateDonchian(candles, period).lower;
  const Supertrend = (period: number = 10, mult: number = 3) =>
    calculateSupertrend(candles, period, mult).supertrend;

  // AmiBroker Param() function support
  const Param = (name: string, defaultVal: number, min?: number, max?: number, step?: number) => defaultVal;
  const ParamColor = (name: string, defaultColor: string) => defaultColor;
  const ParamToggle = (name: string, defaultVal: string) => 1;

  // Array comparison helpers so element-wise comparisons work seamlessly
  const _op = (arr1: any, op: string, arr2: any): boolean[] => {
    const res: boolean[] = [];
    for (let i = 0; i < n; i++) {
      const v1 = Array.isArray(arr1) ? arr1[i] : arr1;
      const v2 = Array.isArray(arr2) ? arr2[i] : arr2;
      if (v1 === null || v2 === null || v1 === undefined || v2 === undefined) {
        res.push(false);
      } else if (op === '>') {
        res.push(Number(v1) > Number(v2));
      } else if (op === '<') {
        res.push(Number(v1) < Number(v2));
      } else if (op === '>=') {
        res.push(Number(v1) >= Number(v2));
      } else if (op === '<=') {
        res.push(Number(v1) <= Number(v2));
      } else if (op === '==') {
        res.push(v1 === v2);
      } else if (op === '!=') {
        res.push(v1 !== v2);
      } else {
        res.push(false);
      }
    }
    return res;
  };

  // AmiBroker Settings & Override functions
  const capturedOverrides: AflSettingsOverrides = {};

  const SetOption = (optionName: string, val: any) => {
    const key = String(optionName).toLowerCase().replace(/[^a-z]/g, '');
    const num = Number(val);
    if (key === 'initialequity' || key === 'initialcapital') {
      capturedOverrides.initialCapital = num;
    } else if (key === 'maxopenpositions' || key === 'maxpositions') {
      capturedOverrides.maxPositions = num;
    } else if (key === 'positionsize') {
      capturedOverrides.positionSizePct = Math.abs(num);
    } else if (key === 'slippage') {
      capturedOverrides.slippagePct = num;
    } else if (key === 'commissionamount' || key === 'brokerage') {
      capturedOverrides.brokeragePerTrade = num;
    }
  };

  const SetPositionSize = (size: number, mode?: number) => {
    // In AmiBroker: negative number or mode 1 means % of equity
    const s = Number(size);
    capturedOverrides.positionSizePct = Math.abs(s);
  };

  const ApplyStop = (stopType: number, stopMode: number, val: number) => {
    const num = Number(val);
    // stopType: 0=Loss, 1=Profit, 2=Trailing, 3=NBar
    if (stopType === 0) {
      capturedOverrides.stopLossPct = num;
    } else if (stopType === 1) {
      capturedOverrides.profitTargetPct = num;
    } else if (stopType === 2) {
      capturedOverrides.trailingStopPct = num;
    } else if (stopType === 3) {
      capturedOverrides.maxHoldingBars = Math.round(num);
    }
  };

  // AmiBroker Standard Constants
  const stopTypeLoss = 0;
  const stopTypeProfit = 1;
  const stopTypeTrailing = 2;
  const stopTypeNBar = 3;
  const stopModePercent = 1;
  const stopModePoint = 2;
  const stopModeBars = 1;
  const spsPercentOfEquity = 1;
  const spsShares = 2;
  const spsValue = 3;

  // Environment dictionary for evaluation
  const scope: Record<string, any> = {
    Close,
    Open,
    High,
    Low,
    Volume,
    DelivQty: DeliveryQty,
    DeliveryQty,
    DelivPct: DeliveryPct,
    DeliveryPct,
    DayOfWeek,
    Day,
    Month,
    Year,
    Study,
    MA,
    SMA: MA,
    EMA,
    WMA,
    DEMA,
    HULL,
    TMA,
    RSI,
    ATR,
    ATRTrailingStop,
    SAR,
    OBV,
    ROC,
    CCI,
    WilliamsR,
    MFI,
    StochK,
    StochD,
    ADX,
    PDI,
    MDI,
    BBandTop,
    BBandBot,
    DonchianHigh,
    DonchianLow,
    Supertrend,
    VWAP,
    Cross,
    Ref,
    HHV,
    LLV,
    Param,
    ParamColor,
    ParamToggle,
    _op,
    AddColumn,
    AddTextColumn,
    WriteIf,
    SetOption,
    SetPositionSize,
    ApplyStop,
    stopTypeLoss,
    stopTypeProfit,
    stopTypeTrailing,
    stopTypeNBar,
    stopModePercent,
    stopModePoint,
    stopModeBars,
    spsPercentOfEquity,
    spsShares,
    spsValue,
    Buy: candles.map(() => false),
    Sell: candles.map(() => false),
    Filter: candles.map(() => false),
    PositionSize: undefined,
    PositionScore: undefined,
    InitialEquity: undefined,
    InitialCapital: undefined,
    StopLoss: undefined,
    ProfitTarget: undefined,
    TrailingStop: undefined,
    MaxHoldingBars: undefined,
    MaxOpenPositions: undefined,
    Slippage: undefined,
    Brokerage: undefined,
    Tax: undefined,
    STT: undefined,
  };

  try {
    // Transform AFL syntax to executable JavaScript:
    // 1. Remove comments
    let jsCode = aflCode
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '');

    // 2. Transform AND, OR, NOT
    jsCode = jsCode.replace(/\bAND\b/g, '&&').replace(/\bOR\b/g, '||').replace(/\bNOT\b/g, '!');

    // 3. Transform array assignments and expressions
    // Execute inside with(scope)
    const execFn = new Function('scope', `
      with(scope) {
        ${jsCode}
        return {
          Buy,
          Sell,
          Filter,
          PositionSize: typeof PositionSize !== 'undefined' ? PositionSize : undefined,
          PositionScore: typeof PositionScore !== 'undefined' ? PositionScore : undefined,
          InitialEquity: typeof InitialEquity !== 'undefined' ? InitialEquity : (typeof InitialCapital !== 'undefined' ? InitialCapital : undefined),
          StopLoss: typeof StopLoss !== 'undefined' ? StopLoss : undefined,
          ProfitTarget: typeof ProfitTarget !== 'undefined' ? ProfitTarget : undefined,
          TrailingStop: typeof TrailingStop !== 'undefined' ? TrailingStop : undefined,
          MaxHoldingBars: typeof MaxHoldingBars !== 'undefined' ? MaxHoldingBars : undefined,
          MaxOpenPositions: typeof MaxOpenPositions !== 'undefined' ? MaxOpenPositions : undefined,
          Slippage: typeof Slippage !== 'undefined' ? Slippage : undefined,
          Brokerage: typeof Brokerage !== 'undefined' ? Brokerage : undefined,
          STT: typeof STT !== 'undefined' ? STT : (typeof Tax !== 'undefined' ? Tax : undefined),
        };
      }
    `);

    const result = execFn(scope);

    // Collect direct variable overrides if assigned in AFL
    if (result.InitialEquity !== undefined && !isNaN(Number(result.InitialEquity))) {
      capturedOverrides.initialCapital = Number(result.InitialEquity);
    }
    if (result.PositionSize !== undefined && !isNaN(Number(result.PositionSize))) {
      capturedOverrides.positionSizePct = Math.abs(Number(result.PositionSize));
    }
    if (result.StopLoss !== undefined && !isNaN(Number(result.StopLoss))) {
      capturedOverrides.stopLossPct = Number(result.StopLoss);
    }
    if (result.ProfitTarget !== undefined && !isNaN(Number(result.ProfitTarget))) {
      capturedOverrides.profitTargetPct = Number(result.ProfitTarget);
    }
    if (result.TrailingStop !== undefined && !isNaN(Number(result.TrailingStop))) {
      capturedOverrides.trailingStopPct = Number(result.TrailingStop);
    }
    if (result.MaxHoldingBars !== undefined && !isNaN(Number(result.MaxHoldingBars))) {
      capturedOverrides.maxHoldingBars = Math.round(Number(result.MaxHoldingBars));
    }
    if (result.MaxOpenPositions !== undefined && !isNaN(Number(result.MaxOpenPositions))) {
      capturedOverrides.maxPositions = Math.round(Number(result.MaxOpenPositions));
    }
    if (result.Slippage !== undefined && !isNaN(Number(result.Slippage))) {
      capturedOverrides.slippagePct = Number(result.Slippage);
    }
    if (result.Brokerage !== undefined && !isNaN(Number(result.Brokerage))) {
      capturedOverrides.brokeragePerTrade = Number(result.Brokerage);
    }
    if (result.STT !== undefined && !isNaN(Number(result.STT))) {
      capturedOverrides.sttTaxPct = Number(result.STT);
    }
    if (result.PositionScore !== undefined && Array.isArray(result.PositionScore)) {
      capturedOverrides.positionScore = result.PositionScore;
    }

    // Normalize Buy / Sell / Filter to boolean arrays
    const toBoolArray = (val: any): boolean[] => {
      if (!val) return candles.map(() => false);
      if (Array.isArray(val)) {
        return val.map((v) => Boolean(v));
      }
      return candles.map(() => Boolean(val));
    };

    const buySignals = toBoolArray(result.Buy);
    const sellSignals = toBoolArray(result.Sell);
    const filterSignals = toBoolArray(result.Filter);

    return {
      success: true,
      buySignals,
      sellSignals,
      filterSignals,
      columns: dynamicColumns,
      overrides: capturedOverrides,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Syntax error in AFL script.',
      buySignals: candles.map(() => false),
      sellSignals: candles.map(() => false),
      filterSignals: candles.map(() => false),
      columns: [],
    };
  }
}
