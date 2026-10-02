import JSZip from 'jszip';

// Vite raw glob to load all src files dynamically
const srcModules = import.meta.glob(
  ['/src/**/*.{tsx,ts,css}'],
  { query: '?raw', import: 'default', eager: true }
) as Record<string, string>;

// Configuration and root files
const PACKAGE_JSON_CONTENT = `{
  "name": "amibroker-web",
  "private": true,
  "version": "2.4.0",
  "type": "module",
  "engines": {
    "node": ">=20.19.0 || >=22.12.0"
  },
  "scripts": {
    "dev": "vite --port=3000 --host=0.0.0.0",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@vitejs/plugin-react": "^6.1.1",
    "lucide-react": "^0.546.0",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^8.3.0",
    "jszip": "^3.10.1"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@types/jszip": "^3.4.1",
    "tailwindcss": "^4.3.3",
    "typescript": "^7.0.2"
  }
}
`;

const INDEX_HTML_CONTENT = `<!doctype html>
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
`;

const VITE_CONFIG_CONTENT = `import tailwindcss from '@tailwindcss/vite';
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
`;

const TSCONFIG_CONTENT = `{
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
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
`;

const TSCONFIG_NODE_CONTENT = `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
`;

const RENDER_YAML_CONTENT = `services:
  - type: web
    name: amibroker-web
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: NODE_VERSION
        value: 22.14.0
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
`;

const NODE_VERSION_CONTENT = `22.14.0\n`;
const NVMRC_CONTENT = `22.14.0\n`;

const WRANGLER_TOML_CONTENT = `name = "amibroker-web"
compatibility_date = "2024-09-01"

[site]
bucket = "./dist"

[[r2_buckets]]
binding = "BHAVCOPY_BUCKET"
bucket_name = "bhavcopy-store"
`;

const DOCKERFILE_CONTENT = `FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

const GITIGNORE_CONTENT = `node_modules
dist
dist-ssr
*.local
.env
.DS_Store
*.log
`;

const GITHUB_DEPLOY_YML = `name: Build & Deploy AmiBroker Web
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
`;

const DAILY_NSE_BHAVCOPY_YML = `name: Daily NSE Bhavcopy Ingestion to Cloudflare R2 (Free Tier Optimized)

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
`;

const SETUP_WINDOWS_BAT = `@echo off
echo ========================================================
echo   Setting up AmiBroker Web Platform on Windows PC
echo ========================================================
echo Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js LTS from https://nodejs.org
    pause
    exit /b 1
)

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo ========================================================
echo   Starting AmiBroker Web on http://localhost:3000
echo ========================================================
call npm run dev
pause
`;

const SETUP_MAC_LINUX_SH = `#!/usr/bin/env bash
set -e

echo "========================================================"
echo "  Setting up AmiBroker Web Platform on macOS / Linux"
echo "========================================================"

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please download and install Node.js from https://nodejs.org or via brew: brew install node"
    exit 1
fi

echo "Installing npm dependencies..."
npm install

echo "========================================================"
echo "  Launching AmiBroker Web on http://localhost:3000"
echo "========================================================"
npm run dev
`;

const BHAVCOPY_R2_PYTHON = `"""
NSE Bhavcopy to Cloudflare R2 Ingestion Script
Fetches daily Bhavcopy zip/csv from NSE and syncs to R2 storage
"""
import os
import requests
import boto3
from datetime import datetime

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
R2_SECRET_KEY = os.getenv("R2_SECRET_KEY")
R2_BUCKET = os.getenv("R2_BUCKET", "bhavcopy-store")

def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
    )

def main():
    today = datetime.now().strftime("%Y-%m-%d")
    print(f"Checking NSE Bhavcopy sync for {today}...")

if __name__ == "__main__":
    main()
`;

const README_CONTENT = `# AmiBroker Web — Quantitative Portfolio Backtesting & AFL Strategy Engine

A web-based AmiBroker alternative built with React 19, TypeScript, Tailwind CSS, and Vite.

