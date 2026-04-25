# Nifty 50 Prediction Engine

Next-day direction prediction for all Nifty 50 stocks, powered by 67 quantitative features.

## Live Demo
Deploy to Vercel and it works immediately — no backend setup needed.

## Architecture

```
nifty50-engine/
├── api/
│   ├── stock.js       ← Vercel serverless: single stock Yahoo Finance proxy
│   └── batch.js       ← Vercel serverless: batch fetch (all 50 stocks)
├── public/
│   └── index.html     ← Entry HTML
├── src/
│   ├── index.js       ← React entry
│   └── App.jsx        ← Full dashboard (features, predictions, backtest)
├── package.json
├── vercel.json        ← Vercel routing config
└── README.md
```

## Deploy to Vercel (3 steps)

### 1. Push to GitHub
```bash
cd nifty50-engine
git init
git add .
git commit -m "Nifty 50 Prediction Engine"
git remote add origin https://github.com/YOUR_USERNAME/nifty50-engine.git
git push -u origin main
```

### 2. Connect to Vercel
- Go to [vercel.com](https://vercel.com) → "Add New Project"
- Import your GitHub repo
- Framework: Create React App
- Build Command: `npm run build`
- Output Directory: `build`
- Click Deploy

### 3. Done!
Your site is live at `https://nifty50-engine.vercel.app` (or similar).
The `/api/stock` and `/api/batch` serverless functions handle Yahoo Finance
data fetching server-side, avoiding CORS issues.

## Local Development
```bash
npm install
npm run dev
```
Note: In local dev, Yahoo Finance API calls go direct (may hit CORS).
The Vercel proxy only works when deployed.

## How It Works

1. **Data**: Vercel serverless functions fetch 150 days of OHLCV from Yahoo Finance
2. **Features**: 67 features computed in-browser (RSI, MACD, Bollinger, volume, cross-sectional)
3. **Model**: Multi-factor scoring model produces UP/DOWN/FLAT + conviction score
4. **Display**: Bloomberg-terminal-inspired dark dashboard with filters, sorting, sparklines

## Future Enhancements
- Replace heuristic scoring with trained LightGBM model served via `/api/predict`
- Add real backtest data from `oos_predictions.parquet`
- WebSocket for intraday updates
- Alert system for high-conviction signals
