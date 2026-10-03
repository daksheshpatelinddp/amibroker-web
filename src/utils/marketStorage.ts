import { CandleBar, StockMetadata } from '../types/market';

const DB_NAME = 'AmiBrokerWebDB';
const DB_VERSION = 1;
const STORE_NAME = 'market_data_store';
const KEY_NAME = 'persistent_market_data';
const KEY_UNIVERSE = 'persistent_stock_universe';

/**
 * Open or create IndexedDB instance
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save current market dataset into persistent IndexedDB storage
 */
export async function saveMarketDataToStorage(data: Record<string, CandleBar[]>): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, KEY_NAME);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[MarketStorage] Failed to save to IndexedDB, fallback to session/memory:', err);
  }
}

/**
 * Load persistent market data from IndexedDB
 */
export async function loadMarketDataFromStorage(): Promise<Record<string, CandleBar[]> | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_NAME);

      req.onsuccess = () => {
        if (req.result && typeof req.result === 'object') {
          resolve(req.result as Record<string, CandleBar[]>);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[MarketStorage] Could not load from IndexedDB:', err);
    return null;
  }
}

/**
 * Save stock universe catalog to IndexedDB
 */
export async function saveStockUniverseToStorage(universe: StockMetadata[]): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(universe, KEY_UNIVERSE);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[MarketStorage] Failed to save universe to IndexedDB:', err);
  }
}

/**
 * Load stock universe catalog from IndexedDB
 */
export async function loadStockUniverseFromStorage(): Promise<StockMetadata[] | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_UNIVERSE);

      req.onsuccess = () => {
        if (Array.isArray(req.result)) {
          resolve(req.result as StockMetadata[]);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[MarketStorage] Could not load universe from IndexedDB:', err);
    return null;
  }
}

/**
 * Clear stored market dataset and universe
 */
export async function clearMarketDataFromStorage(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(KEY_NAME);
      store.delete(KEY_UNIVERSE);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[MarketStorage] Clear error:', err);
  }
}

const R2_CONFIG_KEY = 'amibroker_r2_endpoint_url';
const R2_AUTO_SYNC_KEY = 'amibroker_r2_auto_sync';

export function saveR2EndpointUrl(url: string): void {
  try {
    localStorage.setItem(R2_CONFIG_KEY, url);
  } catch (e) {
    // Ignore localStorage errors
  }
}

