import React, { useState, useRef, useEffect } from 'react';
import { AFL_TEMPLATES, AflTemplate, executeAfl } from '../utils/aflEngine';
import { CandleBar } from '../types/market';
import {
  Code2,
  Play,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  BookOpen,
  Sparkles,
  RotateCcw,
  Save,
  FolderOpen,
  Download,
  Upload,
  Trash2,
  HelpCircle,
  Check,
  X,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface AflStrategyEditorProps {
  candles: CandleBar[];
  onApplyAflToScanner: (aflCode: string) => void;
  onApplyAflToBacktest: (aflCode: string) => void;
}

interface SavedFormula {
  id: string;
  name: string;
  code: string;
  savedAt: string;
}

const STORAGE_KEY = 'amibroker_web_saved_afl_formulas_v1';

export const AflStrategyEditor: React.FC<AflStrategyEditorProps> = ({
  candles,
  onApplyAflToScanner,
  onApplyAflToBacktest,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom_delivery_breakout');
  const [aflCode, setAflCode] = useState<string>(AFL_TEMPLATES[0].code);
  const [formulaName, setFormulaName] = useState<string>('My_Custom_Strategy');
  const [syntaxStatus, setSyntaxStatus] = useState<{
    valid: boolean;
    message: string;
    overrides?: string[];
  } | null>(null);

  // Saved formulas library state
  const [savedFormulas, setSavedFormulas] = useState<SavedFormula[]>([]);
  const [showSavedModal, setShowSavedModal] = useState<boolean>(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState<boolean>(false);
  const [saveAsNameInput, setSaveAsNameInput] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [showHelpGuide, setShowHelpGuide] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved formulas on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedFormulas(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading saved AFL formulas', e);
    }
  }, []);

  const saveToStorage = (updated: SavedFormula[]) => {
    setSavedFormulas(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving AFL formulas to storage', e);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = AFL_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      setAflCode(tmpl.code);
      setFormulaName(tmpl.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30));
      setSyntaxStatus(null);
    }
  };

  const handleVerifySyntax = () => {
    const res = executeAfl(candles, aflCode);
    if (res.success) {
      const buyCount = res.buySignals.filter(Boolean).length;
      const sellCount = res.sellSignals.filter(Boolean).length;
      const overridesList: string[] = [];

      if (res.overrides) {
        const o = res.overrides;
        if (o.initialCapital) overridesList.push(`Initial Capital: ₹${o.initialCapital.toLocaleString('en-IN')}`);
        if (o.positionSizePct) overridesList.push(`Position Size: ${o.positionSizePct}%`);
        if (o.stopLossPct !== undefined) overridesList.push(`Stop Loss: ${o.stopLossPct}%`);
        if (o.profitTargetPct !== undefined) overridesList.push(`Profit Target: ${o.profitTargetPct}%`);
        if (o.trailingStopPct !== undefined) overridesList.push(`Trailing Stop: ${o.trailingStopPct}%`);
        if (o.maxHoldingBars !== undefined) overridesList.push(`Max Holding: ${o.maxHoldingBars} bars`);
        if (o.maxPositions !== undefined) overridesList.push(`Max Positions: ${o.maxPositions}`);
        if (o.positionScore) overridesList.push(`PositionScore ranking array defined`);
      }

      setSyntaxStatus({
        valid: true,
        message: `AFL Syntax Verified Successfully! Found ${buyCount} Buy signals, ${sellCount} Sell signals, and ${res.columns.length} custom columns defined.`,
        overrides: overridesList.length > 0 ? overridesList : undefined,
      });
    } else {
      setSyntaxStatus({
        valid: false,
        message: `Syntax Error: ${res.error}`,
      });
    }
  };

  const insertSnippet = (snippet: string) => {
    setAflCode((prev) => prev + '\n' + snippet);
  };

  // 1. Save formula to browser library
  const handleSaveToLibrary = () => {
    const name = saveAsNameInput.trim() || formulaName.trim() || `Strategy_${Date.now()}`;
    const newEntry: SavedFormula = {
      id: `afl-${Date.now()}`,
      name,
      code: aflCode,
      savedAt: new Date().toLocaleString(),
    };

    const updated = [newEntry, ...savedFormulas.filter((f) => f.name !== name)];
    saveToStorage(updated);
    setFormulaName(name);
    setShowSaveAsModal(false);
    showToast(`Formula "${name}" saved to your browser formula library!`);
  };

  // 2. Export / Download formula as .afl file to PC
  const handleDownloadAfl = () => {
    const filename = `${formulaName.toLowerCase().replace(/[^a-z0-9_-]/g, '_') || 'formula'}.afl`;
    const blob = new Blob([aflCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded "${filename}" to your computer!`);
  };

  // 3. Open .afl or .txt file from PC
  const handleOpenLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setAflCode(content);
        const nameWithoutExt = file.name.replace(/\.(afl|txt)$/i, '');
        setFormulaName(nameWithoutExt);
        setSyntaxStatus(null);
        showToast(`Successfully opened "${file.name}"!`);
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be chosen again
    e.target.value = '';
  };

  // 4. Load from saved library
  const handleLoadSavedFormula = (formula: SavedFormula) => {
    setAflCode(formula.code);
    setFormulaName(formula.name);
    setShowSavedModal(false);
    setSyntaxStatus(null);
    showToast(`Loaded "${formula.name}" from your library!`);
  };

  // 5. Delete from saved library
  const handleDeleteSavedFormula = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedFormulas.filter((f) => f.id !== id);
    saveToStorage(updated);
    showToast('Formula deleted from library.');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 overflow-y-auto">
      {/* Hidden file input for opening .afl files */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".afl,.txt"
        className="hidden"
        onChange={handleOpenLocalFile}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              AmiBroker AFL Strategy & Exploration Formula IDE
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Write custom AmiBroker Formula Language (AFL) rules with delivery data, indicators, risk filters, and multi-symbol exploration columns.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Open .afl File from PC */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Open an .afl or .txt file from your computer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open .afl from PC</span>
          </button>

          {/* Open from Library */}
          <button
            onClick={() => setShowSavedModal(true)}
            title="Browse saved formulas in your browser"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>My Formulas ({savedFormulas.length})</span>
          </button>

          {/* Save to Library */}
          <button
            onClick={() => {
              setSaveAsNameInput(formulaName);
              setShowSaveAsModal(true);
            }}
            title="Save formula to browser library"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Save to Library</span>
          </button>

          {/* Download / Export .afl File */}
          <button
            onClick={handleDownloadAfl}
            title="Download this code as an .afl file to your PC"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download .afl</span>
          </button>

          {/* How to Save & Open Help */}
          <button
            onClick={() => setShowHelpGuide(!showHelpGuide)}
            title="How to Save, Open and use AFL formulas"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-800 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            <span>Guide</span>
          </button>

          {/* Test & Run */}
          <button
            onClick={handleVerifySyntax}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            <span>Verify AFL</span>
          </button>
          <button
            onClick={() => {
              handleVerifySyntax();
              onApplyAflToScanner(aflCode);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors shadow-sm"
          >
            <span>Send to Scanner</span>
          </button>
          <button
            onClick={() => {
              handleVerifySyntax();
              onApplyAflToBacktest(aflCode);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shadow-sm"
          >
            <span>Send to Backtest</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="mt-2.5 px-3 py-2 rounded bg-cyan-950 border border-cyan-500 text-cyan-200 text-xs flex items-center justify-between animate-in fade-in">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-cyan-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Guide Banner: How to Save & Open AFL Formulas */}
      {showHelpGuide && (
        <div className="mt-3 p-3.5 bg-slate-900/90 border border-cyan-500/40 rounded-lg text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-cyan-300">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>How to Save & Open AFL Formulas in AmiBroker Web IDE</span>
            </div>
            <button onClick={() => setShowHelpGuide(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-300 mt-1">
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <div className="font-semibold text-emerald-400 mb-1">1. Save to Computer (.afl file)</div>
              <p className="text-slate-400 leading-relaxed">
                Click <strong className="text-slate-200">"Download .afl"</strong>. This directly saves your strategy code as a standard <code className="text-cyan-300 font-mono">.afl</code> file onto your hard drive that you can also open in desktop AmiBroker.
              </p>
            </div>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <div className="font-semibold text-cyan-400 mb-1">2. Open from Computer (.afl / .txt)</div>
              <p className="text-slate-400 leading-relaxed">
                Click <strong className="text-slate-200">"Open .afl from PC"</strong>. Select any <code className="text-cyan-300 font-mono">.afl</code> or <code className="text-cyan-300 font-mono">.txt</code> formula file from your desktop. It immediately loads into the code editor.
              </p>
            </div>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
              <div className="font-semibold text-amber-400 mb-1">3. Browser Library & AFL Overrides</div>
              <p className="text-slate-400 leading-relaxed">
                Use <strong className="text-slate-200">"Save to Library"</strong> to store formulas across sessions. Settings defined in your AFL (e.g., <code className="text-cyan-300 font-mono">InitialEquity = 100000;</code> or <code className="text-cyan-300 font-mono">ApplyStop(...)</code>) automatically override manual backtest settings!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Syntax Status Notification */}
      {syntaxStatus && (
        <div
          className={`mt-3 p-3 rounded-lg border text-xs flex flex-col gap-1.5 ${
            syntaxStatus.valid
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
              : 'bg-rose-950/80 border-rose-700 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {syntaxStatus.valid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{syntaxStatus.message}</span>
          </div>

          {/* Show detected overrides if any */}
          {syntaxStatus.overrides && (
            <div className="pl-6 pt-1 text-[11px] text-amber-300 border-t border-emerald-900/60 flex flex-wrap gap-2">
              <span className="font-bold">⚡ AFL Backtest Overrides Detected:</span>
              {syntaxStatus.overrides.map((ov, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-700/80 font-mono text-[10px]">
                  {ov}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Workspace: Left Editor, Right Library */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-3 flex-1">
        {/* Left Column: Code Editor & Quick Snippets */}
        <div className="lg:col-span-3 flex flex-col space-y-3">
          {/* Template Selector & Quick Insert Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px]">Strategy Template:</span>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-cyan-300 font-medium focus:border-cyan-500 focus:outline-none"
              >
                {AFL_TEMPLATES.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Insertion chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 text-[10px]">Insert:</span>
              {[
                { label: 'SetOption()', snippet: 'SetOption("InitialEquity", 100000);\nSetOption("MaxOpenPositions", 10);' },
                { label: 'ApplyStop()', snippet: 'ApplyStop(stopTypeLoss, stopModePercent, 5);\nApplyStop(stopTypeProfit, stopModePercent, 10);' },
                { label: 'PosSize', snippet: 'PositionSize = -5; // 5% per position' },
                { label: 'PosScore', snippet: 'PositionScore = ROC(Close, 60);' },
                { label: 'EMA()', snippet: 'FastMA = EMA(Close, 20);' },
                { label: 'DelivShock', snippet: 'DelivShock = DelivQty / MA(DelivQty, 20);' },
                { label: 'Cross()', snippet: 'Buy = Cross(FastMA, SlowMA);' },
                { label: 'AddColumn()', snippet: 'AddColumn(Close, "Close", 1.2);' },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => insertSnippet(btn.snippet)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-mono transition-colors"
                >
                  +{btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* AFL Code Textarea with Line Numbers aesthetic */}
          <div className="relative flex-1 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col min-h-[380px]">
            <div className="px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <FileCode className="w-3.5 h-3.5" />
                <span>{formulaName}.afl</span>
              </span>
              <span>AmiBroker AFL v5.x+ Evaluator (Settings Overrides Supported)</span>
            </div>

            <textarea
              value={aflCode}
              onChange={(e) => setAflCode(e.target.value)}
              className="flex-1 w-full bg-slate-950 p-4 text-emerald-400 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500 selection:bg-cyan-900 selection:text-white"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right Column: AmiBroker AFL Reference Guide */}
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-4 text-xs overflow-y-auto max-h-[600px]">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold border-b border-slate-800 pb-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>AFL Language & Settings Guide</span>
          </div>

          <div className="space-y-3 text-[11px]">
            {/* AFL Settings Override Rules */}
            <div className="p-2.5 bg-slate-950 rounded border border-amber-600/40">
              <div className="font-semibold text-amber-300 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AFL Backtest Overrides</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-1.5">
                Variables set inside your formula automatically take precedence over manual backtest settings:
              </p>
              <ul className="list-disc pl-3 text-slate-300 space-y-0.5 font-mono text-[10px]">
                <li><code className="text-cyan-300">InitialEquity = 100000;</code></li>
                <li><code className="text-cyan-300">PositionSize = -5;</code> (5% per trade)</li>
                <li><code className="text-cyan-300">PositionScore = ROC(Close, 60);</code></li>
                <li><code className="text-cyan-300">StopLoss = 5;</code> (5% stop loss)</li>
                <li><code className="text-cyan-300">ProfitTarget = 10;</code> (10% target)</li>
                <li><code className="text-cyan-300">TrailingStop = 3;</code> (3% trail)</li>
                <li><code className="text-cyan-300">MaxHoldingBars = 20;</code></li>
                <li><code className="text-cyan-300">MaxOpenPositions = 10;</code></li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-white mb-1">Predefined Market Arrays</div>
              <ul className="list-disc pl-4 text-slate-400 space-y-0.5 font-mono text-[10px]">
                <li><code className="text-cyan-300">Close</code>, <code className="text-cyan-300">Open</code>, <code className="text-cyan-300">High</code>, <code className="text-cyan-300">Low</code></li>
                <li><code className="text-cyan-300">Volume</code> (Traded Shares)</li>
                <li><code className="text-cyan-300">DelivQty</code> (NSE Deliverable Shares)</li>
                <li><code className="text-cyan-300">DeliveryPct</code> (Delivery / Volume %)</li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-white mb-1">Technical Functions</div>
              <ul className="list-disc pl-4 text-slate-400 space-y-0.5 font-mono text-[10px]">
                <li><code className="text-cyan-300">MA(arr, n)</code> / <code className="text-cyan-300">SMA(arr, n)</code></li>
                <li><code className="text-cyan-300">EMA(arr, n)</code></li>
                <li><code className="text-cyan-300">WMA(arr, n)</code></li>
                <li><code className="text-cyan-300">DEMA(arr, n)</code></li>
                <li><code className="text-cyan-300">HULL(arr, n)</code> (Hull MA)</li>
                <li><code className="text-cyan-300">RSI(n)</code> (Relative Strength)</li>
                <li><code className="text-cyan-300">Cross(arr1, arr2)</code></li>
                <li><code className="text-cyan-300">HHV(arr, n)</code> / <code className="text-cyan-300">LLV(arr, n)</code></li>
                <li><code className="text-cyan-300">ATR(14)</code> / <code className="text-cyan-300">BBandTop(20, 2)</code></li>
              </ul>
            </div>

            <div>
              <div className="font-semibold text-white mb-1">Signals & Exploration Outputs</div>
              <p className="text-slate-400 text-[10px] leading-relaxed mb-1">
                For explorations: Assign boolean to <code className="text-cyan-300">Filter</code>.
              </p>
              <p className="text-slate-400 text-[10px] leading-relaxed mb-1">
                For backtesting: Assign boolean triggers to <code className="text-cyan-300">Buy</code> and <code className="text-cyan-300">Sell</code>.
              </p>
              <code className="block p-1.5 bg-slate-950 rounded font-mono text-[10px] text-amber-300 mt-1">
                AddColumn(Close, "Close", 1.2);<br />
                AddColumn(DeliveryPct, "Deliv %", 1.1);
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Save As Modal */}
      {showSaveAsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Save Strategy Formula</span>
              </h3>
              <button onClick={() => setShowSaveAsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Formula Name</label>
              <input
                type="text"
                value={saveAsNameInput}
                onChange={(e) => setSaveAsNameInput(e.target.value)}
                placeholder="e.g. My_Momentum_Strategy"
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowSaveAsModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveToLibrary}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to Library</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Formulas Manager Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>My Saved AFL Formulas</span>
              </h3>
              <button onClick={() => setShowSavedModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {savedFormulas.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <p>No saved formulas in your browser library yet.</p>
                <p className="text-[11px] text-slate-500">
                  Write or modify code in the editor and click <strong className="text-slate-300">"Save to Library"</strong> to store your formulas here.
                </p>
              </div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
                {savedFormulas.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => handleLoadSavedFormula(f)}
                    className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-lg cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-semibold text-cyan-300 text-xs">{f.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">Saved: {f.savedAt}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDeleteSavedFormula(f.id, e)}
                        title="Delete Formula"
                        className="text-slate-500 hover:text-rose-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button className="px-2.5 py-1 rounded bg-cyan-900/60 text-cyan-300 text-[11px] font-semibold border border-cyan-700/50">
                        Load
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px]">
                Total Saved: {savedFormulas.length} formulas
              </span>
              <button
                onClick={() => setShowSavedModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
