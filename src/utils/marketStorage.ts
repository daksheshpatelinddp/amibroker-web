import { CandleBar } from '../types/market';

const DB_NAME = 'AmiBrokerWebDB';
const DB_VERSION = 1;
const STORE_NAME = 'market_data_store';
const KEY_NAME = 'persistent_market_data';

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
 * Clear stored market dataset
 */
export async function clearMarketDataFromStorage(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[MarketStorage] Clear error:', err);
  }
}
