import { CandleBar, StockMetadata } from '../types/market';
import { resolveCanonicalSymbol } from './corporateActions';

export interface ParsedBhavcopyRow {
  symbol: string;
  series: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  prevClose: number;
  volume: number;
  turnover?: number;
  trades?: number;
  deliveryQty?: number;
  deliveryPct?: number;
}

/**
 * Known NSE F&O Symbols set for tagging market type
 */
const KNOWN_FNO_SYMBOLS = new Set([
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'BHARTIARTL', 'TATAMOTORS',
  'TATASTEEL', 'SBIN', 'LT', 'ITC', 'HINDUNILVR', 'BAJFINANCE', 'MARUTI',
  'SUNPHARMA', 'AXISBANK', 'KOTAKBANK', 'TITAN', 'ADANIENT', 'NTPC', 'M&M',
  'TRENT', 'LTIM', 'POWERGRID', 'ONGC', 'COALINDIA', 'BPCL', 'IOC', 'GAIL',
  'BEL', 'HAL', 'BHEL', 'SUZLON', 'ZOMATO', 'JIOFIN', 'IRCTC', 'TATACHEM',
  'TATAPOWER', 'VEDL', 'HINDALCO', 'JSWSTEEL', 'ASIANPAINT', 'ULTRACEMCO',
  'GRASIM', 'CIPLA', 'DRREDDY', 'APOLLOHOSP', 'DIVISLAB', 'EICHERMOT',
  'HEROMOTOCO', 'BAJAJ-AUTO', 'NESTLEIND', 'BRITANNIA', 'INDUSINDBK',
  'TECHM', 'WIPRO', 'HDFCLIFE', 'SBILIFE', 'BAJAJFINSV', 'ADANIPORTS',
  'DLF', 'CANBK', 'PNB', 'YESBANK', 'DIXON', 'POLYCAB', 'PERSISTENT', 'COFORGE',
  'ASTRAL', 'AUROPHARMA', 'BANDHANBNK', 'BANKBARODA', 'BERGEPAINT', 'BIOCON',
  'BOSCHLTD', 'CHOLAFIN', 'COLPAL', 'CONCOR', 'COROMANDEL', 'CUMMINSIND',
  'DABUR', 'DEEPAKNTR', 'ESCORTS', 'EXIDEIND', 'FEDERALBNK', 'GODREJCP',
  'GODREJPROP', 'GRANULES', 'GUJGASLTD', 'HAVELLS', 'HINDCOPPER', 'HINDPETRO',
  'IGL', 'INDUSTOWER', 'IPCALAB', 'JINDALSTEL', 'JUBLFOOD', 'LALPATHLAB',
  'LICHSGFIN', 'LUPIN', 'MANAPPURAM', 'MARICO', 'MCX', 'METROPOLIS', 'MFSL',
  'MGL', 'MOTHERSON', 'MPHASIS', 'MUTHOOTFIN', 'NATIONALUM', 'NAVINFLUOR',
  'OBEROIRLTY', 'OFSS', 'PAGEIND', 'PEL', 'PETRONET', 'PFC', 'PIDILITIND',
  'PIIND', 'PNB', 'RAMCOCEM', 'RBLBANK', 'RECLTD', 'SAIL', 'SHREECEM',
  'SIEMENS', 'SRF', 'SUNTV', 'SYNGENE', 'TATACOMM', 'TVSMOTOR', 'UBL',
  'VOLTAS', 'ZYDUSLIFE'
]);

/**
 * Standardize NSE Date formats:
 * - 28-SEP-2024 -> 2024-09-28
 * - 28/09/2024 -> 2024-09-28
 * - 2024-09-28 -> 2024-09-28
 * - 28-09-2024 -> 2024-09-28
 */
export function normalizeNseDate(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  const months: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
    JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
  };

  // DD-MMM-YYYY (e.g. 28-SEP-2024)
  const dmmmyMatch = clean.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (dmmmyMatch) {
    const day = dmmmyMatch[1].padStart(2, '0');
    const month = months[dmmmyMatch[2].toUpperCase()] || '01';
    const year = dmmmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  return clean;
}

/**
 * Ingest and parse either:
 * 1. Old Bhavcopy (`cmDDMMMYYYYbhav.csv`)
 * 2. New Unified Bhavcopy (`sec_bhavdata_full_DDMMYYYY.csv`)
 * 3. Standard OHLCV CSV
 * 
 * Automatically captures ALL NSE stocks (including new listings, IPOs, SME, Trade-for-Trade).
 */
