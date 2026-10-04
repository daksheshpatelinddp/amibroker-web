import { StockMetadata, Watchlist } from '../types/market';
import { STOCK_UNIVERSE } from './sampleData';

export const DEFAULT_WATCHLISTS: Watchlist[] = [
  {
    id: 'wl-core-nifty50',
    name: 'Core Nifty 50 Largecap',
    description: 'High liquidity bellwethers of Indian equities',
    symbols: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'LT'],
    isDefault: true,
    color: '#06b6d4',
  },
  {
    id: 'wl-high-beta-fno',
    name: 'High Beta F&O Momentum',
    description: 'Active derivative counters with high intraday range and swings',
    symbols: ['TATAMOTORS', 'TATASTEEL', 'SBIN', 'RELIANCE'],
    isDefault: false,
    color: '#f59e0b',
  },
  {
    id: 'wl-banking-financials',
    name: 'Banking & Financials',
    description: 'Leading private and public sector lenders',
    symbols: ['HDFCBANK', 'ICICIBANK', 'SBIN'],
    isDefault: false,
    color: '#10b981',
  },
  {
    id: 'wl-tech-leaders',
    name: 'Technology & Digital IT',
    description: 'IT consulting, software and digital transformation leaders',
    symbols: ['TCS', 'INFY', 'LTIM'],
    isDefault: false,
    color: '#a855f7',
  },
];

const WATCHLISTS_STORAGE_KEY = 'amibroker_web_watchlists_v1';
const FAVORITES_STORAGE_KEY = 'amibroker_web_favorites_v1';

/**
 * Load watchlists from localStorage or fall back to defaults
 */
export function getSavedWatchlists(): Watchlist[] {
  try {
    const raw = localStorage.getItem(WATCHLISTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading watchlists from storage', e);
  }
  return DEFAULT_WATCHLISTS;
}

/**
 * Save watchlists to localStorage
 */
export function saveWatchlists(watchlists: Watchlist[]): void {
  try {
    localStorage.setItem(WATCHLISTS_STORAGE_KEY, JSON.stringify(watchlists));
  } catch (e) {
    console.error('Error saving watchlists', e);
  }
}

/**
 * Load favorites set from localStorage
 */
export function getSavedFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (e) {
    console.error('Error loading favorites from storage', e);
  }
  // Default favorites
  const defaults = STOCK_UNIVERSE.filter((s) => s.isFavorite).map((s) => s.symbol);
  return new Set(defaults);
}

/**
 * Save favorites set to localStorage
 */
export function saveFavorites(favs: Set<string>): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(favs)));
  } catch (e) {
    console.error('Error saving favorites', e);
  }
}

/**
 * Export watchlist in AmiBroker Watchlist format (.abw or .tls)
 * Special extension prevents collisions with ordinary .txt or .md files.
 * Format:
 * # AmiBroker Watchlist File (.abw / .tls)
 * # Name: Watchlist Name
 * # Exported: YYYY-MM-DD
 * SYMBOL1
 * SYMBOL2
 */
export function exportWatchlistToAbw(watchlist: Watchlist): string {
  const lines = [
    `# AmiBroker Watchlist (.abw)`,
    `# Name: ${watchlist.name}`,
    `# Description: ${watchlist.description || 'Exported from AmiBroker Web'}`,
    `# Count: ${watchlist.symbols.length}`,
    `# Date: ${new Date().toISOString().split('T')[0]}`,
    '',
    ...watchlist.symbols,
  ];
  return lines.join('\n');
}

/**
 * Download a watchlist as a .abw file
 */
export function downloadWatchlistFile(watchlist: Watchlist, extension: 'abw' | 'tls' = 'abw'): void {
  const content = exportWatchlistToAbw(watchlist);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = watchlist.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  a.download = `${safeName}.${extension}`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse an uploaded .abw or .tls file into symbol list and metadata
 */
export function parseAbwWatchlistFile(fileContent: string, fileName?: string): { name: string; symbols: string[] } {
  const lines = fileContent.split(/\r?\n/);
  const symbols: string[] = [];
  let name = fileName ? fileName.replace(/\.(abw|tls|txt)$/i, '') : 'Imported Watchlist';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) {
      if (trimmed.toLowerCase().includes('# name:')) {
        name = trimmed.substring(trimmed.indexOf(':') + 1).trim();
      }
      continue;
    }
    // Any valid symbol row (first token)
    const sym = trimmed.split(/[\s,]+/)[0].toUpperCase();
    if (sym && !symbols.includes(sym)) {
      symbols.push(sym);
    }
  }

  return { name, symbols };
}

/**
 * Automatically sync newly listed symbols (whose first trading day is in current year)
 * into a dedicated dynamic AmiBroker watchlist.
 */
export function syncNewListingsWatchlist(
  universe: StockMetadata[],
  currentWatchlists: Watchlist[]
): Watchlist[] {
  const currentYear = new Date().getFullYear();
  const newListings = universe.filter((s) => s.isNewListing);
  if (newListings.length === 0) return currentWatchlists;

  const wlId = `wl-new-listings-${currentYear}`;
  const wlName = `New Listings & IPOs (${currentYear})`;
  const symbols = newListings.map((s) => s.symbol);

  const existingIndex = currentWatchlists.findIndex((w) => w.id === wlId);
  if (existingIndex >= 0) {
    const updated = [...currentWatchlists];
    updated[existingIndex] = {
      ...updated[existingIndex],
      symbols,
      description: `${newListings.length} new symbols traded for the first time in ${currentYear}.parquet`,
    };
    return updated;
  } else {
    const newWl: Watchlist = {
      id: wlId,
      name: wlName,
      description: `${newListings.length} new symbols traded for the first time in ${currentYear}.parquet`,
      symbols,
      isDefault: false,
      color: '#10b981',
      createdAt: new Date().toISOString(),
    };
    return [newWl, ...currentWatchlists];
  }
}
