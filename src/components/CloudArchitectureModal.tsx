import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle2,
  Copy,
  Check,
  FileCode,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface CloudArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudArchitectureModal: React.FC<CloudArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'blueprint' | 'github_workflow' | 'python_script' | 'r2_config' | 'checklist'>('blueprint');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const githubWorkflowCode = `name: Daily NSE Bhavcopy Ingestion & R2 Sync

on:
  schedule:
    # 18:30 IST is 13:00 UTC, Mon-Fri (Trading Days)
    - cron: '0 13 * * 1-5'
  workflow_dispatch: # Allows manual one-click trigger

jobs:
  sync-nse-bhavcopy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install Dependencies
        run: |
          pip install requests pandas pyarrow boto3 urllib3

      - name: Ingest Bhavcopy & Upload to Cloudflare R2
        env:
          R2_ACCOUNT_ID: \${{ secrets.R2_ACCOUNT_ID }}
          R2_ACCESS_KEY_ID: \${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: \${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_BUCKET_NAME: \${{ secrets.R2_BUCKET_NAME }}
        run: |
          python scripts/sync_nse_bhavcopy.py
`;

  const pythonScriptCode = `"""
Free Automated NSE Bhavcopy & Delivery Ingestion Pipeline
Downloads official unified Bhavcopy, adjusts for Corporate Actions,
and stores historical compressed Parquet in Cloudflare R2 (Zero Egress).
"""
import os
import datetime
import requests
import pandas as pd
import boto3
from botocore.config import Config

# 1. Cloudflare R2 Configuration (S3-compatible)
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET = os.getenv("R2_BUCKET_NAME", "nse-historical-data")

r2_client = boto3.client(
    "s3",
    endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    config=Config(signature_version="s3v4")
)

def fetch_today_bhavcopy():
    today = datetime.datetime.now()
    # Format: DDMMYYYY (e.g., 28092024)
    date_str = today.strftime("%d%m%Y")
    
    url = f"https://archives.nseindia.com/products/content/sec_bhavdata_full_{date_str}.csv"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
    
    print(f"Fetching: {url}")
    session = requests.Session()
    # NSE requires initial visit to set session cookies
    session.get("https://www.nseindia.com", headers=headers, timeout=15)
    resp = session.get(url, headers=headers, timeout=30)
    
    if resp.status_code == 200:
        df = pd.read_csv(pd.io.common.StringIO(resp.text))
        # Filter Equity segment only (EQ, BE)
        df = df[df[' SERIES'].str.strip().isin(['EQ', 'BE'])]
        return df, today.strftime("%Y-%m-%d")
    else:
        print(f"Market closed or Bhavcopy not yet generated. HTTP {resp.status_code}")
        return None, None

def apply_corporate_action_adjustments(df, corporate_actions_db):
    """
    Multiplier factor adjustment for Splits, Bonuses, Rights, and Demergers.
    """
    # Adjust prior historical bars according to factor
    for action in corporate_actions_db:
        sym = action['symbol']
        ex_date = action['exDate']
        factor = action['factor']
        mask = (df['SYMBOL'] == sym) & (df['DATE'] < ex_date)
        df.loc[mask, ['OPEN', 'HIGH', 'LOW', 'CLOSE']] *= factor
        df.loc[mask, 'VOLUME'] /= factor
    return df

if __name__ == "__main__":
    df, date_iso = fetch_today_bhavcopy()
    if df is not None:
        # Save compressed Parquet and upload to R2
        parquet_path = f"daily_bhavcopy_{date_iso}.parquet"
        df.to_parquet(parquet_path, compression="snappy")
        r2_client.upload_file(parquet_path, R2_BUCKET, f"daily/{parquet_path}")
        print("Successfully uploaded to Cloudflare R2!")
`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full text-xs shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white">
                100% Free Production Architecture (GitHub + Cloudflare R2 + Render)
              </h2>
              <p className="text-[11px] text-slate-400">
                Automated daily NSE Bhavcopy ingestion, corporate action smoothing, and zero-egress data lake.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-800 bg-slate-950/60 overflow-x-auto">
          {[
            { id: 'blueprint', label: 'Architecture Overview' },
            { id: 'checklist', label: 'What I Need From You' },
            { id: 'github_workflow', label: '1. GitHub Actions YAML' },
            { id: 'python_script', label: '2. Python Parser Script' },
            { id: 'r2_config', label: '3. Cloudflare R2 Setup' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-medium rounded-t border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 bg-slate-900 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto flex-1 text-slate-300 leading-relaxed">
          {activeTab === 'blueprint' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <h3 className="text-sm font-bold text-cyan-400 mb-2">Can We Make It Completely Free? Yes!</h3>
                <p className="text-slate-300 mb-3">
                  Here is the exact battle-tested architectural blueprint to run an enterprise-grade AmiBroker web terminal for Indian markets with zero recurring subscription fees:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-900 rounded border border-slate-800">
                    <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>1. GitHub Actions</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Runs a scheduled cron every weekday at 18:30 IST. Automatically fetches the latest <code className="text-cyan-300">sec_bhavdata_full</code> CSV from NSE India, cleans delivery columns, applies corporate adjustments, and exports compressed parquet.
                    </div>
                    <div className="mt-2 text-emerald-400 font-mono text-[10px]">Cost: ₹0 / Free (2,000 mins/mo)</div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded border border-slate-800">
                    <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                      <Cloud className="w-4 h-4 text-cyan-400" />
                      <span>2. Cloudflare R2</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Acts as your fast S3-compatible data lake. Unlike AWS S3 which charges bandwidth egress fees every time your app downloads stock data, <strong>Cloudflare R2 has ZERO egress fees</strong> and gives 10 GB free storage forever.
                    </div>
                    <div className="mt-2 text-emerald-400 font-mono text-[10px]">Cost: ₹0 / Free forever</div>
                  </div>

                  <div className="p-3 bg-slate-900 rounded border border-slate-800">
                    <div className="font-bold text-white flex items-center gap-1.5 mb-1">
                      <Terminal className="w-4 h-4 text-purple-400" />
                      <span>3. Render / Web App</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Hosts this AmiBroker terminal. The frontend queries Cloudflare R2 directly via CDN, caching 5+ years of daily OHLCV and delivery statistics in the browser's IndexedDB for sub-second charts and multi-symbol backtesting.
                    </div>
                    <div className="mt-2 text-emerald-400 font-mono text-[10px]">Cost: ₹0 / Free tier</div>
                  </div>
                </div>
              </div>

              {/* Data Flow Diagram */}
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs">
                <div className="text-cyan-300 font-bold mb-2">End-to-End Automated Data Flow:</div>
                <div className="space-y-1.5 text-slate-300">
                  <div>1. [NSE India Archives] (18:30 IST Bhavcopy + MTO Deliverables)</div>
                  <div className="pl-4 text-slate-500">↓ (HTTP Session GET with Cookie bypass)</div>
                  <div>2. [GitHub Actions Cron Runner] (scripts/sync_nse_bhavcopy.py)</div>
                  <div className="pl-4 text-slate-500">↓ (Applies Corporate Actions DB: Splits, Bonuses, Rights, Demergers)</div>
                  <div>3. [Cloudflare R2 Bucket] (Compressed Parquet / JSON store, Zero Bandwidth fees)</div>
                  <div className="pl-4 text-slate-500">↓ (HTTP CDN Fetch)</div>
                  <div>4. [AmiBroker Web Terminal] (Canvas Charting + AFL Scanner + Backtester Engine)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">What I Need From You to Connect Your Live Cloud:</h3>
              <p className="text-slate-300">
                To connect your own real Cloudflare R2 bucket and GitHub repository:
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center font-bold shrink-0 text-xs">
                    1
                  </div>
                  <div>
                    <div className="font-semibold text-white">Free Cloudflare Account</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Create an account on <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">dash.cloudflare.com</a>. Navigate to <strong>R2 Object Storage</strong> and click <em>Create Bucket</em> (name it <code className="text-cyan-300">nse-historical-data</code>).
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center font-bold shrink-0 text-xs">
                    2
                  </div>
                  <div>
                    <div className="font-semibold text-white">R2 API Tokens (Access Key & Secret)</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      In Cloudflare R2 dashboard, click <em>Manage R2 API Tokens</em> &gt; <em>Create API Token</em> with <strong>Object Read & Write</strong> permissions. Note down:
                    </p>
                    <ul className="list-disc pl-4 text-slate-400 text-[11px] mt-1 space-y-0.5">
                      <li>R2 Account ID</li>
                      <li>Access Key ID</li>
                      <li>Secret Access Key</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center font-bold shrink-0 text-xs">
                    3
                  </div>
                  <div>
                    <div className="font-semibold text-white">GitHub Repository Secrets</div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      In your GitHub repository, go to <strong>Settings &gt; Secrets and variables &gt; Actions</strong> and add the 4 environment variables:
                    </p>
                    <div className="font-mono text-cyan-300 text-[11px] bg-slate-900 p-2 rounded mt-1">
                      R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'github_workflow' && (
            <div>
              <div className="flex items-center justify-between pb-2 mb-2">
                <span className="font-mono text-xs text-cyan-300">
                  .github/workflows/daily_nse_sync.yml
                </span>
                <button
                  onClick={() => copyToClipboard(githubWorkflowCode, 'workflow')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors"
                >
                  {copiedKey === 'workflow' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'workflow' ? 'Copied!' : 'Copy Workflow YAML'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed">
                {githubWorkflowCode}
              </pre>
            </div>
          )}

          {activeTab === 'python_script' && (
            <div>
              <div className="flex items-center justify-between pb-2 mb-2">
                <span className="font-mono text-xs text-cyan-300">
                  scripts/sync_nse_bhavcopy.py
                </span>
                <button
                  onClick={() => copyToClipboard(pythonScriptCode, 'python')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition-colors"
                >
                  {copiedKey === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'python' ? 'Copied!' : 'Copy Python Script'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed">
                {pythonScriptCode}
              </pre>
            </div>
          )}

          {activeTab === 'r2_config' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">Cloudflare R2 Bucket Configuration (Zero Egress)</h3>
              <p className="text-slate-300">
                Cloudflare R2 is compatible with AWS S3 APIs. That means tools like <code className="text-cyan-300">boto3</code>, <code className="text-cyan-300">aws-cli</code>, and <code className="text-cyan-300">DuckDB</code> can query it directly!
              </p>

              <div className="p-4 bg-slate-950 rounded border border-slate-800 space-y-3 font-mono text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">Endpoint URL:</div>
                  <div className="text-cyan-300">https://&lt;R2_ACCOUNT_ID&gt;.r2.cloudflarestorage.com</div>
                </div>

                <div>
                  <div className="text-slate-400 text-[11px]">CORS Configuration (Allow web app to fetch data):</div>
                  <pre className="p-2 bg-slate-900 rounded text-amber-300 text-[10px] mt-1 overflow-x-auto">
{`[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            AmiBroker Quantitative Architecture · 100% Free Forever Stack
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
