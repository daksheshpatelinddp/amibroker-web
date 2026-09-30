import { CandleBar, StockMetadata } from '../types/market';

export const STOCK_UNIVERSE: StockMetadata[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Energy', industry: 'Integrated Oil, Gas & Telecom', marketCapCr: 1980000, isFnO: true, isFavorite: true },
  { symbol: 'TCS', name: 'Tata Consultancy Services', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Information Technology', industry: 'IT Services & Consulting', marketCapCr: 1520000, isFnO: true, isFavorite: true },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Financial Services', industry: 'Private Sector Banking', marketCapCr: 1310000, isFnO: true, isFavorite: true },
  { symbol: 'INFY', name: 'Infosys Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Information Technology', industry: 'IT Services & Consulting', marketCapCr: 780000, isFnO: true, isFavorite: false },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Financial Services', industry: 'Private Sector Banking', marketCapCr: 890000, isFnO: true, isFavorite: false },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Automobile', industry: 'Commercial Vehicles & EVs', marketCapCr: 360000, isFnO: true, isFavorite: true },
  { symbol: 'TATASTEEL', name: 'Tata Steel Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Metals & Mining', industry: 'Steel & Ferro Alloys', marketCapCr: 195000, isFnO: true, isFavorite: false },
  { symbol: 'SBIN', name: 'State Bank of India', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Financial Services', industry: 'Public Sector Banking', marketCapCr: 710000, isFnO: true, isFavorite: false },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Capital Goods', industry: 'EPC Infrastructure & Defense', marketCapCr: 490000, isFnO: true, isFavorite: true },
  { symbol: 'ITC', name: 'ITC Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'FMCG', industry: 'Diversified FMCG, Cigarettes & Paper', marketCapCr: 610000, isFnO: true, isFavorite: false },
  { symbol: 'LTIM', name: 'LTIMindtree Limited', market: 'NSE_FNO', group: 'Nifty 50', sector: 'Information Technology', industry: 'IT Solutions & Cloud Services', marketCapCr: 165000, isFnO: true, isFavorite: false },
];

/**
 * Generate deterministic, realistic multi-year historical candles (250+ trading days)
 * incorporating real market patterns: trends, pullbacks, volatility, and corporate action events.
 */
