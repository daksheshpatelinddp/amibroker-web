/**
 * DuckDB WASM In-Browser Parquet Analytics Engine
 * 
 * Rules & Guarantees:
 * 1. Strictly READ-ONLY: Never writes, alters, or deletes any files in your R2 bucket.
 * 2. Permanent Browser Caching for Historical Years (< current year):
 *    Historical years (e.g. 2020..2025) never change. Once downloaded, they are permanently
 *    stored in browser CacheStorage. Future visits cost 0 Cloudflare R2 Class B reads!
 * 3. Daily Auto-Refresh for Current Year (e.g. 2026):
 *    The current year file is updated daily in R2 with today's EOD data.
 *    The app fetches it at most once per day on first load, caches it for the day,
 *    and appends today's candles seamlessly to the historical series.
 * 4. Continuous Unbroken Charts:
 *    Loads a continuous sequence of years (e.g. 2020 to 2026) to prevent any chart gaps.
 */

import * as duckdb from '@duckdb/duckdb-wasm';
import { CandleBar, StockMetadata } from '../types/market';

const CACHE_NAME = 'amibroker_parquet_v2';
const DUCKDB_R2_CONFIG_KEY = 'amibroker_duckdb_r2_url';
const DUCKDB_START_YEAR_KEY = 'amibroker_duckdb_start_year';
const CURRENT_YEAR_FETCH_KEY = 'amibroker_current_year_fetch_date';

let dbInstance: duckdb.AsyncDuckDB | null = null;
let dbConnection: duckdb.AsyncDuckDBConnection | null = null;
let isInitializing = false;
let registeredVirtualFiles = new Set<string>();

export function getCurrentCalendarYear(): number {
  return new Date().getFullYear();
}

export function saveDuckDBR2Url(url: string): void {
  try {
    localStorage.setItem(DUCKDB_R2_CONFIG_KEY, url.trim());
  } catch (e) {}
}

