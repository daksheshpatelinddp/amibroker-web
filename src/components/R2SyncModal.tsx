import React, { useState } from 'react';
import {
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Copy,
  Check,
  Database,
  ArrowRight,
  ShieldCheck,
  Layers,
  Calendar,
} from 'lucide-react';
import {
  loadR2EndpointUrl,
  saveR2EndpointUrl,
  loadR2AutoSync,
  saveR2AutoSync,
  syncCloudflareR2Data,
  R2SyncResult,
} from '../utils/marketStorage';
import { CandleBar, StockMetadata } from '../types/market';

interface R2SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableSymbolsCount: number;
  onImportData: (marketData: Record<string, CandleBar[]>, stockUniverse?: StockMetadata[]) => void;
}

export const R2SyncModal: React.FC<R2SyncModalProps> = ({
  isOpen,
  onClose,
  availableSymbolsCount,
  onImportData,
}) => {
  const [r2Url, setR2Url] = useState(() => loadR2EndpointUrl());
  const [autoSync, setAutoSync] = useState(() => loadR2AutoSync());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<R2SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeGuideTab, setActiveGuideTab] = useState<'bse' | 'nse' | 'cors'>('bse');

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSync = async () => {
    const clean = r2Url.trim();
    if (!clean) {
      setSyncError('Please enter your Cloudflare R2 bucket public URL (e.g. https://pub-xxxx.r2.dev)');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    setSyncResult(null);

    try {
      saveR2EndpointUrl(clean);
      const res = await syncCloudflareR2Data(clean);
      setSyncResult(res);

      if (res.marketData && Object.keys(res.marketData).length > 0) {
        onImportData(res.marketData, res.stockUniverse);
      }
    } catch (err: any) {
      setSyncError(err.message || 'Failed to sync with Cloudflare R2.');
    } finally {
      setIsSyncing(false);
    }
  };

  const corsSnippet = JSON.stringify(
    [
      {
        AllowedOrigins: ['*'],
        AllowedMethods: ['GET', 'HEAD'],
        AllowedHeaders: ['*'],
        MaxAgeSeconds: 86400,
      },
    ],
    null,
    2
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600/40 text-emerald-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Cloudflare R2 Data Synchronization
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300 font-mono border border-emerald-700/50">
                  {availableSymbolsCount > 100 ? `${availableSymbolsCount.toLocaleString()} Symbols Active` : `${availableSymbolsCount} Symbols (Local Sample)`}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct browser sync from your 100% Free Cloudflare R2 bucket with 3,590+ NSE & BSE symbols
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Endpoint Input Card */}
          <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cloudflare R2 Bucket Public URL or Custom Domain</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Zero Egress Fees</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={r2Url}
                onChange={(e) => setR2Url(e.target.value)}
                placeholder="https://pub-xxxx.r2.dev or https://your-custom-domain.com"
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded text-slate-100 font-mono text-xs placeholder:text-slate-600 outline-none"
              />
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold rounded flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-w-[130px]"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync R2 Data</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => {
                    setAutoSync(e.target.checked);
                    saveR2AutoSync(e.target.checked);
                  }}
                  className="rounded text-cyan-500"
                />
                <span>Automatically sync on app startup if R2 URL is set</span>
              </label>
            </div>
          </div>

          {/* Success Banner */}
          {syncResult && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-lg text-emerald-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>R2 Synchronization Successful!</span>
              </div>
              <div className="text-[11px] text-emerald-300/90">
                {syncResult.message}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px]">
                <div className="p-1.5 bg-black/40 rounded">
                  <span className="text-slate-400 block">Total Symbols:</span>
                  <span className="text-white font-bold">{syncResult.totalSymbols.toLocaleString()}</span>
                </div>
                <div className="p-1.5 bg-black/40 rounded">
                  <span className="text-slate-400 block">Total Candles:</span>
                  <span className="text-white font-bold">{syncResult.totalBars.toLocaleString()}</span>
                </div>
                <div className="p-1.5 bg-black/40 rounded">
                  <span className="text-slate-400 block">Source:</span>
                  <span className="text-white font-bold">{syncResult.source}</span>
                </div>
                <div className="p-1.5 bg-black/40 rounded">
                  <span className="text-slate-400 block">Storage:</span>
                  <span className="text-white font-bold">IndexedDB</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {syncError && (
            <div className="p-3 bg-rose-950/60 border border-rose-700/60 rounded-lg text-rose-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Sync Notice</span>
              </div>
              <p className="text-[11px] text-rose-300/90">{syncError}</p>
              <p className="text-[10px] text-slate-400">
                Tip: If this is a CORS issue, check the "Cloudflare CORS Setting" tab below. You can also paste the CSV text directly in the Bhavcopy Data Manager tab.
              </p>
            </div>
          )}

          {/* Independent Workflow Guides (NSE vs BSE) */}
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
            <div className="flex border-b border-slate-800 text-xs font-medium">
              <button
                onClick={() => setActiveGuideTab('bse')}
                className={`flex-1 py-2 px-3 text-center transition-colors ${
                  activeGuideTab === 'bse'
                    ? 'bg-slate-900 text-cyan-300 border-b-2 border-cyan-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1. BSE Bhavcopy Workflow (3,500+ Symbols)
              </button>
              <button
                onClick={() => setActiveGuideTab('nse')}
                className={`flex-1 py-2 px-3 text-center transition-colors ${
                  activeGuideTab === 'nse'
                    ? 'bg-slate-900 text-cyan-300 border-b-2 border-cyan-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2. NSE Bhavcopy Workflow
              </button>
              <button
                onClick={() => setActiveGuideTab('cors')}
                className={`flex-1 py-2 px-3 text-center transition-colors ${
                  activeGuideTab === 'cors'
                    ? 'bg-slate-900 text-cyan-300 border-b-2 border-cyan-500 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3. Enable R2 CORS
              </button>
            </div>

            <div className="p-3 text-[11px] space-y-2">
              {activeGuideTab === 'bse' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">
                      Independent BSE Workflow: <code className="text-cyan-300">.github/workflows/daily_bse_bhavcopy_r2.yml</code>
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          'daily_bse_bhavcopy_r2.yml',
                          'bse_file'
                        )
                      }
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedKey === 'bse_file' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Name</span>
                    </button>
                  </div>
                  <p className="text-slate-400">
                    To backfill BSE data from <strong className="text-white">2026-01-01</strong> to today independently without touching NSE:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                    <li>Open your GitHub repository in your browser.</li>
                    <li>Go to the <strong className="text-cyan-300">Actions</strong> tab.</li>
                    <li>Click <strong className="text-white">Daily BSE Bhavcopy Ingestion to Cloudflare R2</strong> on the left.</li>
                    <li>Click <strong className="text-white">Run workflow</strong>.</li>
                    <li>In <strong className="text-white">Start Date</strong>, enter <code className="text-cyan-300">2026-01-01</code>.</li>
                    <li>In <strong className="text-white">End Date</strong>, leave empty (or enter today's date).</li>
                    <li>Click <strong className="text-cyan-400">Run workflow</strong>. It downloads all 3,590+ BSE symbols and pushes to your R2 bucket!</li>
                  </ol>
                </div>
              )}

              {activeGuideTab === 'nse' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">
                      Independent NSE Workflow: <code className="text-cyan-300">.github/workflows/daily_nse_bhavcopy_r2.yml</code>
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          'daily_nse_bhavcopy_r2.yml',
                          'nse_file'
                        )
                      }
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedKey === 'nse_file' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Name</span>
                    </button>
                  </div>
                  <p className="text-slate-400">
                    To trigger NSE Bhavcopy (OHLCV + Delivery % + Security Bhavdata) independently:
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                    <li>In GitHub repository &gt; <strong className="text-cyan-300">Actions</strong> tab.</li>
                    <li>Select <strong className="text-white">Daily NSE Bhavcopy Ingestion to Cloudflare R2</strong>.</li>
                    <li>Click <strong className="text-white">Run workflow</strong>.</li>
                    <li>Optional date backfill: enter Start Date (e.g. <code className="text-cyan-300">2023-12-01</code>) and End Date.</li>
                    <li>Click <strong className="text-cyan-400">Run workflow</strong>.</li>
                  </ol>
                </div>
              )}

              {activeGuideTab === 'cors' && (
                <div className="space-y-2">
                  <p className="text-slate-300">
                    If your browser shows a CORS error when syncing R2, add this CORS rule in Cloudflare dashboard:
                  </p>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 relative font-mono text-[10px] text-cyan-300 overflow-x-auto">
                    <pre>{corsSnippet}</pre>
                    <button
                      onClick={() => handleCopy(corsSnippet, 'cors')}
                      className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] flex items-center gap-1 border border-slate-700"
                    >
                      {copiedKey === 'cors' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy CORS</span>
                    </button>
                  </div>
                  <p className="text-slate-400">
                    In Cloudflare Dashboard: <strong className="text-white">R2 Object Storage</strong> &gt; Select your bucket &gt; <strong className="text-white">Settings</strong> &gt; <strong className="text-white">CORS Policy</strong> &gt; Paste the JSON above and save.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            All synced symbols are indexed into local browser IndexedDB storage
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