export function loadR2EndpointUrl(): string {
  try {
    return localStorage.getItem(R2_CONFIG_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function saveR2AutoSync(enabled: boolean): void {
  try {
    localStorage.setItem(R2_AUTO_SYNC_KEY, enabled ? 'true' : 'false');
  } catch (e) {}
}

export function loadR2AutoSync(): boolean {
  try {
    return localStorage.getItem(R2_AUTO_SYNC_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Resiliently fetch and decompress a file from Cloudflare R2 or CDN
 * Handles:
 * - Pre-decompressed text from browser / CDN
 * - Raw gzip binary streams
 * - Plain JSON and CSV
 */
async function fetchAndDecompressR2Payload(url: string): Promise<{ data: any; rawText: string; isCsv: boolean }> {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} fetching ${url}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let text = '';

  // Check for gzip magic header bytes: 0x1F, 0x8B
  if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    if (typeof DecompressionStream !== 'undefined') {
      try {
        const ds = new DecompressionStream('gzip');
        const stream = new Response(arrayBuffer).body!.pipeThrough(ds);
        text = await new Response(stream).text();
      } catch (err) {
        console.warn(`[R2 Decompress] DecompressionStream failed on ${url}, falling back:`, err);
        text = new TextDecoder('utf-8').decode(bytes);
      }
    } else {
      text = new TextDecoder('utf-8').decode(bytes);
    }
  } else {
    text = new TextDecoder('utf-8').decode(bytes);
  }

  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return { data: parsed, rawText: trimmed, isCsv: false };
    } catch (e) {
      // not JSON, fallback to CSV check
    }
  }

  const isCsv = trimmed.includes(',') && (
    trimmed.includes('SYMBOL') ||
    trimmed.includes('SC_NAME') ||
    trimmed.includes('SC_CODE') ||
    trimmed.includes('CLOSE') ||
    trimmed.includes('OPEN')
  );

  return { data: null, rawText: trimmed, isCsv };
}

export interface R2SyncResult {
  success: boolean;
  message: string;
  source: string;
  totalSymbols: number;
  totalBars: number;
  marketData?: Record<string, CandleBar[]>;
  stockUniverse?: StockMetadata[];
  usedEndpoint?: string;
}

/**
 * Automatically discover and synchronize all symbols and history from Cloudflare R2
 */
export async function syncCloudflareR2Data(customUrl?: string): Promise<R2SyncResult> {
  let cleanUrl = (customUrl || loadR2EndpointUrl()).trim();
  if (!cleanUrl) {
    return {
      success: false,
      message: 'Cloudflare R2 public URL not configured.',
      source: 'NONE',
      totalSymbols: 0,
      totalBars: 0,
    };
  }

  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }
  cleanUrl = cleanUrl.replace(/\/+$/, '');
  saveR2EndpointUrl(cleanUrl);

  const isDirectFile = /\.(csv|json|gz|txt)$/i.test(cleanUrl);

  // 1. If not direct file, first probe manifest.json to learn exact files uploaded by workflows
  let manifest: any = null;
  if (!isDirectFile) {
    const manifestCandidates = [
      `${cleanUrl}/data/manifest.json`,
      `${cleanUrl}/manifest.json`,
    ];
    for (const mUrl of manifestCandidates) {
      try {
        const probe = await fetch(mUrl, { mode: 'cors' });
        if (probe.ok) {
          const mJson = await probe.json();
          if (mJson && typeof mJson === 'object') {
            manifest = mJson;
            console.log('[R2 Sync] Found R2 manifest:', manifest);
            break;
          }
        }
      } catch (e) {
        // manifest not found at this endpoint, continue
      }
    }
  }

  // 2. Build candidate endpoints in priority order
  const candidateUrls: string[] = [];
  if (isDirectFile) {
    candidateUrls.push(cleanUrl);
  } else {
    // If manifest exists, inject manifest-specified files first
    if (manifest && manifest.files) {
      if (manifest.files.bseLatest) candidateUrls.push(`${cleanUrl}/${manifest.files.bseLatest.replace(/^\/+/, '')}`);
      if (manifest.files.nseLatest) candidateUrls.push(`${cleanUrl}/${manifest.files.nseLatest.replace(/^\/+/, '')}`);
      if (manifest.files.eodLatest) candidateUrls.push(`${cleanUrl}/${manifest.files.eodLatest.replace(/^\/+/, '')}`);
      if (manifest.files.symbols) candidateUrls.push(`${cleanUrl}/${manifest.files.symbols.replace(/^\/+/, '')}`);
      if (manifest.files.history) candidateUrls.push(`${cleanUrl}/${manifest.files.history.replace(/^\/+/, '')}`);
    }
    if (manifest && manifest.bseFile) {
      candidateUrls.push(`${cleanUrl}/${manifest.bseFile.replace(/^\/+/, '')}`);
    }
    if (manifest && manifest.historyFile) {
      candidateUrls.push(`${cleanUrl}/${manifest.historyFile.replace(/^\/+/, '')}`);
    }

    // Default standard endpoints uploaded by NSE and BSE pipelines
    candidateUrls.push(
      `${cleanUrl}/data/bse_latest.json.gz`,
      `${cleanUrl}/data/nse_latest.json.gz`,
      `${cleanUrl}/data/eod_latest.json.gz`,
      `${cleanUrl}/data/symbols.json`,
      `${cleanUrl}/data/symbols_bse.json`,
      `${cleanUrl}/data/symbols_nse.json`,
      `${cleanUrl}/bse_bhavcopy.csv`,
      `${cleanUrl}/data/bse_bhavcopy.csv`,
      `${cleanUrl}/bhavcopy.csv`,
      `${cleanUrl}/data/bhavcopy.csv`,
      `${cleanUrl}/data/eod_latest.json`,
      `${cleanUrl}/eod_latest.json`
    );
  }

  let finalMarketData: Record<string, CandleBar[]> = {};
  let finalUniverse: StockMetadata[] = [];
  const successfulEndpoints: string[] = [];
  let detectedSource = manifest?.source || 'R2_DATA';

  // Helper to ingest parsed data
  const processPayload = (payloadData: any, ep: string) => {
    successfulEndpoints.push(ep);
    if (Array.isArray(payloadData)) {
      const symsMeta: StockMetadata[] = payloadData.map((item: any) => ({
        symbol: String(item.symbol || '').toUpperCase(),
        name: item.name || `${item.symbol} Limited`,
        market: item.market || (String(item.symbol).startsWith('5') && /^\d+$/.test(String(item.symbol)) ? 'BSE' : 'NSE_EQ'),
        group: item.group || (String(item.symbol).startsWith('5') ? 'BSE Equities' : 'NSE All Equity'),
        sector: item.sector || 'Equities',
        industry: item.industry || 'Listed Equities',
        marketCapCr: item.marketCapCr || 25000,
        isFnO: Boolean(item.isFnO),
        isFavorite: false,
      }));
      finalUniverse.push(...symsMeta);
    } else if (payloadData && typeof payloadData === 'object') {
      for (const [rawSym, barOrBars] of Object.entries(payloadData)) {
        const sym = rawSym.trim().toUpperCase();
        if (!sym) continue;

        const bars: CandleBar[] = Array.isArray(barOrBars)
          ? (barOrBars as CandleBar[])
          : [barOrBars as CandleBar];

        // Merge or set bars
        if (!finalMarketData[sym]) {
          finalMarketData[sym] = bars;
        } else {
          // If already exists, merge unique dates
          const dateMap = new Map<string, CandleBar>();
          for (const b of finalMarketData[sym]) dateMap.set(b.date, b);
          for (const b of bars) dateMap.set(b.date, b);
          finalMarketData[sym] = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
        }

        const isBseScrip = /^\d+$/.test(sym);
        finalUniverse.push({
          symbol: sym,
          name: isBseScrip ? `BSE Scrip ${sym}` : `${sym} Limited`,
          market: isBseScrip ? 'BSE' : 'NSE_EQ',
          group: isBseScrip ? 'BSE All Equities' : 'NSE All Equity',
          sector: isBseScrip ? 'BSE Listed' : 'Equities',
          industry: isBseScrip ? 'BSE Listed' : 'NSE Listed',
          marketCapCr: 50000,
          isFnO: false,
          isFavorite: false,
        });
      }
    }
  };

  // Try candidate URLs and aggregate all available exchange files
  for (const ep of candidateUrls) {
    try {
      const payload = await fetchAndDecompressR2Payload(ep);
      if (payload.data && typeof payload.data === 'object') {
        processPayload(payload.data, ep);
      }
    } catch (e) {
      // Continue to next file
    }
  }

  const symbolsCount = Object.keys(finalMarketData).length || finalUniverse.length;
  if (symbolsCount === 0) {
    throw new Error(
      `Could not retrieve Bhavcopy data from ${cleanUrl}. Please ensure your R2 bucket has Public Access enabled, or configure CORS: Allowed Origins: ["*"], Allowed Methods: ["GET"].`
    );
  }

  // Deduplicate universe metadata
  const metaMap = new Map<string, StockMetadata>();
  for (const item of finalUniverse) {
    if (!metaMap.has(item.symbol)) {
      metaMap.set(item.symbol, item);
    }
  }
  const cleanUniverse = Array.from(metaMap.values());

  // Save to persistent IndexedDB
  if (Object.keys(finalMarketData).length > 0) {
    await saveMarketDataToStorage(finalMarketData);
  }
  if (cleanUniverse.length > 0) {
    await saveStockUniverseToStorage(cleanUniverse);
  }

  const totalBars = Object.values(finalMarketData).reduce((sum, b) => sum + b.length, 0);

  const usedEpSummary = successfulEndpoints.join(', ') || cleanUrl;

  return {
    success: true,
    message: `Successfully synchronized from Cloudflare R2! Ingested ${symbolsCount.toLocaleString()} symbols automatically across ${successfulEndpoints.length} dataset bundle(s).`,
    source: detectedSource,
    totalSymbols: symbolsCount,
    totalBars,
    marketData: finalMarketData,
    stockUniverse: cleanUniverse,
    usedEndpoint: usedEpSummary,
  };
}