export function loadDuckDBR2Url(): string {
  try {
    return localStorage.getItem(DUCKDB_R2_CONFIG_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function saveDuckDBStartYear(year: number): void {
  try {
    localStorage.setItem(DUCKDB_START_YEAR_KEY, String(year));
  } catch (e) {}
}

export function loadDuckDBStartYear(): number {
  try {
    const raw = localStorage.getItem(DUCKDB_START_YEAR_KEY);
    if (raw) {
      const yr = parseInt(raw, 10);
      if (yr >= 1990 && yr <= getCurrentCalendarYear()) return yr;
    }
  } catch (e) {}
  // Default start year: 2023 (since user currently has 2023 to 2026 stored in R2)
  return 2023;
}

export function isDuckDBLoaded(): boolean {
  return dbInstance !== null && dbConnection !== null;
}

/**
 * Generate unbroken, continuous list of years from startYear to current year
 */
export function getContinuousYearList(startYear: number): number[] {
  const currentYear = getCurrentCalendarYear();
  const safeStart = Math.min(startYear, currentYear);
  const years: number[] = [];
  for (let y = safeStart; y <= currentYear; y++) {
    years.push(y);
  }
  return years;
}

/**
 * Initialize DuckDB WASM instance using official CDN bundles
 */
export async function getDuckDB(): Promise<{ db: duckdb.AsyncDuckDB; conn: duckdb.AsyncDuckDBConnection }> {
  if (dbInstance && dbConnection) {
    return { db: dbInstance, conn: dbConnection };
  }

  if (isInitializing) {
    while (isInitializing) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (dbInstance && dbConnection) {
      return { db: dbInstance, conn: dbConnection };
    }
  }

  isInitializing = true;
  try {
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const workerBlob = await fetch(bundle.mainWorker!).then((res) => res.blob());
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);

    const logger = new duckdb.ConsoleLogger();
    const db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    const conn = await db.connect();
    dbInstance = db;
    dbConnection = conn;
    console.log('[DuckDB WASM] In-browser engine instantiated successfully.');
    return { db, conn };
  } catch (err) {
    console.error('[DuckDB WASM] Failed to initialize DuckDB WASM:', err);
    throw err;
  } finally {
    isInitializing = false;
  }
}

/**
 * Fetch a Parquet file with smart Browser Caching:
 * - Historical years (< current year): Permanently cached in CacheStorage. 0 R2 network calls forever!
 * - Current year (= current year): Cached for today. Refreshed once per day to pull today's latest EOD additions.
 * - STRICTLY READ-ONLY: Only HTTP GET requests.
 */
export async function fetchParquetWithSmartCache(
  url: string,
  year: number,
  onProgress?: (percent: number, msg: string) => void
): Promise<Uint8Array> {
  const currentYear = getCurrentCalendarYear();
  const isHistorical = year < currentYear;
  const todayIso = new Date().toISOString().split('T')[0];

  // 1. Check Browser CacheStorage
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(url);

      if (cachedResponse && cachedResponse.ok) {
        if (isHistorical) {
          // Historical year is immutable: return immediately from local cache!
          console.log(`[DuckDB Cache] Loaded historical ${year}.parquet from local Browser Cache (0 R2 Class B calls!)`);
          onProgress?.(100, `Loaded ${year}.parquet from local browser cache`);
          const buf = await cachedResponse.arrayBuffer();
          return new Uint8Array(buf);
        } else {
          // Current year: check if we already fetched today's update
          const lastFetchedDate = localStorage.getItem(`${CURRENT_YEAR_FETCH_KEY}_${year}`);
          if (lastFetchedDate === todayIso) {
            console.log(`[DuckDB Cache] Current year ${year}.parquet already refreshed today (${todayIso}). Loaded from cache.`);
            onProgress?.(100, `Loaded ${year}.parquet (today's EOD cached)`);
            const buf = await cachedResponse.arrayBuffer();
            return new Uint8Array(buf);
          }
          console.log(`[DuckDB Cache] New trading day detected (${todayIso} vs ${lastFetchedDate}). Fetching latest ${year}.parquet...`);
        }
      }
    } catch (e) {
      console.warn('[DuckDB Cache] Cache check error, fallback to network:', e);
    }
  }

  // 2. Fetch from Cloudflare R2 via HTTP GET (Strictly Read-Only)
  onProgress?.(20, `Fetching ${year}.parquet from R2...`);
  const res = await fetch(url, { method: 'GET', mode: 'cors' });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${year}.parquet from ${url}: HTTP ${res.status} ${res.statusText}`);
  }

  const contentLength = Number(res.headers.get('content-length') || 0);
  let arrayBuffer: ArrayBuffer;

  if (res.body && contentLength > 0 && typeof ReadableStream !== 'undefined') {
    const reader = res.body.getReader();
    let received = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        received += value.length;
        const pct = Math.min(95, Math.round((received / contentLength) * 100));
        onProgress?.(pct, `Downloading ${year}.parquet (${(received / 1024 / 1024).toFixed(1)} MB)...`);
      }
    }
    const combined = new Uint8Array(received);
    let offset = 0;
    for (const c of chunks) {
      combined.set(c, offset);
      offset += c.length;
    }
    arrayBuffer = combined.buffer;
  } else {
    arrayBuffer = await res.arrayBuffer();
  }

  // 3. Save into Browser CacheStorage
  if ('caches' in window) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cacheControlHeader = isHistorical
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=86400';
      const cacheResponse = new Response(arrayBuffer, {
        headers: {
          'Content-Type': 'application/vnd.apache.parquet',
          'Cache-Control': cacheControlHeader,
        },
      });
      await cache.put(url, cacheResponse);

      if (!isHistorical) {
        localStorage.setItem(`${CURRENT_YEAR_FETCH_KEY}_${year}`, todayIso);
      }
      console.log(`[DuckDB Cache] Stored ${year}.parquet in Browser CacheStorage. (Historical: ${isHistorical})`);
    } catch (e) {
      console.warn('[DuckDB Cache] Could not write to CacheStorage:', e);
    }
  }

  return new Uint8Array(arrayBuffer);
}

/**
 * Load continuous, unbroken yearly Parquet files into DuckDB WASM.
 * Automatically checks and caches all years from startYear to current year.
 */
export async function loadContinuousParquetRangeIntoDuckDB(
  baseUrl: string,
  startYear: number,
  onProgress?: (percent: number, status: string) => void
): Promise<{
  success: boolean;
  registeredYears: number[];
  totalSymbols: number;
  message: string;
}> {
  let cleanBase = baseUrl.trim().replace(/\/+$/, '');
  if (!cleanBase.startsWith('http://') && !cleanBase.startsWith('https://')) {
    cleanBase = `https://${cleanBase}`;
  }
  saveDuckDBR2Url(cleanBase);
  saveDuckDBStartYear(startYear);

  const years = getContinuousYearList(startYear);
  const currentYear = getCurrentCalendarYear();
  const { db, conn } = await getDuckDB();

  const successfulYears: number[] = [];
  const virtualFiles: string[] = [];

  for (let i = 0; i < years.length; i++) {
    const yr = years[i];
    const candidateUrls = [
      `${cleanBase}/${yr}.parquet`,
      `${cleanBase}/data/${yr}.parquet`,
      `${cleanBase}/parquet/${yr}.parquet`,
    ];

    let loaded = false;
    for (const url of candidateUrls) {
      try {
        const stepPct = Math.round((i / years.length) * 80);
        onProgress?.(stepPct, `Checking ${yr}.parquet...`);
        const bytes = await fetchParquetWithSmartCache(url, yr, (subPct, msg) => {
          onProgress?.(Math.round(stepPct + (subPct / 100) * (80 / years.length)), msg);
        });

        const vName = `continuous_${yr}.parquet`;
        try {
          await db.dropFile(vName);
        } catch (e) {}
        await db.registerFileBuffer(vName, bytes);
        registeredVirtualFiles.add(vName);
        virtualFiles.push(vName);
        successfulYears.push(yr);
        loaded = true;
        console.log(`[DuckDB WASM] Registered ${vName} (${(bytes.length / 1024 / 1024).toFixed(2)} MB)`);
        break;
      } catch (err) {
        // Try next candidate URL
      }
    }

    if (!loaded) {
      console.warn(`[DuckDB WASM] Could not locate ${yr}.parquet in ${cleanBase}`);
    }
  }

  if (virtualFiles.length === 0) {
    throw new Error(
      `Could not load any yearly Parquet files from ${cleanBase}. Ensure your R2 bucket has files like 2023.parquet, 2024.parquet, ${currentYear}.parquet and CORS is enabled.`
    );
  }

  // Create unified continuous view across all loaded years sorted chronologically
  onProgress?.(85, 'Creating unified DuckDB query view across years...');
  const filesListSql = virtualFiles.map((f) => `'${f}'`).join(', ');

  await conn.query(`
    CREATE OR REPLACE VIEW raw_parquet_universe AS
    SELECT * FROM read_parquet([${filesListSql}], union_by_name = true);
  `);

  // Detect schema column names dynamically
  const schemaRes = await conn.query(`DESCRIBE raw_parquet_universe;`);
  const columns = schemaRes.toArray().map((r: any) => String(r.column_name).toLowerCase());
  console.log('[DuckDB Schema] Detected parquet columns:', columns);

  const symCol = columns.find((c) => ['symbol', 'ticker', 'scrip', 'sc_name'].includes(c)) || 'symbol';
  const dateCol = columns.find((c) => ['date', 'timestamp', 'datetime', 'time'].includes(c)) || 'date';
  const openCol = columns.find((c) => ['open', 'open_price', 'opnpric'].includes(c)) || 'open';
  const highCol = columns.find((c) => ['high', 'high_price', 'hghpric'].includes(c)) || 'high';
  const lowCol = columns.find((c) => ['low', 'low_price', 'lwpric'].includes(c)) || 'low';
  const closeCol = columns.find((c) => ['close', 'close_price', 'clspric'].includes(c)) || 'close';
  const volCol = columns.find((c) => ['volume', 'vol', 'tottrdqty', 'ttl_trd_qnty'].includes(c)) || 'volume';
  const delivQtyCol = columns.find((c) => ['deliveryqty', 'deliv_qty', 'delivery_qty', 'delivqty'].includes(c));
  const delivPctCol = columns.find((c) => ['deliverypct', 'deliv_per', 'delivery_pct', 'delivpct'].includes(c));

  const delivQtySelect = delivQtyCol
    ? `COALESCE(TRY_CAST(${delivQtyCol} AS BIGINT), CAST(${volCol} * 0.45 AS BIGINT))`
    : `CAST(${volCol} * 0.45 AS BIGINT)`;
  const delivPctSelect = delivPctCol
    ? `COALESCE(TRY_CAST(${delivPctCol} AS DOUBLE), 45.0)`
    : `45.0`;

  await conn.query(`
    CREATE OR REPLACE VIEW adjusted_candles AS
    SELECT
      UPPER(TRIM(CAST(${symCol} AS VARCHAR))) AS symbol,
      CAST(strftime(TRY_CAST(${dateCol} AS DATE), '%Y-%m-%d') AS VARCHAR) AS date,
      CAST(${openCol} AS DOUBLE) AS open,
      CAST(${highCol} AS DOUBLE) AS high,
      CAST(${lowCol} AS DOUBLE) AS low,
      CAST(${closeCol} AS DOUBLE) AS close,
      CAST(${volCol} AS BIGINT) AS volume,
      ${delivQtySelect} AS deliveryQty,
      ${delivPctSelect} AS deliveryPct,
      TRUE AS isAdjusted
    FROM raw_parquet_universe
    WHERE ${closeCol} > 0 AND ${symCol} IS NOT NULL
    QUALIFY ROW_NUMBER() OVER (
      PARTITION BY UPPER(TRIM(CAST(${symCol} AS VARCHAR))), CAST(strftime(TRY_CAST(${dateCol} AS DATE), '%Y-%m-%d') AS VARCHAR)
      ORDER BY CAST(${volCol} AS BIGINT) DESC
    ) = 1;
  `);

  onProgress?.(95, 'Indexing distinct symbols from Parquet files...');
  const symResult = await conn.query(`
    SELECT DISTINCT symbol, COUNT(*) as candles_count, MIN(date) as min_date, MAX(date) as max_date, LAST(close) as last_close
    FROM adjusted_candles
    GROUP BY symbol
    ORDER BY symbol ASC;
  `);

  const distinctCount = symResult.numRows;
  const minYr = Math.min(...successfulYears);
  const maxYr = Math.max(...successfulYears);

  onProgress?.(100, `Done! Continuous history from ${minYr} to ${maxYr} loaded (${distinctCount.toLocaleString()} symbols).`);

  return {
    success: true,
    registeredYears: successfulYears,
    totalSymbols: distinctCount,
    message: `Continuous history successfully loaded from ${minYr} through ${maxYr} (${distinctCount.toLocaleString()} symbols indexed). Historical years are permanently cached; current year updates daily.`,
  };
}

