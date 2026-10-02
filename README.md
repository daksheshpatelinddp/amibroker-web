# AmiBroker Web Professional Edition

Professional Technical Analysis & Charting Platform for Indian Equities (NSE/BSE). Built with React 19, Vite, and Tailwind CSS.

## 🚀 One-Click Render Deployment Instructions

### Option 1: Render Static Site (Recommended - Free & Fast)
1. In Render Dashboard, click **New +** -> **Static Site**.
2. Connect your GitHub repository (`amibroker-web`).
3. Fill in the build settings:
   - **Name**: `amibroker-web` (or any name)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. In **Environment Variables**, add (or leave default):
   - `NODE_VERSION` = `20.18.0`
5. In **Redirects / Rewrites**, add:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
6. Click **Create Static Site**.

---

## 🛠 Local Development

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build for production
npm run build

# Preview build locally
npm run preview
```

## ✨ Features
- 60+ NSE symbols preloaded with 20-year EOD synthetic & real bhavcopy support.
- Corporate action adjustments: stock splits, bonus issues, and rights adjustments backwards in time.
- Date range backfiller for any preferred date span.
- AmiBroker-style AFL formula indicator engine (MACD, RSI, Bollinger, SuperTrend, EMA 20/50/200, Volume profile).
- Offline persistence via browser IndexedDB.
- Full mobile responsive charting engine.