export function generateRealisticNseHistory(
  symbol: string,
  basePrice: number,
  volatility: number,
  trendFactor: number,
  corporateEvent?: { date: string; type: 'SPLIT' | 'BONUS' | 'DEMERGER'; factor: number }
): CandleBar[] {
  const bars: CandleBar[] = [];
  const days = 300; // ~1.2 years of trading days
  let currentClose = basePrice;

  // Start roughly 300 trading days prior
  const startDate = new Date('2023-08-01');

  // Pseudo-random deterministic generator based on symbol string
  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed = (seed * 31 + symbol.charCodeAt(i)) & 0xffffffff;
  }
  const pseudoRandom = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return (seed >>> 0) / 4294967296;
  };

  let currentDate = new Date(startDate);

  for (let i = 0; i < days; i++) {
    // Skip weekends
    while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
    const dateStr = currentDate.toISOString().split('T')[0];

    // Check if we passed the unadjusted corporate event (simulate raw unadjusted jump)
    if (corporateEvent && dateStr === corporateEvent.date) {
      // In raw unadjusted data, on the ex-date the price suddenly drops according to the event!
      currentClose = currentClose * corporateEvent.factor;
    }

    const shock = (pseudoRandom() - 0.485) * volatility * currentClose + trendFactor * (currentClose * 0.0008);
    const prevClose = currentClose;
    currentClose = Math.max(10, currentClose + shock);

    const openNoise = (pseudoRandom() - 0.5) * 0.008 * currentClose;
    const open = Number((prevClose + openNoise).toFixed(2));
    const high = Number((Math.max(open, currentClose) + pseudoRandom() * 0.015 * currentClose).toFixed(2));
    const low = Number((Math.min(open, currentClose) - pseudoRandom() * 0.015 * currentClose).toFixed(2));
    const close = Number(currentClose.toFixed(2));

    // Volume & Delivery
    const baseVolume = 1500000 + Math.floor(pseudoRandom() * 3000000);
    // Institutional delivery percentage: typically between 35% and 72% on NSE cash
    const deliveryPct = Number((38 + pseudoRandom() * 34).toFixed(2));
    const deliveryQty = Math.round(baseVolume * (deliveryPct / 100));

    bars.push({
      date: dateStr,
      open,
      high,
      low,
      close,
      volume: baseVolume,
      deliveryQty,
      deliveryPct,
      turnover: Math.round((baseVolume * close) / 100000), // Lakhs
      trades: Math.floor(baseVolume / 45),
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return bars;
}

// Generate base unadjusted raw historical datasets for all symbols
export const INITIAL_MARKET_DATA: Record<string, CandleBar[]> = {
  RELIANCE: generateRealisticNseHistory('RELIANCE', 2450, 0.018, 0.35, {
    date: '2024-10-28',
    type: 'BONUS',
    factor: 0.5,
  }),
  TCS: generateRealisticNseHistory('TCS', 3400, 0.016, 0.25),
  HDFCBANK: generateRealisticNseHistory('HDFCBANK', 1580, 0.017, 0.15),
  INFY: generateRealisticNseHistory('INFY', 1420, 0.02, 0.3),
  ICICIBANK: generateRealisticNseHistory('ICICIBANK', 980, 0.016, 0.45),
  TATAMOTORS: generateRealisticNseHistory('TATAMOTORS', 610, 0.024, 0.6),
  TATASTEEL: generateRealisticNseHistory('TATASTEEL', 118, 0.022, 0.2), // post split level
  SBIN: generateRealisticNseHistory('SBIN', 570, 0.019, 0.4),
  LT: generateRealisticNseHistory('LT', 2700, 0.018, 0.5),
  ITC: generateRealisticNseHistory('ITC', 440, 0.014, 0.2),
  LTIM: generateRealisticNseHistory('LTIM', 4850, 0.022, 0.28),
};

/**
 * Generate 20-Year (2004 - 2026) Full Historical NSE Dataset (~5,200 trading days)
 * Faithfully modeling 2 decades of NSE bull runs, GFC crash, COVID crash, rallies,
 * and key corporate action ex-dates.
 */
export function generateTwentyYearHistory(
  symbol: string,
  startPrice2004: number,
  corporateEvents: { date: string; type: 'SPLIT' | 'BONUS' | 'DEMERGER' | 'RIGHTS'; factor: number }[] = []
): CandleBar[] {
  const bars: CandleBar[] = [];
  const startDate = new Date('2004-01-01');
  const endDate = new Date('2026-03-01');

  let seed = 0;
  for (let i = 0; i < symbol.length; i++) {
    seed = (seed * 37 + symbol.charCodeAt(i)) & 0xffffffff;
  }
  const prng = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return (seed >>> 0) / 4294967296;
  };

  let currentClose = startPrice2004;
  let cur = new Date(startDate);

  // Map of events by date
  const eventMap = new Map<string, { type: string; factor: number }>();
  corporateEvents.forEach((e) => eventMap.set(e.date, e));

  while (cur <= endDate) {
    // Skip Saturday & Sunday
    if (cur.getDay() !== 0 && cur.getDay() !== 6) {
      const dateStr = cur.toISOString().split('T')[0];

      // If unadjusted corporate event date reached
      if (eventMap.has(dateStr)) {
        const ev = eventMap.get(dateStr)!;
        currentClose = currentClose * ev.factor;
      }

      // Year-based macroeconomic trend weight
      const year = cur.getFullYear();
      let regimeTrend = 0.0003;
      let regimeVol = 0.015;

      if (year >= 2004 && year <= 2007) {
        regimeTrend = 0.0009; // Strong India growth cycle
        regimeVol = 0.016;
      } else if (year === 2008) {
        regimeTrend = -0.0018; // Global Financial Crisis crash
        regimeVol = 0.035;
      } else if (year === 2009) {
        regimeTrend = 0.0016; // GFC Recovery
        regimeVol = 0.025;
      } else if (year === 2020 && cur.getMonth() >= 1 && cur.getMonth() <= 3) {
        regimeTrend = -0.0035; // COVID pandemic crash
        regimeVol = 0.045;
      } else if (year === 2020 && cur.getMonth() > 3) {
        regimeTrend = 0.0022; // Post-COVID massive recovery
        regimeVol = 0.02;
      } else if (year >= 2021) {
        regimeTrend = 0.0007; // Structural India bull run
        regimeVol = 0.014;
      }

      const dailyRet = (prng() - 0.485) * regimeVol + regimeTrend;
      const prevClose = currentClose;
      currentClose = Math.max(5, currentClose * (1 + dailyRet));

      const openNoise = (prng() - 0.5) * 0.006 * currentClose;
      const open = Number((prevClose + openNoise).toFixed(2));
      const high = Number((Math.max(open, currentClose) + prng() * 0.012 * currentClose).toFixed(2));
      const low = Number((Math.min(open, currentClose) - prng() * 0.012 * currentClose).toFixed(2));
      const close = Number(currentClose.toFixed(2));

      // 20-year volume expansion (from ~200k shares/day in 2004 to 5M+ shares/day in 2025)
      const yearMultiplier = 0.2 + ((year - 2004) / 22) * 2.5;
      const baseVol = Math.round((600000 + prng() * 1800000) * yearMultiplier);
      const deliveryPct = Number((35 + prng() * 35).toFixed(1));
      const deliveryQty = Math.round(baseVol * (deliveryPct / 100));

      bars.push({
        date: dateStr,
        open,
        high,
        low,
        close,
        volume: baseVol,
        deliveryQty,
        deliveryPct,
        turnover: Math.round((baseVol * close) / 100000),
        trades: Math.floor(baseVol / 50),
      });
    }
    cur.setDate(cur.getDate() + 1);
  }

  return bars;
}

/**
 * Generate 20-Year Dataset for all key symbols
 */
export function generateFullTwentyYearMarketData(): Record<string, CandleBar[]> {
  return {
    RELIANCE: generateTwentyYearHistory('RELIANCE', 120, [
      { date: '2009-11-26', type: 'BONUS', factor: 0.5 },
      { date: '2017-09-07', type: 'BONUS', factor: 0.5 },
      { date: '2020-05-14', type: 'RIGHTS', factor: 0.985 },
      { date: '2023-07-20', type: 'DEMERGER', factor: 0.905 },
      { date: '2024-10-28', type: 'BONUS', factor: 0.5 },
    ]),
    TCS: generateTwentyYearHistory('TCS', 130, [
      { date: '2006-07-28', type: 'BONUS', factor: 0.5 },
      { date: '2009-06-16', type: 'BONUS', factor: 0.5 },
      { date: '2018-05-31', type: 'BONUS', factor: 0.5 },
    ]),
    INFY: generateTwentyYearHistory('INFY', 85, [
      { date: '2006-07-14', type: 'BONUS', factor: 0.5 },
      { date: '2014-12-02', type: 'BONUS', factor: 0.5 },
      { date: '2015-06-15', type: 'BONUS', factor: 0.5 },
      { date: '2018-09-04', type: 'BONUS', factor: 0.5 },
    ]),
    HDFCBANK: generateTwentyYearHistory('HDFCBANK', 45, [
      { date: '2011-07-14', type: 'SPLIT', factor: 0.2 },
      { date: '2019-09-19', type: 'SPLIT', factor: 0.5 },
    ]),
    ICICIBANK: generateTwentyYearHistory('ICICIBANK', 55, [
      { date: '2014-12-04', type: 'SPLIT', factor: 0.2 },
      { date: '2017-06-20', type: 'BONUS', factor: 0.909 },
    ]),
    TATASTEEL: generateTwentyYearHistory('TATASTEEL', 40, [
      { date: '2022-07-28', type: 'SPLIT', factor: 0.1 },
    ]),
    TATAMOTORS: generateTwentyYearHistory('TATAMOTORS', 70, [
      { date: '2011-09-12', type: 'SPLIT', factor: 0.2 },
    ]),
    SBIN: generateTwentyYearHistory('SBIN', 50, [
      { date: '2014-11-20', type: 'SPLIT', factor: 0.1 },
    ]),
    LT: generateTwentyYearHistory('LT', 160, [
      { date: '2006-09-28', type: 'BONUS', factor: 0.5 },
      { date: '2008-09-29', type: 'BONUS', factor: 0.5 },
      { date: '2013-07-11', type: 'BONUS', factor: 0.5 },
    ]),
    ITC: generateTwentyYearHistory('ITC', 35, [
      { date: '2005-09-21', type: 'SPLIT', factor: 0.1 },
      { date: '2005-09-21', type: 'BONUS', factor: 0.5 },
      { date: '2010-08-03', type: 'BONUS', factor: 0.667 },
      { date: '2016-07-01', type: 'BONUS', factor: 0.5 },
    ]),
    LTIM: generateTwentyYearHistory('LTIM', 380, [
      { date: '2022-11-24', type: 'DEMERGER', factor: 1.0 },
    ]),
  };
}

/**
 * Fetch / Simulate Real-Time Live Google Finance Intraday Feed
 * Allows intraday charting (1m, 5m, 15m, 1h) with live market ticks.
 */
export function simulateGoogleIntradayStream(
  symbol: string,
  lastClose: number,
  barsCount: number = 60
): CandleBar[] {
  const bars: CandleBar[] = [];
  const now = new Date();
  let currentPrice = lastClose;

  for (let i = barsCount; i >= 0; i--) {
    const barTime = new Date(now.getTime() - i * 60 * 1000);
    const timeStr = `${barTime.toISOString().split('T')[0]} ${String(barTime.getHours()).padStart(2, '0')}:${String(barTime.getMinutes()).padStart(2, '0')}`;
    const delta = (Math.random() - 0.49) * (lastClose * 0.0018);
    const bOpen = currentPrice;
    currentPrice = Number(Math.max(10, currentPrice + delta).toFixed(2));
    const bHigh = Number((Math.max(bOpen, currentPrice) + Math.random() * (lastClose * 0.0008)).toFixed(2));
    const bLow = Number((Math.min(bOpen, currentPrice) - Math.random() * (lastClose * 0.0008)).toFixed(2));
    const bClose = currentPrice;
    const vol = Math.floor(5000 + Math.random() * 25000);
    const deliv = Math.round(vol * (0.4 + Math.random() * 0.25));

    bars.push({
      date: timeStr,
      open: bOpen,
      high: bHigh,
      low: bLow,
      close: bClose,
      volume: vol,
      deliveryQty: deliv,
      deliveryPct: Number(((deliv / vol) * 100).toFixed(1)),
    });
  }

  return bars;
}

/**
 * Append Today's EOD Daily Bhavcopy Bar
 */
export function appendDailyEodBar(
  currentBars: CandleBar[],
  symbol: string
): CandleBar[] {
  if (!currentBars || currentBars.length === 0) return currentBars;
  const lastBar = currentBars[currentBars.length - 1];
  const lastDate = new Date(lastBar.date);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + 1);
  while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  const dateStr = nextDate.toISOString().split('T')[0];

  // Prevent duplicate date
  if (currentBars.some((b) => b.date === dateStr)) {
    return currentBars;
  }

  const change = (Math.random() - 0.48) * (lastBar.close * 0.018);
  const newClose = Number((lastBar.close + change).toFixed(2));
  const newOpen = Number((lastBar.close + (Math.random() - 0.5) * (lastBar.close * 0.005)).toFixed(2));
  const newHigh = Number((Math.max(newOpen, newClose) + Math.random() * (lastBar.close * 0.008)).toFixed(2));
  const newLow = Number((Math.min(newOpen, newClose) - Math.random() * (lastBar.close * 0.008)).toFixed(2));
  const newVol = Math.round(lastBar.volume * (0.8 + Math.random() * 0.5));
  const newDeliv = Math.round(newVol * (0.42 + Math.random() * 0.2));

  const newBar: CandleBar = {
    date: dateStr,
    open: newOpen,
    high: newHigh,
    low: newLow,
    close: newClose,
    volume: newVol,
    deliveryQty: newDeliv,
    deliveryPct: Number(((newDeliv / newVol) * 100).toFixed(1)),
    turnover: Math.round((newVol * newClose) / 100000),
    trades: Math.floor(newVol / 45),
  };

  return [...currentBars, newBar];
}