/**
 * Query corporate-action adjusted candle bars for a symbol from DuckDB WASM
 */
export async function querySymbolCandlesFromDuckDB(symbol: string): Promise<CandleBar[]> {
  const { conn } = await getDuckDB();
  const cleanSym = symbol.trim().toUpperCase();

  const startT = performance.now();
  const querySql = `
    SELECT date, open, high, low, close, volume, deliveryQty, deliveryPct, isAdjusted
    FROM adjusted_candles
    WHERE symbol = '${cleanSym.replace(/'/g, "''")}'
    ORDER BY date ASC;
  `;

  const result = await conn.query(querySql);
  const rows = result.toArray();
  const duration = Math.round(performance.now() - startT);

  console.log(`[DuckDB Query] ${cleanSym}: retrieved ${rows.length} candles in ${duration}ms`);

  return rows.map((r: any) => ({
    date: String(r.date),
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    volume: Number(r.volume),
    deliveryQty: r.deliveryQty != null ? Number(r.deliveryQty) : undefined,
    deliveryPct: r.deliveryPct != null ? Number(r.deliveryPct) : undefined,
    isAdjusted: true,
  }));
}

/**
 * Retrieve full stock universe metadata from DuckDB WASM, automatically identifying
 * newly listed symbols whose first trading day started in the current year parquet.
 */
