import React, { useState, useMemo } from 'react';
import { MarketCategory, StockMetadata, Watchlist } from '../types/market';
import {
  downloadWatchlistFile,
  exportWatchlistToAbw,
  parseAbwWatchlistFile,
} from '../utils/categoriesWatchlists';
import {
  FolderTree,
  Star,
  ListFilter,
  Plus,
  Trash2,
  Download,
  Upload,
  Search,
  ExternalLink,
  Check,
  X,
  Layers,
  ChevronRight,
  ChevronDown,
  Tag,
  Building2,
  Globe,
  TrendingUp,
  FileCode,
  Edit2,
  Copy,
} from 'lucide-react';

interface SymbolCategoriesWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockUniverse: StockMetadata[];
  onUpdateStockUniverse: (updated: StockMetadata[]) => void;
  watchlists: Watchlist[];
  onUpdateWatchlists: (updated: Watchlist[]) => void;
  favorites: Set<string>;
  onToggleFavorite: (symbol: string) => void;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onAddNewSymbol: (newStock: StockMetadata, basePrice: number) => void;
}

export const SymbolCategoriesWatchlistModal: React.FC<SymbolCategoriesWatchlistModalProps> = ({
  isOpen,
  onClose,
  stockUniverse,
  onUpdateStockUniverse,
  watchlists,
  onUpdateWatchlists,
  favorites,
  onToggleFavorite,
  selectedSymbol,
  onSelectSymbol,
  onAddNewSymbol,
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'watchlists' | 'favorites' | 'add_symbol'>('watchlists');
  const [searchTerm, setSearchTerm] = useState('');

  // Category Tree filters
  const [selectedMarket, setSelectedMarket] = useState<string>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  // Watchlist state
  const [activeWatchlistId, setActiveWatchlistId] = useState<string>(watchlists[0]?.id || '');
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [newWatchlistDesc, setNewWatchlistDesc] = useState('');
  const [showCreateWatchlist, setShowCreateWatchlist] = useState(false);
  const [editingWlId, setEditingWlId] = useState<string | null>(null);
  const [editWlName, setEditWlName] = useState('');
  const [addSymbolToWlInput, setAddSymbolToWlInput] = useState('');

  // Add Symbol Form state
  const [newSymbolTicker, setNewSymbolTicker] = useState('');
  const [newSymbolName, setNewSymbolName] = useState('');
  const [newSymbolMarket, setNewSymbolMarket] = useState<MarketCategory>('NSE_FNO');
  const [newSymbolGroup, setNewSymbolGroup] = useState('Nifty 50');
  const [newSymbolSector, setNewSymbolSector] = useState('Financial Services');
  const [newSymbolIndustry, setNewSymbolIndustry] = useState('Private Sector Bank');
  const [newSymbolPrice, setNewSymbolPrice] = useState('1500');
  const [newSymbolMarketCap, setNewSymbolMarketCap] = useState('150000');
  const [addSymbolSuccess, setAddSymbolSuccess] = useState<string | null>(null);

  // Distinct category values
  const markets = useMemo(() => ['ALL', ...Array.from(new Set(stockUniverse.map((s) => s.market)))], [stockUniverse]);
  const groups = useMemo(() => ['ALL', ...Array.from(new Set(stockUniverse.map((s) => s.group)))], [stockUniverse]);
  const sectors = useMemo(() => ['ALL', ...Array.from(new Set(stockUniverse.map((s) => s.sector)))], [stockUniverse]);

  // Current active watchlist
  const activeWatchlist = useMemo(() => {
    return watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0];
  }, [watchlists, activeWatchlistId]);

  // Filtered symbols based on Category Tree
  const filteredCategoryStocks = useMemo(() => {
    return stockUniverse.filter((s) => {
      const matchSearch =
        s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.industry.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMarket = selectedMarket === 'ALL' || s.market === selectedMarket;
      const matchGroup = selectedGroup === 'ALL' || s.group === selectedGroup;
      const matchSector = selectedSector === 'ALL' || s.sector === selectedSector;
      return matchSearch && matchMarket && matchGroup && matchSector;
    });
  }, [stockUniverse, searchTerm, selectedMarket, selectedGroup, selectedSector]);

  // Create Watchlist Handler
  const handleCreateWatchlist = () => {
    if (!newWatchlistName.trim()) return;
    const newWl: Watchlist = {
      id: `wl-${Date.now()}`,
      name: newWatchlistName.trim(),
      description: newWatchlistDesc.trim() || 'Custom user watchlist',
      symbols: [],
      isDefault: false,
      color: '#06b6d4',
      createdAt: new Date().toISOString(),
    };
    const updated = [...watchlists, newWl];
    onUpdateWatchlists(updated);
    setActiveWatchlistId(newWl.id);
    setNewWatchlistName('');
    setNewWatchlistDesc('');
    setShowCreateWatchlist(false);
  };

  // Delete Watchlist
  const handleDeleteWatchlist = (id: string) => {
    if (watchlists.length <= 1) return;
    const updated = watchlists.filter((w) => w.id !== id);
    onUpdateWatchlists(updated);
    if (activeWatchlistId === id) {
      setActiveWatchlistId(updated[0].id);
    }
  };

  // Add symbol to active watchlist
  const handleAddSymbolToWatchlist = (sym: string) => {
    const clean = sym.trim().toUpperCase();
    if (!clean || !activeWatchlist) return;
    if (activeWatchlist.symbols.includes(clean)) return;

    const updated = watchlists.map((w) => {
      if (w.id === activeWatchlist.id) {
        return { ...w, symbols: [...w.symbols, clean] };
      }
      return w;
    });
    onUpdateWatchlists(updated);
    setAddSymbolToWlInput('');
  };

  // Remove symbol from active watchlist
  const handleRemoveSymbolFromWatchlist = (sym: string) => {
    if (!activeWatchlist) return;
    const updated = watchlists.map((w) => {
      if (w.id === activeWatchlist.id) {
        return { ...w, symbols: w.symbols.filter((s) => s !== sym) };
      }
      return w;
    });
    onUpdateWatchlists(updated);
  };

  // Upload .abw / .tls watchlist file
  const handleImportWatchlistFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      const { name, symbols } = parseAbwWatchlistFile(content, file.name);
      const newWl: Watchlist = {
        id: `wl-${Date.now()}`,
        name,
        description: `Imported from ${file.name}`,
        symbols,
        isDefault: false,
        color: '#10b981',
      };
      const updated = [...watchlists, newWl];
      onUpdateWatchlists(updated);
      setActiveWatchlistId(newWl.id);
    };
    reader.readAsText(file);
  };

  // Submit New Symbol Form
  const handleAddNewSymbolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSym = newSymbolTicker.trim().toUpperCase();
    if (!cleanSym) return;

    const newStock: StockMetadata = {
      symbol: cleanSym,
      name: newSymbolName.trim() || cleanSym,
      market: newSymbolMarket,
      group: newSymbolGroup.trim() || 'Custom Group',
      sector: newSymbolSector.trim() || 'General',
      industry: newSymbolIndustry.trim() || 'Diversified',
      marketCapCr: Number(newSymbolMarketCap) || 50000,
      isFnO: newSymbolMarket === 'NSE_FNO',
      isFavorite: false,
    };

    onAddNewSymbol(newStock, Number(newSymbolPrice) || 1000);
    setAddSymbolSuccess(`Successfully registered ${cleanSym} and generated historical price bars!`);
    setNewSymbolTicker('');
    setNewSymbolName('');
    setTimeout(() => setAddSymbolSuccess(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <FolderTree className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>AmiBroker Symbol Hierarchy, Categories & Watchlists</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {stockUniverse.length} Stocks
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Organize by Market, Group, Sector, Industry, bookmark Favorites (⭐), and manage unlimited .abw/.tls watchlists.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center justify-between px-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            {[
              { id: 'watchlists', label: 'Watchlists (.abw)', icon: ListFilter, count: watchlists.length },
              { id: 'favorites', label: 'Favorites', icon: Star, count: favorites.size },
              { id: 'categories', label: 'Categories Tree', icon: FolderTree, count: stockUniverse.length },
              { id: 'add_symbol', label: '+ Add Symbol', icon: Plus },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium transition-colors ${
                    activeTab === t.id
                      ? 'border-cyan-400 text-cyan-300 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${t.id === 'favorites' ? 'text-amber-400' : ''}`} />
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative my-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search ticker, name, sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-md pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-52"
            />
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* TAB 1: WATCHLISTS (.abw / .tls) */}
          {activeTab === 'watchlists' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Left Column: Watchlists List */}
              <div className="w-64 border-r border-slate-800 bg-slate-950/40 p-3 flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white text-xs">My Watchlists</span>
                    <button
                      onClick={() => setShowCreateWatchlist(true)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-[11px]"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New</span>
                    </button>
                  </div>

                  {showCreateWatchlist && (
                    <div className="p-2.5 mb-3 bg-slate-900 border border-cyan-800/60 rounded-lg">
                      <span className="text-[11px] font-bold text-cyan-300 block mb-1">Create Watchlist</span>
                      <input
                        type="text"
                        placeholder="Watchlist Name (e.g. Breakouts)"
                        value={newWatchlistName}
                        onChange={(e) => setNewWatchlistName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white mb-1.5 focus:border-cyan-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={newWatchlistDesc}
                        onChange={(e) => setNewWatchlistDesc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300 mb-2 focus:border-cyan-500 focus:outline-none"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setShowCreateWatchlist(false)}
                          className="px-2 py-0.5 rounded text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateWatchlist}
                          className="px-2.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    {watchlists.map((wl) => (
                      <div
                        key={wl.id}
                        onClick={() => setActiveWatchlistId(wl.id)}
                        className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          activeWatchlistId === wl.id
                            ? 'bg-slate-800 text-cyan-300 font-semibold border border-cyan-800/60'
                            : 'hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: wl.color || '#06b6d4' }}
                          />
                          <span className="truncate text-xs">{wl.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-mono">({wl.symbols.length})</span>
                          {watchlists.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWatchlist(wl.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Import .abw / .tls button */}
                <div className="pt-3 border-t border-slate-800">
                  <label className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded border border-slate-700 cursor-pointer text-[11px] font-medium transition-colors">
                    <Upload className="w-3 h-3 text-cyan-400" />
                    <span>Import .abw / .tls File</span>
                    <input
                      type="file"
                      accept=".abw,.tls,.txt"
                      onChange={handleImportWatchlistFile}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-500 text-center mt-1">
                    AmiBroker Watchlist format
                  </p>
                </div>
              </div>

              {/* Right Column: Watchlist Symbols & Actions */}
              <div className="flex-1 flex flex-col p-4 overflow-hidden">
                {activeWatchlist && (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{activeWatchlist.name}</span>
                          <span className="text-xs text-slate-500 font-normal">
                            ({activeWatchlist.symbols.length} Symbols)
                          </span>
                        </h3>
                        <p className="text-xs text-slate-400">{activeWatchlist.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadWatchlistFile(activeWatchlist, 'abw')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px]"
                          title="Export as .abw (AmiBroker Watchlist file)"
                        >
                          <Download className="w-3 h-3 text-cyan-400" />
                          <span>Export .abw</span>
                        </button>
                        <button
                          onClick={() => downloadWatchlistFile(activeWatchlist, 'tls')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px]"
                          title="Export as .tls (Ticker List file)"
                        >
                          <FileCode className="w-3 h-3 text-emerald-400" />
                          <span>Export .tls</span>
                        </button>
                      </div>
                    </div>

                    {/* Add symbol to this watchlist */}
                    <div className="flex items-center gap-2 mb-3">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddSymbolToWatchlist(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">+ Add stock to this watchlist...</option>
                        {stockUniverse
                          .filter((s) => !activeWatchlist.symbols.includes(s.symbol))
                          .map((s) => (
                            <option key={s.symbol} value={s.symbol}>
                              {s.symbol} — {s.name} ({s.sector})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Symbols Table */}
                    <div className="flex-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950">
                      <table className="w-full text-left font-mono">
                        <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase sticky top-0 border-b border-slate-800">
                          <tr>
                            <th className="py-2 px-3">Fav</th>
                            <th className="py-2 px-3">Ticker</th>
                            <th className="py-2 px-3 font-sans">Company</th>
                            <th className="py-2 px-3 font-sans">Sector</th>
                            <th className="py-2 px-3 font-sans">Industry</th>
                            <th className="py-2 px-3">Market</th>
                            <th className="py-2 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 text-xs">
                          {activeWatchlist.symbols.map((sym) => {
                            const meta = stockUniverse.find((s) => s.symbol === sym);
                            const isFav = favorites.has(sym);

                            return (
                              <tr
                                key={sym}
                                onClick={() => {
                                  onSelectSymbol(sym);
                                  onClose();
                                }}
                                className={`hover:bg-slate-900/60 cursor-pointer transition-colors ${
                                  selectedSymbol === sym ? 'bg-cyan-950/30' : ''
                                }`}
                              >
                                <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => onToggleFavorite(sym)}
                                    className="text-slate-600 hover:text-amber-400"
                                  >
                                    <Star
                                      className={`w-3.5 h-3.5 ${
                                        isFav ? 'fill-amber-400 text-amber-400' : ''
                                      }`}
                                    />
                                  </button>
                                </td>
                                <td className="py-2 px-3 font-bold text-white font-mono flex items-center gap-1.5">
                                  <span>{sym}</span>
                                  {meta?.isFnO && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-purple-950 text-purple-400 border border-purple-800">
                                      F&O
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-slate-300 font-sans truncate max-w-[160px]">
                                  {meta?.name || sym}
                                </td>
                                <td className="py-2 px-3 text-slate-400 font-sans">{meta?.sector || '—'}</td>
                                <td className="py-2 px-3 text-slate-500 font-sans truncate max-w-[140px]">
                                  {meta?.industry || '—'}
                                </td>
                                <td className="py-2 px-3 text-[10px] text-cyan-400">{meta?.market || 'NSE_EQ'}</td>
                                <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleRemoveSymbolFromWatchlist(sym)}
                                    title="Remove from watchlist"
                                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}

                          {activeWatchlist.symbols.length === 0 && (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-slate-500 font-sans">
                                No stocks in this watchlist yet. Use the dropdown above to add symbols.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: FAVORITES (⭐) */}
          {activeTab === 'favorites' && (
            <div className="flex-1 p-5 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>My Starred Favorites ({favorites.size})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Quickly switch to high priority securities bookmarked across any market or sector.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from(favorites).map((sym) => {
                  const meta = stockUniverse.find((s) => s.symbol === sym);
                  return (
                    <div
                      key={sym}
                      onClick={() => {
                        onSelectSymbol(sym);
                        onClose();
                      }}
                      className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500/60 rounded-lg cursor-pointer transition-all hover:shadow-md flex items-center justify-between group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-mono text-sm">{sym}</span>
                          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                            {meta?.group || 'Nifty'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-sans mt-0.5 truncate max-w-[180px]">
                          {meta?.name || sym}
                        </div>
                        <div className="text-[11px] text-cyan-400 font-sans mt-1">{meta?.sector}</div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(sym);
                        }}
                        className="text-amber-400 hover:text-slate-500 p-1"
                        title="Remove from favorites"
                      >
                        <Star className="w-4 h-4 fill-amber-400" />
                      </button>
                    </div>
                  );
                })}

                {favorites.size === 0 && (
                  <div className="col-span-3 text-center py-12 text-slate-500">
                    No favorite symbols starred yet. Click the star icon ⭐ on any stock to bookmark it.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES TREE (Market, Group, Sector, Industry) */}
          {activeTab === 'categories' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Filter Sidebar */}
              <div className="w-60 border-r border-slate-800 bg-slate-950/40 p-3 space-y-4 overflow-y-auto">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Market</label>
                  <select
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  >
                    {markets.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Group</label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  >
                    {groups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Sector</label>
                  <select
                    value={selectedSector}
                    onChange={(e) => setSelectedSector(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                  >
                    {sectors.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                  AmiBroker Categories categorize every instrument by Market, Group, Sector & Industry for precise scanning and backtesting universes.
                </div>
              </div>

              {/* Stocks Table */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 mb-3">
                  <span className="text-xs text-slate-400">
                    Matching Symbols: <b>{filteredCategoryStocks.length}</b>
                  </span>
                </div>

                <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden">
                  <table className="w-full text-left font-mono">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Fav</th>
                        <th className="py-2 px-3">Ticker</th>
                        <th className="py-2 px-3 font-sans">Name</th>
                        <th className="py-2 px-3">Market</th>
                        <th className="py-2 px-3 font-sans">Group</th>
                        <th className="py-2 px-3 font-sans">Sector</th>
                        <th className="py-2 px-3 font-sans">Industry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs">
                      {filteredCategoryStocks.map((stock) => {
                        const isFav = favorites.has(stock.symbol);
                        return (
                          <tr
                            key={stock.symbol}
                            onClick={() => {
                              onSelectSymbol(stock.symbol);
                              onClose();
                            }}
                            className="hover:bg-slate-900/60 cursor-pointer transition-colors"
                          >
                            <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => onToggleFavorite(stock.symbol)}>
                                <Star
                                  className={`w-3.5 h-3.5 ${
                                    isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="py-2 px-3 font-bold text-white">{stock.symbol}</td>
                            <td className="py-2 px-3 text-slate-300 font-sans truncate max-w-[180px]">{stock.name}</td>
                            <td className="py-2 px-3 text-[10px] text-cyan-400">{stock.market}</td>
                            <td className="py-2 px-3 text-slate-400 font-sans">{stock.group}</td>
                            <td className="py-2 px-3 text-slate-300 font-sans">{stock.sector}</td>
                            <td className="py-2 px-3 text-slate-500 font-sans truncate max-w-[150px]">{stock.industry}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADD CUSTOM SYMBOL */}
          {activeTab === 'add_symbol' && (
            <div className="flex-1 p-6 overflow-y-auto max-w-xl mx-auto">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Register New Symbol into Market Database</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Add any Indian or global equity ticker. It will immediately be available across Charting, Scanner, AFL IDE, and Backtester with generated historical data.
              </p>

              {addSymbolSuccess && (
                <div className="mb-4 p-3 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{addSymbolSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAddNewSymbolSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Ticker Symbol (NSE)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BAJFINANCE"
                      value={newSymbolTicker}
                      onChange={(e) => setNewSymbolTicker(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono uppercase focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Company Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bajaj Finance Ltd"
                      value={newSymbolName}
                      onChange={(e) => setNewSymbolName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Market</label>
                    <select
                      value={newSymbolMarket}
                      onChange={(e) => setNewSymbolMarket(e.target.value as MarketCategory)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                    >
                      <option value="NSE_FNO">NSE F&O</option>
                      <option value="NSE_EQ">NSE Cash (EQ)</option>
                      <option value="BSE">BSE</option>
                      <option value="INDEX">Index</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Group</label>
                    <input
                      type="text"
                      value={newSymbolGroup}
                      onChange={(e) => setNewSymbolGroup(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Base Price (₹)</label>
                    <input
                      type="number"
                      value={newSymbolPrice}
                      onChange={(e) => setNewSymbolPrice(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Sector</label>
                    <input
                      type="text"
                      value={newSymbolSector}
                      onChange={(e) => setNewSymbolSector(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Industry</label>
                    <input
                      type="text"
                      value={newSymbolIndustry}
                      onChange={(e) => setNewSymbolIndustry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-md"
                  >
                    Register Stock & Generate Data
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