export function parseBhavcopyCsv(csvText: string): {
  success: boolean;
  rowsCount: number;
  recordsBySymbol: Record<string, CandleBar[]>;
  discoveredMetadata: StockMetadata[];
  errors: string[];
} {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { success: false, rowsCount: 0, recordsBySymbol: {}, discoveredMetadata: [], errors: ['Empty CSV or missing header'] };
  }

  const rawHeaders = lines[0].split(',').map(h => h.trim().toUpperCase().replace(/["']/g, ''));
  const headerMap: Record<string, number> = {};
  rawHeaders.forEach((h, idx) => {
    headerMap[h] = idx;
  });

  const getCol = (possibleCols: string[]): number => {
    for (const c of possibleCols) {
      if (headerMap[c] !== undefined) return headerMap[c];
    }
    return -1;
  };

  const symbolIdx = getCol(['SYMBOL', 'TICKER', 'NAME']);
  const seriesIdx = getCol(['SERIES', 'SER']);
  const dateIdx = getCol(['TIMESTAMP', 'DATE1', 'DATE', 'TRADEDATE']);
  const openIdx = getCol(['OPEN', 'OPEN_PRICE', 'OPENPRICE']);
  const highIdx = getCol(['HIGH', 'HIGH_PRICE', 'HIGHPRICE']);
  const lowIdx = getCol(['LOW', 'LOW_PRICE', 'LOWPRICE']);
  const closeIdx = getCol(['CLOSE', 'CLOSE_PRICE', 'CLOSEPRICE', 'LAST']);
  const volIdx = getCol(['TOTTRDQTY', 'TTL_TRD_QNTY', 'VOLUME', 'VOL', 'TRADED_QTY']);
  const delivQtyIdx = getCol(['DELIV_QTY', 'DELIVERY_QTY', 'DELIVQTY', 'DELIVERYQTY']);
  const delivPctIdx = getCol(['DELIV_PER', 'DELIVERY_PER', 'DELIV_PCT', 'DELIV_PERCENTAGE', 'DELIVPCT']);

  if (symbolIdx === -1 || closeIdx === -1) {
    return {
      success: false,
      rowsCount: 0,
      recordsBySymbol: {},
      discoveredMetadata: [],
      errors: ['Required columns (SYMBOL and CLOSE) not detected in CSV header.'],
    };
  }

  const recordsBySymbol: Record<string, CandleBar[]> = {};
  const metadataMap = new Map<string, StockMetadata>();
  let validCount = 0;
  const errors: string[] = [];

  // Exclude non-equity debt/bond series (government bonds, treasury bills, mutual funds)
  const EXCLUDED_SERIES = new Set(['GS', 'GB', 'SG', 'TB', 'MF']);

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(v => v.trim().replace(/["']/g, ''));
    if (row.length < 4) continue;

    const rawSymbol = row[symbolIdx]?.toUpperCase();
    if (!rawSymbol) continue;

    const series = seriesIdx !== -1 ? (row[seriesIdx]?.toUpperCase() || 'EQ') : 'EQ';
    if (EXCLUDED_SERIES.has(series)) {
      continue;
    }

    const canonicalSymbol = resolveCanonicalSymbol(rawSymbol);
    const date = dateIdx !== -1 ? normalizeNseDate(row[dateIdx]) : new Date().toISOString().split('T')[0];
    const open = openIdx !== -1 ? parseFloat(row[openIdx]) || 0 : parseFloat(row[closeIdx]) || 0;
    const high = highIdx !== -1 ? parseFloat(row[highIdx]) || open : open;
    const low = lowIdx !== -1 ? parseFloat(row[lowIdx]) || open : open;
    const close = parseFloat(row[closeIdx]) || 0;
    const volume = volIdx !== -1 ? parseInt(row[volIdx], 10) || 0 : 100000;
    const delivQty = delivQtyIdx !== -1 && row[delivQtyIdx] ? parseInt(row[delivQtyIdx], 10) : undefined;
    const delivPct = delivPctIdx !== -1 && row[delivPctIdx] ? parseFloat(row[delivPctIdx]) : undefined;

    if (close <= 0) continue;

    if (!recordsBySymbol[canonicalSymbol]) {
      recordsBySymbol[canonicalSymbol] = [];
    }

    recordsBySymbol[canonicalSymbol].push({
      date,
      open,
      high,
      low,
      close,
      volume,
      deliveryQty: delivQty,
      deliveryPct: delivPct !== undefined ? delivPct : (delivQty && volume > 0 ? Math.min(100, Number(((delivQty / volume) * 100).toFixed(2))) : undefined),
    });

    // Auto-discover and generate StockMetadata for ANY symbol from Bhavcopy
    if (!metadataMap.has(canonicalSymbol)) {
      const isFnO = KNOWN_FNO_SYMBOLS.has(canonicalSymbol);
      const isSME = series === 'SM' || series === 'ST';
      const market = isSME ? 'NSE_SME' : isFnO ? 'NSE_FNO' : 'NSE_EQ';
      const group = isSME ? 'NSE SME Emerge' : isFnO ? 'Nifty 50' : 'NSE All Equity';

      metadataMap.set(canonicalSymbol, {
        symbol: canonicalSymbol,
        name: `${canonicalSymbol} Limited`,
        market,
        group,
        sector: isSME ? 'SME Growth' : 'Equities',
        industry: isSME ? 'SME Platform' : 'NSE Listed',
        marketCapCr: Math.round(close * (volume > 10000 ? 50 : 10)),
        isFnO,
        isFavorite: false,
      });
    }

    validCount++;
  }

  // Sort each symbol's candles chronologically
  for (const sym of Object.keys(recordsBySymbol)) {
    recordsBySymbol[sym].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  return {
    success: validCount > 0,
    rowsCount: validCount,
    recordsBySymbol,
    discoveredMetadata: Array.from(metadataMap.values()),
    errors,
  };
}

/**
 * Merge delivery data from MTO file into existing candle bars
 */
export function mergeMtoDeliverableData(
  candles: CandleBar[],
  mtoData: { date: string; deliveryQty: number; deliveryPct: number }[]
): CandleBar[] {
  const mtoMap = new Map<string, { deliveryQty: number; deliveryPct: number }>();
  mtoData.forEach(item => mtoMap.set(item.date, item));

  return candles.map(c => {
    const match = mtoMap.get(c.date);
    if (match) {
      return {
        ...c,
        deliveryQty: match.deliveryQty,
        deliveryPct: match.deliveryPct,
      };
    }
    return c;
  });
}
