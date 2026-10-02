import React, { useState, useMemo, useEffect } from 'react';
import { CandleBar, CorporateAction, StockMetadata, Watchlist } from './types/market';
import { INITIAL_MARKET_DATA, STOCK_UNIVERSE, generateRealisticNseHistory } from './utils/sampleData';
import { DEFAULT_CORPORATE_ACTIONS, adjustCandleHistory } from './utils/corporateActions';
import { AFL_TEMPLATES } from './utils/aflEngine';
import {
  getSavedFavorites,
  getSavedWatchlists,
  saveFavorites,
  saveWatchlists,
} from './utils/categoriesWatchlists';
import {
  saveMarketDataToStorage,
  loadMarketDataFromStorage,
  clearMarketDataFromStorage,
} from './utils/marketStorage';
import { ActiveTab, AmiBrokerHeader } from './components/AmiBrokerHeader';
import { ChartPane } from './components/ChartPane';
import { ScannerExploration } from './components/ScannerExploration';
import { AflStrategyEditor } from './components/AflStrategyEditor';
import { BacktestingSuite } from './components/BacktestingSuite';
import { CorporateActionManager } from './components/CorporateActionManager';
import { BhavcopyDataManager } from './components/BhavcopyDataManager';
import { CloudArchitectureModal } from './components/CloudArchitectureModal';
import { SymbolCategoriesWatchlistModal } from './components/SymbolCategoriesWatchlistModal';
import { UserGuideModal } from './components/UserGuideModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('chart');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE');
  const [isAdjusted, setIsAdjusted] = useState<boolean>(true);
  const [showCloudGuide, setShowCloudGuide] = useState<boolean>(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState<boolean>(false);
  const [showUserGuide, setShowUserGuide] = useState<boolean>(false);

  // AmiBroker Symbol Categories, Stock Universe & Watchlists
  const [stockUniverse, setStockUniverse] = useState<StockMetadata[]>(STOCK_UNIVERSE);
  const [watchlists, setWatchlists] = useState<Watchlist[]>(() => getSavedWatchlists());
  const [favorites, setFavorites] = useState<Set<string>>(() => getSavedFavorites());

  // Custom AFL code state shared across IDE, Scanner, and Backtester
  const [customAflCode, setCustomAflCode] = useState<string>(AFL_TEMPLATES[0].code);

  // In-memory Market Data storage (raw Bhavcopy OHLCV + Delivery)
  const [allMarketData, setAllMarketData] = useState<Record<string, CandleBar[]>>(INITIAL_MARKET_DATA);

  // Restore persistent historical dataset from IndexedDB on startup so it never disappears on refresh
  useEffect(() => {
    loadMarketDataFromStorage().then((savedData) => {
      if (savedData && Object.keys(savedData).length > 0) {
        setAllMarketData(savedData);
      }
    });
  }, []);

  // Corporate Actions Database
  const [corporateActions, setCorporateActions] = useState<CorporateAction[]>(DEFAULT_CORPORATE_ACTIONS);

  // List of all symbols available
  const availableSymbols = useMemo(() => {
    return Object.keys(allMarketData);
  }, [allMarketData]);

  // Retrieve raw candles for the currently active symbol
  const rawCandles = useMemo(() => {
    return allMarketData[selectedSymbol] || allMarketData['RELIANCE'] || [];
  }, [allMarketData, selectedSymbol]);

  // Active candles with or without corporate action adjustments applied
  const activeCandles = useMemo(() => {
    return adjustCandleHistory(rawCandles, corporateActions, selectedSymbol, isAdjusted);
  }, [rawCandles, corporateActions, selectedSymbol, isAdjusted]);

  // Adjusted market data for all symbols (used by Scanner & Exploration)
  const adjustedMarketData = useMemo(() => {
    const adjusted: Record<string, CandleBar[]> = {};
    for (const [sym, candles] of Object.entries(allMarketData)) {
      adjusted[sym] = adjustCandleHistory(candles, corporateActions, sym, isAdjusted);
    }
    return adjusted;
  }, [allMarketData, corporateActions, isAdjusted]);

  // Handlers
  const handleSelectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const handleSelectSymbolForChart = (symbol: string) => {
    setSelectedSymbol(symbol);
    setActiveTab('chart');
  };

  const handleAddCorporateAction = (newAction: CorporateAction) => {
    setCorporateActions((prev) => [newAction, ...prev]);
  };

  const handleImportBhavcopy = (newData: Record<string, CandleBar[]>) => {
    setAllMarketData((prev) => {
      const merged = { ...prev };
      for (const [sym, bars] of Object.entries(newData)) {
        if (!merged[sym]) {
          merged[sym] = bars;
        } else {
          // Merge by date
          const dateMap = new Map<string, CandleBar>();
          merged[sym].forEach((b) => dateMap.set(b.date, b));
          bars.forEach((b) => dateMap.set(b.date, b));
          merged[sym] = Array.from(dateMap.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
        }
      }
      // Persist to IndexedDB so dataset never disappears after tab refresh or phone sleep
      saveMarketDataToStorage(merged);
      return merged;
    });
  };

  const handleResetSampleData = () => {
    setAllMarketData(INITIAL_MARKET_DATA);
    setCorporateActions(DEFAULT_CORPORATE_ACTIONS);
    clearMarketDataFromStorage();
  };

  const handleApplyAflToScanner = (code: string) => {
    setCustomAflCode(code);
    setActiveTab('scanner');
  };

  const handleApplyAflToBacktest = (code: string) => {
    setCustomAflCode(code);
    setActiveTab('backtest');
  };

  const handleToggleFavorite = (symbol: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      saveFavorites(next);
      return next;
    });
  };

  const handleUpdateWatchlists = (updated: Watchlist[]) => {
    setWatchlists(updated);
    saveWatchlists(updated);
  };

  const handleUpdateStockUniverse = (updated: StockMetadata[]) => {
    setStockUniverse(updated);
  };

  const handleAddNewSymbol = (newStock: StockMetadata, basePrice: number) => {
    setStockUniverse((prev) => {
      if (prev.some((s) => s.symbol === newStock.symbol)) return prev;
      return [...prev, newStock];
    });

    // Generate baseline candles if not already in allMarketData
    setAllMarketData((prev) => {
      if (prev[newStock.symbol]) return prev;
      const initialBars = generateRealisticNseHistory(
        newStock.symbol,
        basePrice > 0 ? basePrice : 500,
        0.02,
        0.2
      );
      return {
        ...prev,
        [newStock.symbol]: initialBars,
      };
    });

    setSelectedSymbol(newStock.symbol);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Top Header & Navigation */}
      <AmiBrokerHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={handleSelectSymbol}
        availableSymbols={availableSymbols}
        isAdjusted={isAdjusted}
        onToggleAdjusted={() => setIsAdjusted((prev) => !prev)}
        onOpenCloudGuide={() => setShowCloudGuide(true)}
        onOpenCategoriesWatchlists={() => setShowCategoriesModal(true)}
        onOpenUserGuide={() => setShowUserGuide(true)}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'chart' && (
          <ChartPane
            candles={activeCandles}
            symbol={selectedSymbol}
            corporateActions={corporateActions}
            isAdjusted={isAdjusted}
            onToggleAdjusted={() => setIsAdjusted((prev) => !prev)}
            allMarketData={allMarketData}
            onSelectSymbol={handleSelectSymbol}
          />
        )}

        {activeTab === 'scanner' && (
          <ScannerExploration
            allMarketData={adjustedMarketData}
            onSelectSymbolForChart={handleSelectSymbolForChart}
            customAflCode={customAflCode}
            onOpenAflEditor={() => setActiveTab('afl_ide')}
          />
        )}

        {activeTab === 'afl_ide' && (
          <AflStrategyEditor
            candles={activeCandles}
            onApplyAflToScanner={handleApplyAflToScanner}
            onApplyAflToBacktest={handleApplyAflToBacktest}
          />
        )}

        {activeTab === 'backtest' && (
          <BacktestingSuite
            candles={activeCandles}
            currentSymbol={selectedSymbol}
            allSymbols={availableSymbols}
            allMarketData={adjustedMarketData}
            onSelectSymbolForChart={handleSelectSymbolForChart}
            customAflCode={customAflCode}
          />
        )}

        {activeTab === 'corporate_actions' && (
          <CorporateActionManager
            corporateActions={corporateActions}
            onAddCorporateAction={handleAddCorporateAction}
            isAdjusted={isAdjusted}
            onToggleAdjusted={() => setIsAdjusted((prev) => !prev)}
            selectedSymbol={selectedSymbol}
          />
        )}

        {activeTab === 'bhavcopy' && (
          <BhavcopyDataManager
            allMarketData={allMarketData}
            onImportBhavcopy={handleImportBhavcopy}
            onResetSampleData={handleResetSampleData}
          />
        )}
      </main>

      {/* Free Cloud Architecture Blueprint Modal */}
      <CloudArchitectureModal
        isOpen={showCloudGuide}
        onClose={() => setShowCloudGuide(false)}
      />

      {/* AmiBroker Symbol Categories & Watchlists Modal */}
      <SymbolCategoriesWatchlistModal
        isOpen={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        stockUniverse={stockUniverse}
        onUpdateStockUniverse={handleUpdateStockUniverse}
        watchlists={watchlists}
        onUpdateWatchlists={handleUpdateWatchlists}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={(sym) => {
          handleSelectSymbol(sym);
          setShowCategoriesModal(false);
        }}
        onAddNewSymbol={handleAddNewSymbol}
      />

      {/* Comprehensive User Manual & Setup Instructions Modal */}
      <UserGuideModal
        isOpen={showUserGuide}
        onClose={() => setShowUserGuide(false)}
        onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)}
      />
    </div>
  );
}
