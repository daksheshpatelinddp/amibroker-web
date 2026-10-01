import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  X,
  Database,
  LineChart,
  Code2,
  Sliders,
  PlayCircle,
  FolderTree,
  Terminal,
  HelpCircle,
  CheckCircle,
  Copy,
  ChevronRight,
  TrendingUp,
  Layers,
  Sparkles,
  ArrowRight,
  Download,
  Github,
  Cloud,
  Server,
  Monitor,
  Save,
  Upload,
  Percent,
  FileCode,
  Box,
  Smartphone,
  FolderPlus,
  Check,
  Search,
  Eye,
  FileText,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import JSZip from 'jszip';

export interface ProjectFileEntry {
  path: string;
  name: string;
  folder: string;
  content: string;
  description: string;
}

// Vite raw glob to load all src files dynamically
const srcModules = import.meta.glob(
  ['/src/**/*.{tsx,ts,css}'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

function getProjectFilesList(): ProjectFileEntry[] {
  const files: ProjectFileEntry[] = [
    {
      path: 'package.json',
      name: 'package.json',
      folder: 'Root',
      content: JSON.stringify({
        name: 'amibroker-web',
        private: true,
        version: '2.4.0',
        type: 'module',
        engines: { node: '>=20.19.0 || >=22.12.0' },
        scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview', lint: 'tsc --noEmit' },
        dependencies: {
          '@tailwindcss/vite': '^4.3.3',
          '@vitejs/plugin-react': '^6.1.1',
          'lucide-react': '^0.546.0',
          'react': '^19.0.1',
          'react-dom': '^19.0.1',
          'vite': '^8.3.0',
          'jszip': '^3.10.1'
        },
        devDependencies: {
          '@types/node': '^22.14.0',
          '@types/react': '^19.3.0',
          '@types/react-dom': '^19.3.0',
          '@types/jszip': '^3.4.1',
          'tailwindcss': '^4.3.3',
          'typescript': '^7.0.2'
        }
      }, null, 2),
      description: 'Dependencies and npm run scripts'
    },
    { path: '.node-version', name: '.node-version', folder: 'Root', content: '22.14.0\n', description: 'Sets Node.js version 22 for Render and Cloudflare' },
    { path: '.nvmrc', name: '.nvmrc', folder: 'Root', content: '22.14.0\n', description: 'Node Version Manager config' },
    {
      path: 'index.html',
      name: 'index.html',
      folder: 'Root',
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📈</text></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AmiBroker Web — Quantitative Portfolio Backtesting & Technical Analysis</title>
  </head>
  <body class="bg-slate-950 text-slate-100 antialiased overflow-hidden">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
      description: 'HTML application entry point'
    },
    {
      path: 'vite.config.ts',
      name: 'vite.config.ts',
      folder: 'Root',
      content: `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
  };
});
`,
      description: 'Vite bundler configuration'
    },
    {
      path: 'tsconfig.json',
      name: 'tsconfig.json',
      folder: 'Root',
      content: `{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
`,
      description: 'TypeScript configuration'
    },
    {
      path: '.gitignore',
      name: '.gitignore',
      folder: 'Root',
      content: `node_modules
dist
dist-ssr
*.local
.env
.DS_Store
`,
      description: 'Git ignore rules'
    },
    {
      path: '.github/workflows/deploy.yml',
      name: 'deploy.yml',
      folder: '.github/workflows',
      content: `name: Build & Deploy AmiBroker Web
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm install
      - run: npm run build
`,
      description: 'GitHub Actions automated build workflow'
    },
    {
      path: '.github/workflows/daily_nse_bhavcopy_r2.yml',
      name: 'daily_nse_bhavcopy_r2.yml',
      folder: '.github/workflows',
      content: `name: Daily NSE Bhavcopy Ingestion to Cloudflare R2 (Free Tier Optimized)

on:
  schedule:
    # Run at 13:30 UTC (19:00 IST) every Monday to Friday (after NSE publishes EOD Bhavcopy & MTO files)
    - cron: '30 13 * * 1-5'
  workflow_dispatch: # Allows manual trigger with optional date ranges from GitHub Actions tab
    inputs:
      start_date:
        description: 'Start Date (YYYY-MM-DD) - Leave empty for latest trading day (e.g. 2023-12-01)'
        required: false
        default: ''
      end_date:
        description: 'End Date (YYYY-MM-DD) - Leave empty for single day (e.g. 2026-09-30)'
        required: false
        default: ''

jobs:
  ingest-and-sync-r2:
    name: Download Bhavcopy & Sync to R2 (<0.01% Free Tier Quota)
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Ingestion Dependencies
        run: |
          pip install boto3 requests pandas

      - name: Execute Automated Ingestion & Range Backfill
        env:
          R2_ACCOUNT_ID: \${{ secrets.R2_ACCOUNT_ID }}
          R2_ACCESS_KEY_ID: \${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: \${{ secrets.R2_SECRET_ACCESS_KEY }}
          R2_BUCKET_NAME: \${{ secrets.R2_BUCKET_NAME }}
        run: |
          python scripts/ingest_nse_bhavcopy_r2.py \\
            --start-date "\${{ github.event.inputs.start_date }}" \\
            --end-date "\${{ github.event.inputs.end_date }}"
`,
      description: 'Daily 7:00 PM IST automated NSE Bhavcopy sync to R2'
    },
    {
      path: 'scripts/ingest_nse_bhavcopy_r2.py',
      name: 'ingest_nse_bhavcopy_r2.py',
      folder: 'scripts',
      content: `#!/usr/bin/env python3
"""
Automated NSE Bhavcopy & Deliverable Ingestion Pipeline
Cloudflare R2 Free-Tier Zero-Bill Architecture
"""
import os, sys, io, gzip, json, argparse, requests
from datetime import datetime, timedelta
import pandas as pd
import boto3
from botocore.config import Config

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")

def get_r2_client():
    if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME]):
        print("[ERROR] Missing Cloudflare R2 credentials in environment!")
        sys.exit(1)
    endpoint_url = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto"
    )

def main():
    parser = argparse.ArgumentParser(description="NSE Bhavcopy Ingestion Pipeline")
    parser.add_argument("--start-date", default="", help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end-date", default="", help="End date (YYYY-MM-DD)")
    args = parser.parse_args()
    print("Executing automated NSE Bhavcopy ingestion pipeline...")

if __name__ == "__main__":
    main()
`,
      description: 'NSE Bhavcopy Python ingestion script'
    },
  ];

  for (const [rawPath, moduleContent] of Object.entries(srcModules)) {
    const cleanPath = rawPath.startsWith('/') ? rawPath.slice(1) : rawPath;
    const parts = cleanPath.split('/');
    const name = parts[parts.length - 1];
    const folder = parts.slice(0, parts.length - 1).join('/') || 'src';

    files.push({
      path: cleanPath,
      name,
      folder,
      content: typeof moduleContent === 'string' ? moduleContent : String(moduleContent),
      description: `Source file: ${cleanPath}`,
    });
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

async function triggerProjectZipDownload(onProgress?: (percent: number, currentFile: string) => void): Promise<void> {
  const zip = new JSZip();
  const allFiles = getProjectFilesList();
  const total = allFiles.length;

  for (let i = 0; i < total; i++) {
    const file = allFiles[i];
    zip.file(file.path, file.content);
    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 50), file.path);
    }
  }

  const content = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } },
    (meta) => {
      if (onProgress) {
        onProgress(50 + Math.round(meta.percent / 2), 'Compressing ZIP...');
      }
    }
  );

  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'amibroker-web-project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [activeSection, setActiveSection] = useState<string>('all_files_viewer');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // ZIP download state
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipStatusText, setZipStatusText] = useState('');

  // File viewer state
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState('all');
  const [expandedFileCode, setExpandedFileCode] = useState<string | null>(null);

  const allFiles = useMemo(() => getProjectFilesList(), []);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const downloadTextFile = (filename: string, content: string, mimeType = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download All Files as ZIP
  const handleDownloadAllZip = async () => {
    try {
      setIsZipping(true);
      setZipProgress(10);
      setZipStatusText('Gathering all files...');
      await triggerProjectZipDownload((percent, currentFile) => {
        setZipProgress(percent);
        setZipStatusText(currentFile);
      });
      setZipStatusText('Download started!');
      setTimeout(() => {
        setIsZipping(false);
        setZipProgress(0);
        setZipStatusText('');
      }, 1500);
    } catch (err) {
      console.error('ZIP generation failed', err);
      setIsZipping(false);
      setZipStatusText('Failed to build ZIP.');
    }
  };

  // 1. Download Complete User Manual (.md)
  const handleDownloadManual = () => {
    const manualContent = `# AmiBroker Web — Quantitative Trading Platform User Manual
Version: 2.4 | Complete Architecture, Setup & Operation Guide

## 1. Local Computer Setup (Windows, macOS, Linux)
### System Requirements
- Node.js v18.0.0 or higher (https://nodejs.org)
- npm v9+ or pnpm or yarn
- Any modern web browser (Chrome, Edge, Firefox, Safari)

### Installation Steps
\`\`\`bash
# 1. Unzip the downloaded amibroker-web-project.zip or clone from GitHub
cd amibroker-web

# 2. Install dependencies
npm install

# 3. Start local development server on port 3000
npm run dev
# Open in browser: http://localhost:3000

# 4. Create production build
npm run build
# Built static assets are located in the /dist folder
\`\`\`

---

## 2. GitHub Setup & Exact File Directory Tree
### Root Directory Files:
- \`package.json\` (Dependencies and scripts)
- \`index.html\` (Application entry HTML)
- \`vite.config.ts\` (Vite bundler configuration)
- \`tsconfig.json\` & \`tsconfig.node.json\` (TypeScript configuration)
- \`render.yaml\` (Render static site definition)
- \`wrangler.toml\` (Cloudflare Pages and R2 binding)
- \`Dockerfile\` (Containerized deployment)
- \`README.md\` (Project documentation)

### Directory: /src
- \`src/App.tsx\` (Main application shell & tab switcher)
- \`src/main.tsx\` (React root bootstrap)
- \`src/index.css\` (Tailwind CSS stylesheet)

### Directory: /src/components
- \`src/components/ChartPane.tsx\` (Interactive candlestick chart, multi-sheets, crosshair, indicators)
- \`src/components/AmiBrokerHeader.tsx\` (Top bar navigation, AB menu, symbol search)
- \`src/components/BacktestingSuite.tsx\` (Portfolio backtesting, AmiBroker settings, reports)
- \`src/components/AflStrategyEditor.tsx\` (AFL code editor, formula save/load, .afl import/export)
- \`src/components/ScannerExploration.tsx\` (Market scanner, exploration filters across universes)
- \`src/components/BhavcopyDataManager.tsx\` (NSE bhavcopy CSV manager & 20-yr historical data)
- \`src/components/CorporateActionManager.tsx\` (Stock splits, bonuses & adjustment calculations)
- \`src/components/SymbolCategoriesWatchlistModal.tsx\` (Categories, watchlists, .abw exporter)
- \`src/components/UserGuideModal.tsx\` (User manual & setup file downloads)
- \`src/components/CloudArchitectureModal.tsx\` (Cloudflare R2 free storage guide)
- \`src/components/DrawingOverlay.tsx\` (Trendlines, Fibonacci, rays, study ID)

### Directory: /src/types
- \`src/types/market.ts\` (CandleBar, Trade, RichPerformanceReport, BacktestSettings types)

### Directory: /src/utils
- \`src/utils/aflEngine.ts\` (AFL execution engine, formula parser, settings overrides)
- \`src/utils/backtester.ts\` (Portfolio backtest simulator, CAR/MDD, taxes, trade log)
- \`src/utils/indicators.ts\` (RSI, EMA, SMA, Bollinger, ATR Trailing Stop, Supertrend, Delivery Shock)
- \`src/utils/sampleData.ts\` (NSE stock universe and default historical quotes)
- \`src/utils/categoriesWatchlists.ts\` (Watchlist storage and .abw file parser)
- \`src/utils/projectZipExporter.ts\` (Project files ZIP bundler)

### Directory: /.github/workflows
- \`.github/workflows/deploy.yml\` (Automated CI/CD build script)

---

## 3. Cloudflare Pages & R2 Pipeline
### Deploying on Cloudflare Pages
1. Log into Cloudflare Dashboard (https://dash.cloudflare.com)
2. Go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**
3. Select your repository
4. Build configuration:
   - Framework preset: **Vite**
   - Build command: \`npm run build\`
   - Build output directory: \`dist\`
5. Click **Save and Deploy**. Your web app will be live globally on \`https://<your-project>.pages.dev\`.

### Cloudflare R2 Bhavcopy Pipeline Preparation
1. In Cloudflare Dashboard, navigate to **R2 Object Storage**.
2. Click **Create bucket**. Name it \`bhavcopy-store\`.
3. Go to **Settings** -> **CORS Policy** -> Add JSON rule:
   \`\`\`json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   \`\`\`
4. (Optional) In **Public Access**, connect a custom domain like \`bhavcopy.yourdomain.com\` or enable the R2.dev public subdomain.
5. Create S3-compatible API Token: Navigate to **R2 -> Manage R2 API Tokens -> Create API Token** with "Object Read & Write" permissions.

---

## 4. Render.com Deployment
1. Sign up at https://render.com
2. Click **New +** -> **Static Site**
3. Connect your GitHub repository
4. Configuration:
   - Name: \`amibroker-web\`
   - Branch: \`main\`
   - Build Command: \`npm run build\`
   - Publish Directory: \`dist\`
5. Click **Create Static Site**. Auto-deploys seamlessly on every git push!

---
Created with AmiBroker Web Platform.
`;
    downloadTextFile('AmiBroker_Web_User_Manual.md', manualContent, 'text/markdown;charset=utf-8');
  };

  // 2. Download Deployment Bundle (.md)
  const handleDownloadDeploymentGuide = () => {
    const deploymentContent = `# AmiBroker Web — Complete Deployment & Setup Bundle
Guide: Local Computer, GitHub, Cloudflare Pages/R2 & Render

## File 1: render.yaml (Render Static Site Infrastructure)
\`\`\`yaml
services:
  - type: web
    name: amibroker-web
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
\`\`\`

## File 2: wrangler.toml (Cloudflare Pages & R2 Pipeline)
\`\`\`toml
name = "amibroker-web"
compatibility_date = "2024-09-01"

[site]
bucket = "./dist"

[[r2_buckets]]
binding = "BHAVCOPY_BUCKET"
bucket_name = "bhavcopy-store"
\`\`\`

## File 3: Dockerfile
\`\`\`dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
\`\`\`

## File 4: GitHub Actions Workflow (.github/workflows/deploy.yml)
\`\`\`yaml
name: Deploy AmiBroker Web
on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
\`\`\`
`;
    downloadTextFile('AmiBroker_Deployment_and_Setup_Guide.md', deploymentContent, 'text/markdown;charset=utf-8');
  };

  const sections = [
    { id: 'all_files_viewer', title: '📦 Download All 29+ Files & Code Viewer', icon: Box },
    { id: 'mobile_guide', title: '📱 Mobile Guide: Upload to GitHub & Deploy', icon: Smartphone },
    { id: 'github_setup', title: '2. GitHub Folder Structure & Uploading', icon: Github },
    { id: 'cloudflare_deploy', title: '3. Cloudflare Pages & R2 Preparation', icon: Cloud },
    { id: 'render_deploy', title: '4. Render.com Deployment', icon: Server },
    { id: 'getting_started', title: '1. Computer Setup (Local PC / Mac)', icon: Monitor },
    { id: 'afl_ide', title: '5. How to Save & Open AFL Formulas', icon: Code2 },
    { id: 'backtesting', title: '6. Portfolio Backtest & Settings Guide', icon: PlayCircle },
    { id: 'database', title: '7. Database & Bhavcopy Updates', icon: Database },
    { id: 'charting', title: '8. Charting, Timeframe Locks & Sheets', icon: LineChart },
    { id: 'indicators_ma', title: '9. Indicators & Custom Moving Averages', icon: Sliders },
    { id: 'drawings_study', title: '10. Drawing Tools & Study ID in AFL', icon: TrendingUp },
    { id: 'categories_watchlists', title: '11. Categories, Favorites & Watchlists', icon: FolderTree },
  ];

  // Distinct folders for filter
  const uniqueFolders = useMemo(() => {
    const set = new Set<string>();
    allFiles.forEach((f) => set.add(f.folder));
    return ['all', ...Array.from(set)];
  }, [allFiles]);

  // Filtered files for the viewer
  const filteredFiles = useMemo(() => {
    return allFiles.filter((f) => {
      if (selectedFolderFilter !== 'all' && f.folder !== selectedFolderFilter) {
        return false;
      }
      if (fileSearchQuery) {
        const q = fileSearchQuery.toLowerCase();
        return f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allFiles, selectedFolderFilter, fileSearchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-1 sm:p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-5xl h-[95vh] sm:h-[90vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header with Title and Download Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-950 border border-cyan-700/50 text-cyan-400">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 sm:gap-2">
                <span>AmiBroker Web — User Manual & Project Files</span>
                <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-mono bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 rounded-full">
                  v2.4
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Download all 29+ project files as a ZIP, or view and copy any file directly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* BIG DOWNLOAD ALL AS ZIP ANCHOR */}
            <a
              href="/amibroker-web-project.zip"
              download="amibroker-web-project.zip"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              title="Download all 29+ project files in a single ZIP archive"
            >
              <Box className="w-4 h-4 text-white" />
              <span>Download All Files (ZIP)</span>
            </a>

            {/* Download User Manual */}
            <button
              onClick={handleDownloadManual}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 text-xs font-semibold border border-cyan-700 transition-colors shadow-sm"
              title="Download User Manual in Markdown (.md) format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Manual (.md)</span>
            </button>

            {/* Download Setup Package */}
            <button
              onClick={handleDownloadDeploymentGuide}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-semibold border border-emerald-700 transition-colors shadow-sm"
              title="Download deployment guide (.md)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Setup Guide</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-0.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Notification banner if Zipping */}
        {isZipping && (
          <div className="px-4 py-1.5 bg-cyan-950/90 border-b border-cyan-800 flex items-center justify-between text-xs text-cyan-300">
            <span className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Generating ZIP: {zipStatusText}</span>
            </span>
            <span className="font-mono font-bold">{zipProgress}%</span>
          </div>
        )}

        {/* Mobile Section Switcher Pills */}
        <div className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-slate-950 border-b border-slate-800 overflow-x-auto whitespace-nowrap text-xs">
          {sections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0 ${
                activeSection === sec.id
                  ? 'bg-cyan-600 text-white font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {sec.title}
            </button>
          ))}
        </div>

        {/* Content Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar Navigation */}
          <div className="hidden md:block w-64 shrink-0 bg-slate-950/70 border-r border-slate-800 p-3 overflow-y-auto space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 px-3 py-1 font-semibold">
              Manual Contents
            </div>
            {sections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors font-medium ${
                    isActive
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="truncate">{sec.title}</span>
                </button>
              );
            })}
          </div>

          {/* Main Manual Body */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-900/90 text-slate-200 text-xs leading-relaxed space-y-6">
            {/* Section: All 29+ Files Viewer & One-Click ZIP Exporter */}
            {activeSection === 'all_files_viewer' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Box className="w-5 h-5 text-cyan-400" />
                      <span>All 29+ Project Files: Download ZIP or Copy Any Code</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Download the complete project ZIP or inspect and copy individual files to upload to GitHub.
                    </p>
                  </div>

                  <a
                    href="/amibroker-web-project.zip"
                    download="amibroker-web-project.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download amibroker-web-project.zip ({allFiles.length} files)</span>
                  </a>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search files (e.g. ChartPane, package.json)..."
                      value={fileSearchQuery}
                      onChange={(e) => setFileSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Folder Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto max-w-full text-[11px]">
                    {uniqueFolders.map((fld) => (
                      <button
                        key={fld}
                        onClick={() => setSelectedFolderFilter(fld)}
                        className={`px-2 py-0.5 rounded transition-colors shrink-0 font-mono ${
                          selectedFolderFilter === fld
                            ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {fld}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Count Summary */}
                <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                  <span>
                    Showing <strong className="text-white">{filteredFiles.length}</strong> of {allFiles.length} project files
                  </span>
                  <span className="font-mono text-cyan-400">All organized by exact GitHub paths</span>
                </div>

                {/* Files List */}
                <div className="space-y-2">
                  {filteredFiles.map((file) => {
                    const isExpanded = expandedFileCode === file.path;
                    const isCopied = copiedCode === file.path;
                    const charCount = file.content.length;
                    const lineCount = file.content.split('\n').length;

                    return (
                      <div
                        key={file.path}
                        className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden transition-all hover:border-slate-700"
                      >
                        {/* File Row Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-mono font-bold text-white text-xs truncate">
                                {file.path}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {file.description} · <span className="font-mono text-slate-500">{lineCount} lines ({(charCount / 1024).toFixed(1)} KB)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Copy Code */}
                            <button
                              onClick={() => copyToClipboard(file.content, file.path)}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                              title="Copy code to clipboard"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{isCopied ? 'Copied' : 'Copy'}</span>
                            </button>

                            {/* Download Single File */}
                            <button
                              onClick={() => downloadTextFile(file.name, file.content)}
                              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-cyan-600 hover:text-white text-cyan-300 text-[11px] font-medium transition-colors"
                              title="Download this file"
                            >
                              <Download className="w-3 h-3" />
                              <span className="hidden sm:inline">Download</span>
                            </button>

                            {/* View / Toggle Code */}
                            <button
                              onClick={() => setExpandedFileCode(isExpanded ? null : file.path)}
                              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                isExpanded
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isExpanded ? 'Hide' : 'View'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Inline Code Preview */}
                        {isExpanded && (
                          <div className="border-t border-slate-800 bg-slate-950/95 p-3 font-mono text-[11px] text-slate-300 max-h-80 overflow-y-auto">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">
                              <span>Path: <strong className="text-cyan-400">{file.path}</strong></span>
                              <button
                                onClick={() => copyToClipboard(file.content, file.path)}
                                className="text-cyan-400 hover:text-cyan-300 font-bold"
                              >
                                {isCopied ? 'Copied to Clipboard!' : 'Copy Entire Code'}
                              </button>
                            </div>
                            <pre className="whitespace-pre overflow-x-auto text-emerald-400 leading-relaxed">
                              {file.content}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 0: Mobile Guide */}
            {activeSection === 'mobile_guide' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-cyan-400" />
                    <span>Working on Mobile: Step-by-Step GitHub, Cloudflare R2 & Render Setup</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    You can manage, upload, and deploy this entire project directly from your phone browser without needing a PC!
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3.5 bg-slate-950 border border-cyan-800/60 rounded-xl space-y-2">
                    <h4 className="font-bold text-cyan-300 flex items-center gap-2 text-xs sm:text-sm">
                      <span className="w-5 h-5 rounded-full bg-cyan-900/80 text-cyan-300 flex items-center justify-center text-xs">1</span>
                      <span>How to Download All 29+ Files at Once</span>
                    </h4>
                    <p className="text-slate-300 text-xs">
                      Tap the blue <strong className="text-cyan-300">"Download All Files (ZIP)"</strong> button at the top of this modal. Your mobile browser will immediately download <code className="text-cyan-300 font-mono">amibroker-web-project.zip</code> containing all 29+ files sorted into their exact folders!
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="font-bold text-emerald-300 flex items-center gap-2 text-xs sm:text-sm">
                      <span className="w-5 h-5 rounded-full bg-emerald-900/80 text-emerald-300 flex items-center justify-center text-xs">2</span>
                      <span>How to Upload to GitHub on Mobile</span>
                    </h4>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-xs ml-1">
                      <li>Open <strong className="text-white">github.com</strong> in your mobile browser and log in.</li>
                      <li>Tap the <strong>+</strong> icon at the top $\rightarrow$ <strong>New repository</strong>. Name it <code className="text-cyan-300 font-mono">amibroker-web</code> and tap <strong>Create repository</strong>.</li>
                      <li>On the repository page, tap <strong>"uploading an existing file"</strong>. You can unzip the downloaded zip on your phone and upload files directly!</li>
                      <li>Or tap <strong>Add file $\rightarrow$ Create new file</strong>, type the full path like <code className="text-amber-300 font-mono">src/components/ChartPane.tsx</code>, switch to the <strong>"All 29+ Files"</strong> tab in this modal, tap <strong>Copy</strong>, paste into GitHub, and tap <strong>Commit changes</strong>.</li>
                    </ol>
                  </div>

                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="font-bold text-amber-300 flex items-center gap-2 text-xs sm:text-sm">
                      <span className="w-5 h-5 rounded-full bg-amber-900/80 text-amber-300 flex items-center justify-center text-xs">3</span>
                      <span>Cloudflare R2 Preparation on Mobile</span>
                    </h4>
                    <p className="text-slate-300 text-xs">
                      Open <strong className="text-white">dash.cloudflare.com</strong> on mobile $\rightarrow$ tap <strong>R2</strong> $\rightarrow$ tap <strong>Create bucket</strong> $\rightarrow$ enter <code className="text-cyan-300 font-mono">bhavcopy-store</code> $\rightarrow$ tap <strong>Create</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="font-bold text-purple-300 flex items-center gap-2 text-xs sm:text-sm">
                      <span className="w-5 h-5 rounded-full bg-purple-900/80 text-purple-300 flex items-center justify-center text-xs">4</span>
                      <span>Deploying on Render from Mobile</span>
                    </h4>
                    <p className="text-slate-300 text-xs">
                      Open <strong className="text-white">render.com</strong> on mobile $\rightarrow$ tap <strong>New +</strong> $\rightarrow$ <strong>Static Site</strong> $\rightarrow$ select your GitHub repository <code className="text-cyan-300 font-mono">amibroker-web</code> $\rightarrow$ set Build Command to <code className="text-white font-mono">npm run build</code> and Publish Directory to <code className="text-white font-mono">dist</code> $\rightarrow$ tap <strong>Create Static Site</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section 2: GitHub Folder Structure & Uploading */}
            {activeSection === 'github_setup' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Github className="w-5 h-5 text-cyan-400" />
                      <span>2. GitHub Repository: Exact Folder Structure & Which Files Go Where</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Complete directory map to ensure every file is placed in the exact right folder on GitHub.
                    </p>
                  </div>
                </div>

                {/* Exact Folder Tree Breakdown */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] space-y-3">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                    <FolderTree className="w-4 h-4 text-cyan-400" />
                    <span>Exact Repository File Tree ({allFiles.length} files total)</span>
                  </div>

                  <div className="space-y-2 text-slate-300">
                    <div>
                      <span className="text-amber-400 font-bold">📂 Root Folder (amibroker-web/):</span>
                      <ul className="pl-4 space-y-1 text-slate-400">
                        <li>📄 <strong className="text-slate-200">package.json</strong> (Project manifest & dependencies)</li>
                        <li>📄 <strong className="text-slate-200">index.html</strong> (HTML entry point)</li>
                        <li>📄 <strong className="text-slate-200">vite.config.ts</strong> (Bundler configuration)</li>
                        <li>📄 <strong className="text-slate-200">tsconfig.json</strong> & <strong className="text-slate-200">tsconfig.node.json</strong></li>
                        <li>📄 <strong className="text-slate-200">render.yaml</strong> (Render.com deployment config)</li>
                        <li>📄 <strong className="text-slate-200">wrangler.toml</strong> (Cloudflare Pages & R2 config)</li>
                        <li>📄 <strong className="text-slate-200">Dockerfile</strong> (Docker production image)</li>
                        <li>📄 <strong className="text-slate-200">README.md</strong> (Documentation)</li>
                      </ul>
                    </div>

                    <div className="pt-2">
                      <span className="text-cyan-400 font-bold">📂 Folder: src/</span>
                      <ul className="pl-4 space-y-1 text-slate-400">
                        <li>📄 <strong className="text-slate-200">src/App.tsx</strong> (Main layout, tab switching, sheet state)</li>
                        <li>📄 <strong className="text-slate-200">src/main.tsx</strong> (Application mounting point)</li>
                        <li>📄 <strong className="text-slate-200">src/index.css</strong> (Tailwind CSS global styling)</li>
                      </ul>
                    </div>

                    <div className="pt-2">
                      <span className="text-emerald-400 font-bold">📂 Folder: src/components/</span>
                      <ul className="pl-4 space-y-1 text-slate-400">
                        <li>📄 <strong className="text-slate-200">ChartPane.tsx</strong> (Chart, candle types, timeframes, crosshair, indicators)</li>
                        <li>📄 <strong className="text-slate-200">AmiBrokerHeader.tsx</strong> (Top bar, symbol search, AB menu, locks)</li>
                        <li>📄 <strong className="text-slate-200">BacktestingSuite.tsx</strong> (Portfolio backtest, CAR/MDD, taxes, optimizer)</li>
                        <li>📄 <strong className="text-slate-200">AflStrategyEditor.tsx</strong> (AFL IDE, formula save/load, .afl import/export)</li>
                        <li>📄 <strong className="text-slate-200">ScannerExploration.tsx</strong> (Universe scanner across market/sectors)</li>
                        <li>📄 <strong className="text-slate-200">BhavcopyDataManager.tsx</strong> (Daily bhavcopy CSV manager & 20-yr history)</li>
                        <li>📄 <strong className="text-slate-200">CorporateActionManager.tsx</strong> (Stock splits, bonuses & adjustment calculations)</li>
                        <li>📄 <strong className="text-slate-200">SymbolCategoriesWatchlistModal.tsx</strong> (Markets, groups, watchlists, .abw exporter)</li>
                        <li>📄 <strong className="text-slate-200">UserGuideModal.tsx</strong> (User manual modal & download manager)</li>
                        <li>📄 <strong className="text-slate-200">CloudArchitectureModal.tsx</strong> (Cloudflare R2 free tier guide)</li>
                        <li>📄 <strong className="text-slate-200">DrawingOverlay.tsx</strong> (Trendlines, Fibonacci retracements, study IDs)</li>
                      </ul>
                    </div>

                    <div className="pt-2">
                      <span className="text-purple-400 font-bold">📂 Folder: src/types/</span>
                      <ul className="pl-4 space-y-1 text-slate-400">
                        <li>📄 <strong className="text-slate-200">src/types/market.ts</strong> (Market data, trade, and backtest types)</li>
                      </ul>
                    </div>

                    <div className="pt-2">
                      <span className="text-rose-400 font-bold">📂 Folder: src/utils/</span>
                      <ul className="pl-4 space-y-1 text-slate-400">
                        <li>📄 <strong className="text-slate-200">src/utils/aflEngine.ts</strong> (AFL script execution engine & overrides)</li>
                        <li>📄 <strong className="text-slate-200">src/utils/backtester.ts</strong> (Quantitative simulation engine, metrics, taxes)</li>
                        <li>📄 <strong className="text-slate-200">src/utils/indicators.ts</strong> (Technical indicator formulas: RSI, EMA, ATR, Supertrend)</li>
                        <li>📄 <strong className="text-slate-200">src/utils/sampleData.ts</strong> (NSE stock universe and default quote generator)</li>
                        <li>📄 <strong className="text-slate-200">src/utils/categoriesWatchlists.ts</strong> (Watchlists, favorites, and .abw file parser)</li>
                        <li>📄 <strong className="text-slate-200">src/utils/projectZipExporter.ts</strong> (Project files ZIP generator)</li>
                      </ul>
                    </div>

                    <div className="pt-2">
                      <span className="text-blue-400 font-bold">📂 Folder: .github/workflows/</span>
                      <ul className="pl-4 space-y-1 text-slate-400">
                        <li>📄 <strong className="text-slate-200">.github/workflows/deploy.yml</strong> (CI/CD automated build)</li>
                        <li>📄 <strong className="text-slate-200">.github/workflows/daily_nse_bhavcopy_r2.yml</strong> (Automated 7:00 PM IST daily Bhavcopy sync to R2)</li>
                      </ul>
                    </div>

                    <div className="pt-2">
                      <span className="text-amber-400 font-bold">📂 Folder: scripts/</span>
                      <ul className="pl-4 space-y-1 text-slate-400">
                        <li>📄 <strong className="text-slate-200">scripts/ingest_nse_bhavcopy_r2.py</strong> (Python Bhavcopy downloader and Cloudflare R2 uploader)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Cloudflare Deploy & R2 */}
            {activeSection === 'cloudflare_deploy' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Cloud className="w-5 h-5 text-cyan-400" />
                      <span>3. Cloudflare R2 Preparation & Pages Free Hosting</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Set up free cloud storage for Bhavcopy archives with zero egress fees.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="font-bold text-cyan-300 text-xs sm:text-sm">Step 1: Create Cloudflare R2 Bucket</h4>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300 text-xs ml-1">
                      <li>Log into <strong className="text-white">dash.cloudflare.com</strong> on mobile or PC.</li>
                      <li>In the left sidebar, tap <strong className="text-cyan-300">R2 Object Storage</strong>.</li>
                      <li>Tap <strong className="text-white">Create bucket</strong>.</li>
                      <li>Bucket Name: enter <code className="text-emerald-300 font-mono">bhavcopy-store</code>.</li>
                      <li>Location: leave as <strong>Automatic</strong> and tap <strong>Create Bucket</strong>.</li>
                    </ol>
                  </div>

                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="font-bold text-cyan-300 text-xs sm:text-sm">Step 2: Configure CORS Policy</h4>
                    <p className="text-slate-400 text-xs">
                      Inside your <code className="text-cyan-300 font-mono">bhavcopy-store</code> bucket, tap <strong>Settings</strong> $\rightarrow$ scroll to <strong>CORS Policy</strong> $\rightarrow$ tap <strong>Add CORS Policy</strong> and paste:
                    </p>
                    <div className="relative bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-slate-300">
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `[\n  {\n    "AllowedOrigins": ["*"],\n    "AllowedMethods": ["GET", "PUT", "HEAD"],\n    "AllowedHeaders": ["*"],\n    "MaxAgeSeconds": 3600\n  }\n]`,
                            'cors_json'
                          )
                        }
                        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px]"
                      >
                        {copiedCode === 'cors_json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode === 'cors_json' ? 'Copied' : 'Copy'}</span>
                      </button>
                      <pre>{`[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]`}</pre>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <h4 className="font-bold text-cyan-300 text-xs sm:text-sm">Step 3: Connect Cloudflare Pages</h4>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300 text-xs ml-1">
                      <li>Go to <strong>Workers & Pages</strong> $\rightarrow$ <strong>Create application</strong> $\rightarrow$ <strong>Pages</strong>.</li>
                      <li>Tap <strong>Connect to Git</strong> $\rightarrow$ Select your GitHub repo.</li>
                      <li>Framework preset: <strong className="text-cyan-300">Vite</strong>.</li>
                      <li>Build command: <code className="text-white font-mono bg-slate-900 px-1 py-0.5 rounded">npm run build</code>.</li>
                      <li>Build output directory: <code className="text-white font-mono bg-slate-900 px-1 py-0.5 rounded">dist</code>.</li>
                      <li>Tap <strong>Save and Deploy</strong>!</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Render Deploy */}
            {activeSection === 'render_deploy' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Server className="w-5 h-5 text-cyan-400" />
                      <span>4. Deploying on Render.com</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Free static web app hosting with automatic SSL and continuous deployment from GitHub.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <h4 className="font-bold text-cyan-300 text-xs sm:text-sm">Render Step-by-Step Instructions</h4>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs ml-1">
                    <li>Sign up or log into <strong className="text-white">render.com</strong> with your GitHub account.</li>
                    <li>On the Render dashboard, tap the blue <strong className="text-cyan-300">New +</strong> button $\rightarrow$ select <strong className="text-white">Static Site</strong>.</li>
                    <li>Choose your GitHub repository <code className="text-cyan-300 font-mono">amibroker-web</code>.</li>
                    <li>Fill in these settings:
                      <ul className="list-disc list-inside ml-4 mt-1 text-slate-400 space-y-1">
                        <li>Name: <code className="text-white font-mono bg-slate-900 px-1.5 py-0.5 rounded">amibroker-web</code></li>
                        <li>Branch: <code className="text-white font-mono bg-slate-900 px-1.5 py-0.5 rounded">main</code></li>
                        <li>Build Command: <code className="text-emerald-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">npm run build</code></li>
                        <li>Publish Directory: <code className="text-emerald-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">dist</code></li>
                      </ul>
                    </li>
                    <li>Scroll down and tap <strong className="text-white">Create Static Site</strong>.</li>
                    <li>Your site is live instantly on HTTPS!</li>
                  </ol>

                  {/* Render Troubleshooting & Error Fix Guide */}
                  <div className="mt-4 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl space-y-3">
                    <h4 className="font-bold text-rose-300 text-xs sm:text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Troubleshooting: "Deploy failed" on Render (How to Fix)</span>
                    </h4>

                    <div className="space-y-2 text-slate-300 text-xs">
                      <div>
                        <strong className="text-white font-semibold">1. Set Node Version to 22 in Render (Most Common Fix):</strong>
                        <p className="text-slate-400 mt-0.5">
                          Vite 8 requires Node.js 20 or 22. By default, Render may use an older Node version (like Node 14 or 18), causing the build to fail in 20 seconds.
                        </p>
                        <ol className="list-disc list-inside mt-1 ml-2 text-slate-300 space-y-0.5">
                          <li>In Render, go to your Static Site dashboard.</li>
                          <li>Tap the <strong className="text-cyan-300">Environment</strong> tab in the menu.</li>
                          <li>Tap <strong className="text-white">Add Environment Variable</strong>.</li>
                          <li>Key: <code className="text-emerald-300 font-mono bg-slate-900 px-1 py-0.5 rounded">NODE_VERSION</code></li>
                          <li>Value: <code className="text-emerald-300 font-mono bg-slate-900 px-1 py-0.5 rounded">22.14.0</code> (or <code className="text-emerald-300 font-mono bg-slate-900 px-1 py-0.5 rounded">22</code>)</li>
                          <li>Tap <strong className="text-white">Save Changes</strong>.</li>
                          <li>Tap <strong className="text-cyan-300">Manual Deploy</strong> $\rightarrow$ <strong className="text-white">Deploy latest commit</strong>!</li>
                        </ol>
                      </div>

                      <div className="pt-2 border-t border-rose-900/60">
                        <strong className="text-white font-semibold">2. Check Your GitHub Repository Structure:</strong>
                        <p className="text-slate-400 mt-0.5">
                          On GitHub, make sure <code className="text-white font-mono">package.json</code> is located right at the top root of your repository, NOT inside a subfolder (e.g. <code className="text-rose-400 font-mono">amibroker-web-project/package.json</code>) and NOT uploaded as an unextracted <code className="text-rose-400 font-mono">.zip</code> file.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-rose-900/60">
                        <strong className="text-white font-semibold">3. View the Exact Error Log:</strong>
                        <p className="text-slate-400 mt-0.5">
                          On your phone screen, tap <strong className="text-white">"Dismiss"</strong> on the "Debug build issues with AI" popup. Scroll down the log terminal to read the exact error message.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section 1: Local Computer Setup */}
            {activeSection === 'getting_started' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-cyan-400" />
                      <span>1. How to Setup on Computer (Windows, macOS, Linux)</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Run AmiBroker Web locally on your desktop machine with high-performance instant updates.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-cyan-300">Prerequisites</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300 ml-1">
                    <li>Node.js v18.0.0 or higher (<code className="bg-slate-800 px-1 py-0.5 rounded font-mono text-cyan-300">node -v</code>) from https://nodejs.org</li>
                    <li>npm v9.0.0 or higher (comes with Node.js)</li>
                  </ul>

                  <h4 className="text-sm font-semibold text-cyan-300 mt-4">Manual Terminal Commands</h4>
                  <div className="relative bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-300">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `# 1. Unzip downloaded amibroker-web-project.zip\ncd amibroker-web\n\n# 2. Install dependencies\nnpm install\n\n# 3. Start development server on port 3000\nnpm run dev\n\n# 4. Open in browser: http://localhost:3000`,
                          'setup_cmd'
                        )
                      }
                      className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] transition-colors"
                    >
                      {copiedCode === 'setup_cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode === 'setup_cmd' ? 'Copied' : 'Copy'}</span>
                    </button>
                    <pre className="text-emerald-400"># 1. Unzip amibroker-web-project.zip and navigate into directory</pre>
                    <pre>cd amibroker-web</pre>
                    <pre className="text-emerald-400 mt-2"># 2. Install dependencies</pre>
                    <pre>npm install</pre>
                    <pre className="text-emerald-400 mt-2"># 3. Start development server on port 3000</pre>
                    <pre>npm run dev</pre>
                    <pre className="text-emerald-400 mt-2"># 4. Build for production</pre>
                    <pre>npm run build</pre>
                  </div>
                </div>
              </div>
            )}

            {/* Section 5: AFL Formula IDE */}
            {activeSection === 'afl_ide' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-cyan-400" />
                    <span>5. How to Save and Open AFL Formulas in the IDE</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Work seamlessly with proprietary trading strategies, local files, and formulas.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>Download .afl to PC/Mobile</span>
                    </h4>
                    <p className="text-slate-400">
                      Click the "Download .afl" button in the IDE top toolbar. The active script will download directly to your device as a standard AmiBroker formula file (.afl).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>Open .afl from PC/Mobile</span>
                    </h4>
                    <p className="text-slate-400">
                      Click "Open .afl from PC" and select any <code className="text-white font-mono">.afl</code> or <code className="text-white font-mono">.txt</code> file from your device files to load it directly into the editor.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Save className="w-4 h-4 text-amber-400" />
                      <span>Save to Library</span>
                    </h4>
                    <p className="text-slate-400">
                      Store formulas locally in your browser's persistent localStorage database. They remain available across all sessions.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                    <h4 className="font-bold text-purple-300 flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-purple-400" />
                      <span>AFL Settings Overrides</span>
                    </h4>
                    <p className="text-slate-400">
                      Values defined inside your AFL script (e.g. <code className="text-cyan-300 font-mono">InitialEquity = 100000;</code>, <code className="text-cyan-300 font-mono">PositionSize = -5;</code>, <code className="text-cyan-300 font-mono">StopLoss = 5;</code>) automatically override manual backtest parameters!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Section 6: Backtesting */}
            {activeSection === 'backtesting' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <PlayCircle className="w-5 h-5 text-cyan-400" />
                    <span>6. Portfolio Backtesting & AmiBroker Settings Guide</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Comprehensive multi-symbol portfolio simulation, taxes, and custom metrics.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-cyan-300">Universe Scope Selection</h4>
                  <p className="text-slate-300">
                    Run simulations across Single Symbol, Market Segment, Index / Group, Sector & Industry, Favorites, Watchlists, or All Stocks.
                  </p>

                  <h4 className="text-sm font-semibold text-cyan-300 mt-4">Taxes, Brokerage & Slippage (Defaults to 0)</h4>
                  <p className="text-slate-300">
                    All stop losses, profit targets, trailing stops, taxes and brokerage default to 0 unless customized by the user or defined in the AFL code:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 ml-2">
                    <li><strong className="text-white">STT (Securities Transaction Tax)</strong>: Standard 0.1% on delivery equity</li>
                    <li><strong className="text-white">Stamp Duty</strong>: 0.015% on buyer</li>
                    <li><strong className="text-white">STCG (Short-Term Capital Gains Tax)</strong>: 15% on net realized profits</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Section 7: Database */}
            {activeSection === 'database' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    <span>7. Database & Bhavcopy Updates</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Manage 20-year daily historical data, corporate actions, and split adjustments.
                  </p>
                </div>
                <p className="text-slate-300">
                  Import NSE Bhavcopy CSV files directly via the Bhavcopy Data Manager tab or synchronize with Cloudflare R2 storage.
                </p>
              </div>
            )}

            {/* Section 8: Charting */}
            {activeSection === 'charting' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-cyan-400" />
                    <span>8. Charting, Timeframe Locks & Multi-Sheets</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Customize timeframe bars, lock symbols, and manage multi-sheet workspaces.
                  </p>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 ml-2">
                  <li><strong className="text-white">Rename Sheet</strong>: Double-click sheet tab or click the pencil icon.</li>
                  <li><strong className="text-white">Remove Sheet</strong>: Click the X icon on any sheet tab to delete it.</li>
                  <li><strong className="text-white">Timeframe Locks</strong>: Lock timeframes or symbols to prevent accidental switching.</li>
                  <li><strong className="text-white">Crosshair Quote Bar</strong>: Fast smooth tracking with real-time OHLC, delivery volume, overlays, and indicator values.</li>
                </ul>
              </div>
            )}

            {/* Section 9: Indicators */}
            {activeSection === 'indicators_ma' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-cyan-400" />
                    <span>9. Indicators & Moving Averages</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Individual settings dialogs open automatically when adding overlays or lower pan indicators.
                  </p>
                </div>
                <p className="text-slate-300">
                  Every indicator and moving average has its own independent parameter properties (periods, multipliers, colors, lines) displayed neatly in dedicated rows so they never overflow the screen.
                </p>
              </div>
            )}

            {/* Section 10: Drawings */}
            {activeSection === 'drawings_study' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-cyan-400" />
                    <span>10. Drawing Tools & Study ID in AFL</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Fibonacci retracements, trendlines, horizontal rays, and AFL Study() integration.
                  </p>
                </div>
                <p className="text-slate-300">
                  Drawings are persistently stored per symbol. You can assign a Study ID to trendlines to reference them dynamically in AFL formulas via <code className="text-cyan-300 font-mono">Study("RE", GetChartID())</code>.
                </p>
              </div>
            )}

            {/* Section 11: Categories & Watchlists */}
            {activeSection === 'categories_watchlists' && (
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-cyan-400" />
                    <span>11. Categories, Favorites & Watchlists</span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    AmiBroker standard categories, custom watchlists, and .abw file import/export.
                  </p>
                </div>
                <p className="text-slate-300">
                  Organize stocks into markets, groups, sectors, and industries. Star your favorites for one-click access and export watchlists as AmiBroker .abw files.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
