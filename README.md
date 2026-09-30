# AmiBroker Web — Quantitative Portfolio Backtesting & AFL Strategy Engine

A web-based AmiBroker alternative built with React 19, TypeScript, Tailwind CSS, and Vite.

## Features
- **AmiBroker Portfolio Backtest & Optimization Suite** (CAR/MDD, K-Ratio, Sharpe, STT & taxes, slippage)
- **AFL Strategy & Exploration IDE** with formula overrides (`InitialEquity`, `PositionSize`, `StopLoss`, etc.)
- **Multi-Sheet Workspaces** with rename and delete capabilities
- **Dynamic Crosshair Quote Bar** tracking OHLC, delivery volume, overlays, and indicators
- **Universe Explorer & Scanner** across Markets, Sectors, Industries, Favorites, and Watchlists
- **Full NSE 20-Year Historical Bhavcopy** support & split adjustments

## Quick Start (Local Computer)
```bash
npm install
npm run dev
```
Visit `http://localhost:3000` in your browser.

## Deployment
- **Render.com**: Connect GitHub repository $\rightarrow$ Static Site $\rightarrow$ `npm run build` $\rightarrow$ `dist`.
- **Cloudflare Pages**: Connect GitHub repository $\rightarrow$ Framework Vite $\rightarrow$ `npm run build` $\rightarrow$ `dist`.