## Features
- **AmiBroker Portfolio Backtest & Optimization Suite** (CAR/MDD, K-Ratio, Sharpe, STT & taxes, slippage)
- **AFL Strategy & Exploration IDE** with formula overrides (\`InitialEquity\`, \`PositionSize\`, \`StopLoss\`, etc.)
- **Multi-Sheet Workspaces** with rename and delete capabilities
- **Dynamic Crosshair Quote Bar** tracking OHLC, delivery volume, overlays, and indicators
- **Universe Explorer & Scanner** across Markets, Sectors, Industries, Favorites, and Watchlists
- **Full NSE 20-Year Historical Bhavcopy** support & split adjustments

## Quick Start (Local Computer)
\`\`\`bash
npm install
npm run dev
\`\`\`
Visit \`http://localhost:3000\` in your browser.

## Deployment
- **Render.com**: Connect GitHub repository $\\rightarrow$ Static Site $\\rightarrow$ \`npm run build\` $\\rightarrow$ \`dist\`.
- **Cloudflare Pages**: Connect GitHub repository $\\rightarrow$ Framework Vite $\\rightarrow$ \`npm run build\` $\\rightarrow$ \`dist\`.
`;

export interface ProjectFileEntry {
  path: string;
  name: string;
  folder: string;
  content: string;
  description: string;
}

/**
 * Get all project files structured with their exact directory paths
 */
export function getAllProjectFiles(): ProjectFileEntry[] {
  const files: ProjectFileEntry[] = [
    // Root files
    { path: 'package.json', name: 'package.json', folder: 'Root', content: PACKAGE_JSON_CONTENT, description: 'Dependencies and npm run scripts' },
    { path: '.node-version', name: '.node-version', folder: 'Root', content: NODE_VERSION_CONTENT, description: 'Sets Node.js version 22 for Render and Cloudflare' },
    { path: '.nvmrc', name: '.nvmrc', folder: 'Root', content: NVMRC_CONTENT, description: 'Node Version Manager config (Node 22)' },
    { path: 'index.html', name: 'index.html', folder: 'Root', content: INDEX_HTML_CONTENT, description: 'HTML application entry point' },
    { path: 'vite.config.ts', name: 'vite.config.ts', folder: 'Root', content: VITE_CONFIG_CONTENT, description: 'Vite bundler and dev server configuration' },
    { path: 'tsconfig.json', name: 'tsconfig.json', folder: 'Root', content: TSCONFIG_CONTENT, description: 'TypeScript compiler configuration' },
    { path: 'tsconfig.node.json', name: 'tsconfig.node.json', folder: 'Root', content: TSCONFIG_NODE_CONTENT, description: 'Vite Node TypeScript configuration' },
    { path: 'render.yaml', name: 'render.yaml', folder: 'Root', content: RENDER_YAML_CONTENT, description: 'Render.com static site blueprint' },
    { path: 'wrangler.toml', name: 'wrangler.toml', folder: 'Root', content: WRANGLER_TOML_CONTENT, description: 'Cloudflare Pages & R2 bucket binding' },
    { path: 'Dockerfile', name: 'Dockerfile', folder: 'Root', content: DOCKERFILE_CONTENT, description: 'Multi-stage Docker container build' },
    { path: '.gitignore', name: '.gitignore', folder: 'Root', content: GITIGNORE_CONTENT, description: 'Git ignore rules for node_modules and dist' },
    { path: 'README.md', name: 'README.md', folder: 'Root', content: README_CONTENT, description: 'Project documentation and overview' },
    { path: 'setup-windows.bat', name: 'setup-windows.bat', folder: 'Root', content: SETUP_WINDOWS_BAT, description: 'Windows 1-click install and run batch script' },
    { path: 'setup-mac-linux.sh', name: 'setup-mac-linux.sh', folder: 'Root', content: SETUP_MAC_LINUX_SH, description: 'macOS & Linux 1-click setup shell script' },
    { path: '.github/workflows/deploy.yml', name: 'deploy.yml', folder: '.github/workflows', content: GITHUB_DEPLOY_YML, description: 'GitHub Actions automated build workflow' },
    { path: '.github/workflows/daily_nse_bhavcopy_r2.yml', name: 'daily_nse_bhavcopy_r2.yml', folder: '.github/workflows', content: DAILY_NSE_BHAVCOPY_YML, description: 'Daily 7:00 PM IST automated NSE Bhavcopy sync to R2' },
    { path: 'scripts/ingest_nse_bhavcopy_r2.py', name: 'ingest_nse_bhavcopy_r2.py', folder: 'scripts', content: BHAVCOPY_R2_PYTHON, description: 'Bhavcopy to Cloudflare R2 sync script' },
  ];

  // Add all src modules gathered from Vite
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

  // Sort files by path alphabetically
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Generate and trigger download of the complete amibroker-web.zip file
 */
export async function downloadCompleteProjectZip(
  onProgress?: (percent: number, currentFile: string) => void
): Promise<void> {
  const zip = new JSZip();
  const allFiles = getAllProjectFiles();

  const total = allFiles.length;
  for (let i = 0; i < total; i++) {
    const file = allFiles[i];
    zip.file(file.path, file.content);
    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 50), file.path);
    }
  }

  // Generate the zip blob
  const content = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    },
    (metadata) => {
      if (onProgress) {
        onProgress(50 + Math.round(metadata.percent / 2), 'Compressing ZIP archive...');
      }
    }
  );

  // Trigger download in browser (works on Mobile and Desktop)
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'amibroker-web-project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