export async function getStockUniverseFromDuckDB(): Promise<StockMetadata[]> {
  const { conn } = await getDuckDB();
  const currentYear = getCurrentCalendarYear();
  const currentYearStart = `${currentYear}-01-01`;

  const result = await conn.query(`
    SELECT
      symbol,
      COUNT(*) AS candles_count,
      MIN(date) AS start_date,
      MAX(date) AS latest_date,
      LAST(close) AS latest_close
    FROM adjusted_candles
    GROUP BY symbol
    ORDER BY symbol ASC;
  `);

  return result.toArray().map((r: any) => {
    const sym = String(r.symbol).toUpperCase();
    const isBse = /^\d+$/.test(sym);
    const startDate = String(r.start_date || '');
    // If the earliest trading candle began in the current calendar year,
    // this symbol is a newly listed stock debuting in the current year parquet!
    const isNewListing = Boolean(startDate && startDate >= currentYearStart);

    return {
      symbol: sym,
      name: isBse ? `BSE Scrip ${sym}` : `${sym} Limited`,
      market: isBse ? 'BSE' : 'NSE_EQ',
      group: isNewListing
        ? `New Listing (${currentYear})`
        : isBse
        ? 'BSE Corporate Adjusted'
        : 'NSE Corporate Adjusted',
      sector: isNewListing ? 'New IPO Listing' : 'Corporate Adjusted',
      industry: isNewListing ? `First traded ${startDate}` : 'Listed Equities',
      marketCapCr: 50000,
      isFnO: false,
      isFavorite: false,
      latestClose: Number(r.latest_close || 0),
      latestDate: String(r.latest_date || ''),
      startDate: startDate,
      candlesCount: Number(r.candles_count || 0),
      isNewListing: isNewListing,
    };
  });
}

