import { DrawingItem } from '../types/market';

const MASTER_DRAWINGS_STORAGE_KEY = 'amibroker_drawings_store_v2';

/**
 * Composite key for mapping drawings per symbol and per chart pane
 * e.g. "RELIANCE:1001" or "TCS:sheet-1"
 */
export function getDrawingMapKey(symbol: string, chartPaneId: string | number): string {
  const cleanSym = (symbol || 'DEFAULT').trim().toUpperCase();
  const cleanPane = String(chartPaneId || '1001').trim();
  return `${cleanSym}:${cleanPane}`;
}

/**
 * Load the complete mapping from localStorage
 */
function getStorageMap(): Record<string, DrawingItem[]> {
  try {
    const raw = localStorage.getItem(MASTER_DRAWINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse drawings storage map:', err);
  }
  return {};
}

/**
 * Persist the complete mapping to localStorage
 */
function setStorageMap(map: Record<string, DrawingItem[]>): void {
  try {
    localStorage.setItem(MASTER_DRAWINGS_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save drawings to localStorage:', err);
  }
}

/**
 * Seed initial sample drawings for discovery if no drawings exist yet
 */
function getInitialSampleDrawings(symbol: string, chartPaneId: string | number): DrawingItem[] {
  if (symbol.toUpperCase() === 'RELIANCE') {
    return [
      {
        id: 'seed-rel-hl-1',
        tool: 'horizontal_line',
        symbol: 'RELIANCE',
        chartId: typeof chartPaneId === 'number' ? chartPaneId : 1001,
        points: [
          { barIndex: 120, price: 2950, date: '2024-05-15' },
        ],
        color: '#f59e0b',
        lineWidth: 1.5,
        lineStyle: 'dashed',
        text: 'Key Resistance Zone (₹2,950)',
        showLabels: true,
      },
      {
        id: 'seed-rel-rect-1',
        tool: 'rectangle',
        symbol: 'RELIANCE',
        chartId: typeof chartPaneId === 'number' ? chartPaneId : 1001,
        points: [
          { barIndex: 80, price: 2800, date: '2024-03-10' },
          { barIndex: 130, price: 2680, date: '2024-06-01' },
        ],
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.15,
        lineWidth: 1.5,
        lineStyle: 'solid',
        text: 'Institutional Accumulation',
        showLabels: true,
      },
    ];
  }
  return [];
}

/**
 * Load drawings persistable per symbol and per chart pane
 */
export function loadDrawings(symbol: string, chartPaneId: string | number): DrawingItem[] {
  const mapKey = getDrawingMapKey(symbol, chartPaneId);
  const map = getStorageMap();

  if (map[mapKey] && Array.isArray(map[mapKey])) {
    return map[mapKey];
  }

  // Check fallback by symbol only if chart pane has no drawings yet
  const fallbackSymKey = Object.keys(map).find((k) => k.startsWith(`${symbol.toUpperCase()}:`));
  if (fallbackSymKey && Array.isArray(map[fallbackSymKey]) && map[fallbackSymKey].length > 0) {
    // Clone for this pane
    const cloned = map[fallbackSymKey].map((d) => ({
      ...d,
      id: `copy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      chartId: typeof chartPaneId === 'number' ? chartPaneId : undefined,
    }));
    map[mapKey] = cloned;
    setStorageMap(map);
    return cloned;
  }

  // Provide initial samples if first time loading this symbol
  const initial = getInitialSampleDrawings(symbol, chartPaneId);
  if (initial.length > 0) {
    map[mapKey] = initial;
    setStorageMap(map);
    return initial;
  }

  return [];
}

/**
 * Save drawings persistable per symbol and per chart pane
 */
export function saveDrawings(
  symbol: string,
  chartPaneId: string | number,
  drawings: DrawingItem[]
): void {
  const mapKey = getDrawingMapKey(symbol, chartPaneId);
  const map = getStorageMap();
  map[mapKey] = drawings;
  setStorageMap(map);
}

/**
 * Clear drawings for a specific symbol and chart pane
 */
export function clearDrawings(symbol: string, chartPaneId: string | number): void {
  const mapKey = getDrawingMapKey(symbol, chartPaneId);
  const map = getStorageMap();
  delete map[mapKey];
  setStorageMap(map);
}

/**
 * Get total drawings count for a symbol or across all symbols
 */
export function getDrawingsCount(symbol?: string, chartPaneId?: string | number): number {
  const map = getStorageMap();
  if (symbol && chartPaneId !== undefined) {
    const key = getDrawingMapKey(symbol, chartPaneId);
    return map[key]?.length || 0;
  }
  if (symbol) {
    const prefix = `${symbol.toUpperCase()}:`;
    return Object.entries(map)
      .filter(([k]) => k.startsWith(prefix))
      .reduce((acc, [, list]) => acc + (list?.length || 0), 0);
  }
  return Object.values(map).reduce((acc, list) => acc + (list?.length || 0), 0);
}

/**
 * Export drawings to JSON string for backup / sharing
 */
export function exportDrawingsJson(symbol?: string): string {
  const map = getStorageMap();
  if (symbol) {
    const filtered: Record<string, DrawingItem[]> = {};
    const prefix = `${symbol.toUpperCase()}:`;
    for (const [k, v] of Object.entries(map)) {
      if (k.startsWith(prefix)) {
        filtered[k] = v;
      }
    }
    return JSON.stringify(filtered, null, 2);
  }
  return JSON.stringify(map, null, 2);
}

/**
 * Import drawings from JSON string
 */
export function importDrawingsJson(jsonString: string): { success: boolean; count: number } {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed === 'object') {
      const current = getStorageMap();
      let importedCount = 0;
      for (const [key, items] of Object.entries(parsed)) {
        if (Array.isArray(items)) {
          current[key] = items;
          importedCount += items.length;
        }
      }
      setStorageMap(current);
      return { success: true, count: importedCount };
    }
  } catch (err) {
    console.error('Failed to import drawings JSON:', err);
  }
  return { success: false, count: 0 };
}
