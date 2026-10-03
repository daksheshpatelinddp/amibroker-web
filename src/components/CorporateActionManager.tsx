import React, { useState } from 'react';
import { CorporateAction, CorporateActionType } from '../types/market';
import { calculateRightsAdjustmentFactor } from '../utils/corporateActions';
import {
  Layers,
  Plus,
  Info,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  GitBranch,
} from 'lucide-react';

interface CorporateActionManagerProps {
  corporateActions: CorporateAction[];
  onAddCorporateAction: (action: CorporateAction) => void;
  isAdjusted: boolean;
  onToggleAdjusted: () => void;
  selectedSymbol: string;
}

export const CorporateActionManager: React.FC<CorporateActionManagerProps> = ({
  corporateActions,
  onAddCorporateAction,
  isAdjusted,
  onToggleAdjusted,
  selectedSymbol,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newActionType, setNewActionType] = useState<CorporateActionType>('SPLIT');
  const [symbolInput, setSymbolInput] = useState(selectedSymbol);
  const [exDateInput, setExDateInput] = useState('2024-11-01');
  const [ratioInput, setRatioInput] = useState('10:1');
  const [customFactorInput, setCustomFactorInput] = useState('0.1');
  const [detailsInput, setDetailsInput] = useState('');

  // Rights issue calculator helper state
  const [rightsCumPrice, setRightsCumPrice] = useState(2400);
  const [rightsExistingShares, setRightsExistingShares] = useState(15);
  const [rightsNewShares, setRightsNewShares] = useState(1);
  const [rightsIssuePrice, setRightsIssuePrice] = useState(1257);

  const calculatedRights = calculateRightsAdjustmentFactor(
    rightsCumPrice,
    rightsExistingShares,
    rightsNewShares,
    rightsIssuePrice
  );

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    let factor = parseFloat(customFactorInput) || 1.0;

    if (newActionType === 'RIGHTS') {
      factor = Number(calculatedRights.factor.toFixed(6));
    }

    const newAction: CorporateAction = {
      id: `ca-${Date.now()}`,
      symbol: symbolInput.trim().toUpperCase(),
      exDate: exDateInput,
      actionType: newActionType,
      ratio: ratioInput,
      factor,
      details: detailsInput || `${newActionType} adjustment factor ${factor}`,
    };

    onAddCorporateAction(newAction);
    setShowAddModal(false);
    setDetailsInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Corporate Actions & Price Adjustment Engine</span>
            </h2>
            <button
              onClick={onToggleAdjusted}
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold border transition-colors ${
                isAdjusted
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                  : 'bg-amber-950 text-amber-300 border-amber-500'
              }`}
            >
              {isAdjusted ? 'Adjusted History ACTIVE' : 'Raw Bhavcopy Mode'}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintain unbroken continuous historical series across Splits, Bonuses, Rights Issues, Demergers, and Symbol Renaming.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Corporate Event</span>
        </button>
      </div>

      {/* Explanation Banner: Why Adjustments are Essential */}
      <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-lg">
        <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Why Backtesting & Charting Must Adjust for Corporate Actions</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
            <div className="font-semibold text-white mb-1">1. Stock Splits & Bonuses</div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              When <strong>Tata Steel</strong> split 10:1 on 28-Jul-2022, the price moved from ~₹1,200 to ~₹120. In raw unadjusted Bhavcopy, this looks like a devastating -90% crash, triggering false stop-losses and ruining backtests. Multiplying prior bars by factor <strong>0.1x</strong> ensures continuous technical indicators.
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
            <div className="font-semibold text-white mb-1">2. Demergers & Spin-offs</div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              When <strong>Reliance</strong> demerged Jio Financial Services (JFSL) in July 2023, ₹261.85 was carved out during a special pre-open session. Prior price bars are reduced by ratio <code className="text-cyan-300 font-mono">(P_cum - P_discovered) / P_cum</code> so moving averages and oscillators remain smooth.
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
            <div className="font-semibold text-white mb-1">3. Symbol & Entity Renaming</div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Companies frequently rebrand or merge: <strong>CADILAHC</strong> became <strong>ZYDUSLIFE</strong>; <strong>MINDTREE & LTI</strong> merged into <strong>LTIM</strong>. Our symbol aliasing resolver queries past historical Bhavcopy records under old names and stitches them seamlessly into today's ticker.
            </p>
          </div>
        </div>
      </div>

      {/* Corporate Actions Table */}
      <div className="mt-4">
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs font-bold text-white">Registered Corporate Actions Database</span>
          <span className="text-xs text-slate-400 font-mono">({corporateActions.length} events active)</span>
        </div>

        <div className="border border-slate-800 rounded-lg overflow-x-auto bg-slate-900/40">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3">Symbol</th>
                <th className="py-2.5 px-3">Action Type</th>
                <th className="py-2.5 px-3">Ex-Date</th>
                <th className="py-2.5 px-3">Ratio</th>
                <th className="py-2.5 px-3 text-right">Factor Multiplier</th>
                <th className="py-2.5 px-3">Formula & Event Details</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {corporateActions.map((ca) => (
                <tr key={ca.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">{ca.symbol}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        ca.actionType === 'BONUS'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : ca.actionType === 'SPLIT'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : ca.actionType === 'DEMERGER'
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : ca.actionType === 'RIGHTS'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {ca.actionType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{ca.exDate}</td>
                  <td className="py-2.5 px-3 text-slate-300">{ca.ratio || '-'}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-cyan-300 tabular-nums">
                    {ca.factor.toFixed(4)}x
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">{ca.details}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Applied</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mathematical Reference Card */}
      <div className="mt-4 p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs">
        <h4 className="font-bold text-white mb-2">NSE Corporate Adjustment Mathematical Standards</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px] text-slate-300">
          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <div className="text-cyan-400 font-semibold mb-1">Bonus Issue (A:B)</div>
            <div>Factor F = B / (A + B)</div>
            <div className="text-slate-500 mt-1 text-[10px]">Example 1:1 Bonus: F = 1 / (1 + 1) = 0.50x</div>
            <div className="text-slate-500 text-[10px]">Volume Adjusted = Volume_raw / 0.50 = 2.0x</div>
          </div>

          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <div className="text-cyan-400 font-semibold mb-1">Stock Split (Old_FV : New_FV)</div>
            <div>Factor F = New_FV / Old_FV</div>
            <div className="text-slate-500 mt-1 text-[10px]">Example 10:1 Split: F = 1 / 10 = 0.10x</div>
            <div className="text-slate-500 text-[10px]">All bars before ex-date multiplied by 0.10</div>
          </div>

          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <div className="text-cyan-400 font-semibold mb-1">Rights Issue (TERP Ratio)</div>
            <div>TERP = [(N × P_cum) + (M × P_issue)] / (N + M)</div>
            <div>Adjustment Factor = TERP / P_cum</div>
            <div className="text-slate-500 mt-1 text-[10px]">N = Existing shares, M = Rights shares offered</div>
          </div>

          <div className="p-3 bg-slate-950 rounded border border-slate-800">
            <div className="text-cyan-400 font-semibold mb-1">Demerger / Carve-Out</div>
            <div>Factor F = (P_cum - P_discovered) / P_cum</div>
            <div className="text-slate-500 mt-1 text-[10px]">P_discovered = Price discovered in NSE special session</div>
            <div className="text-slate-500 text-[10px]">Adjusts parent company for the value transferred to spun-off entity</div>
          </div>
        </div>
      </div>

      {/* Modal: Add Custom Corporate Event */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-lg w-full text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Add Corporate Action Event</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAction} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">NSE Symbol</label>
                  <input
                    type="text"
                    required
                    value={symbolInput}
                    onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono uppercase focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Action Type</label>
                  <select
                    value={newActionType}
                    onChange={(e) => {
                      const type = e.target.value as CorporateActionType;
                      setNewActionType(type);
                      if (type === 'BONUS') {
                        setRatioInput('1:1');
                        setCustomFactorInput('0.5');
                      } else if (type === 'SPLIT') {
                        setRatioInput('10:1');
                        setCustomFactorInput('0.1');
                      } else if (type === 'DEMERGER') {
                        setRatioInput('1:1');
                        setCustomFactorInput('0.90');
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="SPLIT">Stock Split</option>
                    <option value="BONUS">Bonus Issue</option>
                    <option value="RIGHTS">Rights Issue</option>
                    <option value="DEMERGER">Demerger / Spin-off</option>
                    <option value="MERGER">Merger / Amalgamation</option>
                    <option value="SYMBOL_CHANGE">Symbol Name Change</option>
                  </select>
                </div>
              </div>

              {newActionType === 'MERGER' && (
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] space-y-1">
                  <div className="font-semibold text-cyan-300">Merger / Amalgamation Adjustment</div>
                  <div className="text-slate-400 text-[10px]">
                    Ratio represents share swap (e.g. 10:1 or 4:1). Set factor to adjust historical price scale of merged entity.
                  </div>
                </div>
              )}

              {newActionType === 'SYMBOL_CHANGE' && (
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] space-y-2">
                  <div className="font-semibold text-cyan-300">Symbol Name Change / Rebranding</div>
                  <div className="text-slate-400 text-[10px]">
                    Maps old symbol ticker (or BSE scrip code) to new canonical symbol so all historical bars connect continuously.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Ex-Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    required
                    value={exDateInput}
                    onChange={(e) => setExDateInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Ratio (e.g. 1:1, 10:1)</label>
                  <input
                    type="text"
                    value={ratioInput}
                    onChange={(e) => setRatioInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Rights Calculator UI if RIGHTS selected */}
              {newActionType === 'RIGHTS' ? (
                <div className="p-3 bg-slate-950 rounded border border-slate-800 space-y-2">
                  <div className="font-semibold text-cyan-300 text-[11px]">TERP Rights Calculator</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Cum-Rights Price (₹):</span>
                      <input
                        type="number"
                        value={rightsCumPrice}
                        onChange={(e) => setRightsCumPrice(Number(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400">Rights Issue Price (₹):</span>
                      <input
                        type="number"
                        value={rightsIssuePrice}
                        onChange={(e) => setRightsIssuePrice(Number(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">
                    Computed TERP: ₹{calculatedRights.terp.toFixed(2)} · Factor: {calculatedRights.factor.toFixed(6)}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Adjustment Factor Multiplier (e.g. 0.5 for 1:1 bonus, 0.1 for 10:1 split)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={customFactorInput}
                    onChange={(e) => setCustomFactorInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono tabular-nums focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Details & Description</label>
                <input
                  type="text"
                  placeholder="e.g. Sub-division from Face Value ₹10 to ₹1"
                  value={detailsInput}
                  onChange={(e) => setDetailsInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-sm"
                >
                  Apply & Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