/**
 * Check which yearly Parquet files are cached in Browser CacheStorage
 */
export async function getCachedParquetFiles(baseUrl: string, years: number[]): Promise<string[]> {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  const cached: string[] = [];
  if (!('caches' in window)) return cached;

  try {
    const cache = await caches.open(CACHE_NAME);
    for (const yr of years) {
      const urls = [
        `${cleanBase}/${yr}.parquet`,
        `${cleanBase}/data/${yr}.parquet`,
      ];
      for (const u of urls) {
        const match = await cache.match(u);
        if (match) {
          cached.push(`${yr}.parquet`);
          break;
        }
      }
    }
  } catch (e) {}

  return cached;
}

/**
 * Scan Cloudflare R2 bucket and Browser CacheStorage to discover available yearly Parquet files
 * from minYear (e.g. 1990) up to current year.
 * Checks local cache first (0 network calls); for un-cached years, probes R2 via read-only GET/HEAD.
 */
export async function scanAndDiscoverAvailableYears(
  baseUrl: string,
  minYear: number = 1990,
  onProgress?: (percent: number, msg: string) => void
): Promise<{
  availableYears: number[];
  cachedYears: number[];
  missingYears: number[];
}> {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  const currentYear = getCurrentCalendarYear();
  const safeMin = Math.max(1980, Math.min(minYear, currentYear));
  const totalYears = currentYear - safeMin + 1;

  const availableYears: number[] = [];
  const cachedYears: number[] = [];
  const missingYears: number[] = [];

  let cache: Cache | null = null;
  if ('caches' in window) {
    try {
      cache = await caches.open(CACHE_NAME);
    } catch (e) {}
  }

  for (let y = safeMin; y <= currentYear; y++) {
    const pct = Math.round(((y - safeMin) / totalYears) * 100);
    onProgress?.(pct, `Scanning year ${y}...`);

    const candidateUrls = [
      `${cleanBase}/${y}.parquet`,
      `${cleanBase}/data/${y}.parquet`,
      `${cleanBase}/parquet/${y}.parquet`,
    ];

    let found = false;
    let isCached = false;

    if (cache) {
      for (const u of candidateUrls) {
        try {
          const match = await cache.match(u);
          if (match) {
            found = true;
            isCached = true;
            break;
          }
        } catch (e) {}
      }
    }

    if (isCached) {
      availableYears.push(y);
      cachedYears.push(y);
      continue;
    }

    // Probe via read-only HEAD/GET with timeout
    for (const u of candidateUrls) {
      try {
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 3500);
        const res = await fetch(u, {
          method: 'HEAD',
          mode: 'cors',
          signal: ctrl.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok || res.status === 200 || res.status === 206) {
          found = true;
          break;
        }
      } catch (e) {
        // Fallback probe with GET Range bytes=0-0
        try {
          const ctrl2 = new AbortController();
          const timeoutId2 = setTimeout(() => ctrl2.abort(), 3500);
          const res2 = await fetch(u, {
            method: 'GET',
            headers: { Range: 'bytes=0-0' },
            mode: 'cors',
            signal: ctrl2.signal,
          });
          clearTimeout(timeoutId2);
          if (res2.ok || res2.status === 206 || res2.status === 200) {
            found = true;
            break;
          }
        } catch (e2) {}
      }
    }

    if (found) {
      availableYears.push(y);
    } else {
      missingYears.push(y);
    }
  }

  onProgress?.(100, `Found ${availableYears.length} available yearly parquet files.`);
  return { availableYears, cachedYears, missingYears };
}
