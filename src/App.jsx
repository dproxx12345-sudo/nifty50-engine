import React, { useState, useEffect, useMemo, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   NIFTY 50 STOCKS
   ═══════════════════════════════════════════════════════════════ */
const NIFTY50 = [
  { t: "RELIANCE", n: "Reliance Industries", s: "Energy" },
  { t: "TCS", n: "Tata Consultancy", s: "IT" },
  { t: "HDFCBANK", n: "HDFC Bank", s: "Financials" },
  { t: "ICICIBANK", n: "ICICI Bank", s: "Financials" },
  { t: "INFY", n: "Infosys", s: "IT" },
  { t: "BHARTIARTL", n: "Bharti Airtel", s: "Telecom" },
  { t: "SBIN", n: "State Bank of India", s: "Financials" },
  { t: "ITC", n: "ITC Ltd", s: "FMCG" },
  { t: "BAJFINANCE", n: "Bajaj Finance", s: "Financials" },
  { t: "HINDUNILVR", n: "Hindustan Unilever", s: "FMCG" },
  { t: "LT", n: "Larsen & Toubro", s: "Infra" },
  { t: "KOTAKBANK", n: "Kotak Mahindra Bank", s: "Financials" },
  { t: "AXISBANK", n: "Axis Bank", s: "Financials" },
  { t: "MARUTI", n: "Maruti Suzuki", s: "Auto" },
  { t: "SUNPHARMA", n: "Sun Pharma", s: "Pharma" },
  { t: "TATAMOTORS", n: "Tata Motors", s: "Auto" },
  { t: "ADANIPORTS", n: "Adani Ports", s: "Infra" },
  { t: "TITAN", n: "Titan Company", s: "Consumer" },
  { t: "WIPRO", n: "Wipro", s: "IT" },
  { t: "BAJAJFINSV", n: "Bajaj Finserv", s: "Financials" },
  { t: "TATASTEEL", n: "Tata Steel", s: "Metals" },
  { t: "NTPC", n: "NTPC Ltd", s: "Utilities" },
  { t: "POWERGRID", n: "Power Grid Corp", s: "Utilities" },
  { t: "HCLTECH", n: "HCL Technologies", s: "IT" },
  { t: "ASIANPAINT", n: "Asian Paints", s: "Consumer" },
  { t: "COALINDIA", n: "Coal India", s: "Energy" },
  { t: "M&M", n: "Mahindra & Mahindra", s: "Auto" },
  { t: "ONGC", n: "ONGC", s: "Energy" },
  { t: "JSWSTEEL", n: "JSW Steel", s: "Metals" },
  { t: "DRREDDY", n: "Dr Reddy's Labs", s: "Pharma" },
  { t: "CIPLA", n: "Cipla", s: "Pharma" },
  { t: "NESTLEIND", n: "Nestle India", s: "FMCG" },
  { t: "EICHERMOT", n: "Eicher Motors", s: "Auto" },
  { t: "TECHM", n: "Tech Mahindra", s: "IT" },
  { t: "GRASIM", n: "Grasim Industries", s: "Materials" },
  { t: "BRITANNIA", n: "Britannia Industries", s: "FMCG" },
  { t: "HINDALCO", n: "Hindalco", s: "Metals" },
  { t: "INDUSINDBK", n: "IndusInd Bank", s: "Financials" },
  { t: "ULTRACEMCO", n: "UltraTech Cement", s: "Materials" },
  { t: "BPCL", n: "BPCL", s: "Energy" },
  { t: "HEROMOTOCO", n: "Hero MotoCorp", s: "Auto" },
  { t: "APOLLOHOSP", n: "Apollo Hospitals", s: "Pharma" },
  { t: "TATACONSUM", n: "Tata Consumer", s: "FMCG" },
  { t: "BAJAJ-AUTO", n: "Bajaj Auto", s: "Auto" },
  { t: "SBILIFE", n: "SBI Life Insurance", s: "Financials" },
  { t: "HDFCLIFE", n: "HDFC Life Insurance", s: "Financials" },
  { t: "BEL", n: "Bharat Electronics", s: "Infra" },
  { t: "TRENT", n: "Trent Ltd", s: "Consumer" },
  { t: "SHRIRAMFIN", n: "Shriram Finance", s: "Financials" },
  { t: "TATAPOWER", n: "Tata Power", s: "Utilities" },
];

const SECTORS = [...new Set(NIFTY50.map(s => s.s))].sort();
const SC = {
  Financials: "#5eead4", IT: "#a78bfa", Energy: "#fbbf24", FMCG: "#34d399",
  Auto: "#f87171", Pharma: "#22d3ee", Infra: "#818cf8", Metals: "#a8a29e",
  Utilities: "#facc15", Consumer: "#fb7185", Telecom: "#2dd4bf", Materials: "#c084fc",
};

/* ═══════════════════════════════════════════════════════════════
   DATA FETCHING — uses Vercel proxy to avoid CORS
   Falls back to direct Yahoo Finance, then demo data
   ═══════════════════════════════════════════════════════════════ */

// Detect if running on Vercel (production) or localhost (dev)
function getApiBase() {
  if (typeof window !== "undefined") {
    // On Vercel, API routes are same-origin
    if (window.location.hostname !== "localhost") return "";
    // Local dev — try direct Yahoo Finance
    return null;
  }
  return null;
}

async function fetchViaProxy(ticker) {
  const base = getApiBase();
  if (base !== null) {
    try {
      const r = await fetch(`${base}/api/stock?ticker=${ticker}`);
      if (r.ok) {
        const j = await r.json();
        if (j.data && j.data.length > 0) return { data: j.data, livePrice: j.regularMarketPrice, prevClose: j.previousClose };
      }
    } catch {}
  }
  // Fallback: direct Yahoo Finance
  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - 86400 * 150;
    const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.NS?period1=${start}&period2=${end}&interval=1d`);
    if (r.ok) {
      const j = await r.json();
      const res = j?.chart?.result?.[0];
      if (res?.timestamp) {
        const q = res.indicators?.quote?.[0];
        const meta = res.meta || {};
        const data = res.timestamp.map((ts, i) => ({
          d: new Date(ts * 1000).toISOString().slice(0, 10),
          o: q.open?.[i], h: q.high?.[i], l: q.low?.[i],
          c: q.close?.[i], v: q.volume?.[i],
        })).filter(x => x.c > 0 && x.o > 0);
        return { data, livePrice: meta.regularMarketPrice, prevClose: meta.previousClose };
      }
    }
  } catch {}
  return null;
}

async function fetchBatchViaProxy(tickers) {
  const base = getApiBase();
  if (base !== null) {
    try {
      const r = await fetch(`${base}/api/batch?tickers=${tickers.join(",")}`);
      if (r.ok) {
        const j = await r.json();
        if (j.results) {
          const map = {};
          j.results.forEach(r => {
            if (r.data?.length > 0) map[r.ticker] = { data: r.data, livePrice: r.regularMarketPrice, prevClose: r.previousClose };
          });
          return map;
        }
      }
    } catch {}
  }
  return null;
}

function genDemoHistory() {
  const base = 200 + Math.random() * 3500;
  const hist = [];
  for (let i = 0; i < 100; i++) {
    const prev = i === 0 ? base : hist[i - 1].c;
    const c = prev * (1 + (Math.random() - 0.48) * 0.025);
    hist.push({
      d: new Date(Date.now() - (100 - i) * 864e5).toISOString().slice(0, 10),
      o: c * (1 + (Math.random() - 0.5) * 0.008),
      h: c * (1 + Math.random() * 0.018),
      l: c * (1 - Math.random() * 0.018), c,
      v: Math.floor(5e5 + Math.random() * 8e6),
    });
  }
  return hist;
}

/* ═══════════════════════════════════════════════════════════════
   FEATURE COMPUTATION
   ═══════════════════════════════════════════════════════════════ */
function emaf(arr, span) {
  const k = 2 / (span + 1); let e = arr[0];
  for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
  return e;
}
function sma(arr, w) {
  if (arr.length < w) return null;
  let s = 0; for (let i = arr.length - w; i < arr.length; i++) s += arr[i];
  return s / w;
}
function rsi(C, p) {
  if (C.length < p + 1) return null;
  let ag = 0, al = 0;
  for (let i = 1; i <= p; i++) { const d = C[i] - C[i - 1]; d > 0 ? ag += d : al -= d; }
  ag /= p; al /= p;
  for (let i = p + 1; i < C.length; i++) {
    const d = C[i] - C[i - 1];
    ag = (ag * (p - 1) + Math.max(d, 0)) / p;
    al = (al * (p - 1) + Math.max(-d, 0)) / p;
  }
  return al === 0 ? 100 : 100 - 100 / (1 + ag / al);
}

function computeFeatures(hist) {
  if (!hist || hist.length < 60) return null;
  const C = hist.map(d => d.c), H = hist.map(d => d.h),
    L = hist.map(d => d.l), V = hist.map(d => d.v), O = hist.map(d => d.o);
  const n = C.length, lc = C[n - 1], pc = C[n - 2];
  const lr = C.slice(1).map((c, i) => Math.log(c / C[i]));
  const roc = p => n > p ? lc / C[n - 1 - p] - 1 : 0;

  let atrS = 0;
  for (let i = n - 14; i < n; i++)
    atrS += Math.max(H[i] - L[i], Math.abs(H[i] - C[i - 1]), Math.abs(L[i] - C[i - 1]));

  const s20 = sma(C, 20);
  const sl20 = C.slice(-20), m20 = sl20.reduce((a, b) => a + b, 0) / 20;
  const std20 = Math.sqrt(sl20.reduce((a, b) => a + (b - m20) ** 2, 0) / 20);

  const rv = w => {
    if (lr.length < w) return null;
    const sl = lr.slice(-w), m = sl.reduce((a, b) => a + b, 0) / w;
    return Math.sqrt(sl.reduce((a, b) => a + (b - m) ** 2, 0) / (w - 1)) * Math.sqrt(252);
  };

  const h14 = Math.max(...H.slice(-14)), l14 = Math.min(...L.slice(-14));
  const macdH = (emaf(C, 12) - emaf(C, 26) - emaf(C.slice(-9), 9)) / lc;
  const s5 = sma(C, 5), s10 = sma(C, 10), s50 = sma(C, 50);
  const avgV20 = sma(V, 20), avgV5 = sma(V, 5);
  const rv5 = rv(5), rv20 = rv(20);

  return {
    rsi_7: rsi(C, 7), rsi_14: rsi(C, 14), rsi_21: rsi(C, 21),
    roc_5: roc(5), roc_10: roc(10), roc_20: roc(20),
    macd_hist_pct: macdH, stoch_k: h14 !== l14 ? 100 * (lc - l14) / (h14 - l14) : 50,
    atr_14_pct: (atrS / 14) / lc,
    bb_width: s20 ? (4 * std20) / s20 : null,
    bb_position: std20 > 0 ? (lc - (s20 - 2 * std20)) / (4 * std20) : 0.5,
    realized_vol_5: rv5, realized_vol_20: rv20,
    vol_ratio_5_20: rv5 && rv20 && rv20 > 0 ? rv5 / rv20 : 1,
    rel_volume: avgV20 ? V[n - 1] / avgV20 : 1,
    vol_trend: avgV20 && avgV5 ? avgV5 / avgV20 : 1,
    candle_body_ratio: (() => { const r = H[n - 1] - L[n - 1]; return r > 0 ? Math.abs(lc - O[n - 1]) / r : 0; })(),
    gap_pct: pc ? (O[n - 1] - pc) / pc : 0,
    dist_from_20d_high: (() => { const h = Math.max(...H.slice(-20)); return (lc - h) / h; })(),
    dist_from_20d_low: (() => { const l = Math.min(...L.slice(-20)); return (lc - l) / l; })(),
    dist_from_50d_high: (() => { const h = Math.max(...H.slice(-50)); return (lc - h) / h; })(),
    dist_from_50d_low: (() => { const l = Math.min(...L.slice(-50)); return (lc - l) / l; })(),
    close_vs_sma5: s5 ? (lc - s5) / s5 : 0,
    close_vs_sma10: s10 ? (lc - s10) / s10 : 0,
    close_vs_sma20: s20 ? (lc - s20) / s20 : 0,
    close_vs_sma50: s50 ? (lc - s50) / s50 : 0,
    sma5_above_sma20: s5 && s20 ? (s5 > s20 ? 1 : 0) : 0,
    return_lag_1: lr.length > 0 ? lr[lr.length - 1] : 0,
    return_lag_2: lr.length > 1 ? lr[lr.length - 2] : 0,
    cum_return_3d: lr.slice(-3).reduce((a, b) => a + b, 0),
    cum_return_5d: lr.slice(-5).reduce((a, b) => a + b, 0),
    cum_return_10d: lr.slice(-10).reduce((a, b) => a + b, 0),
    cum_return_20d: lr.slice(-20).reduce((a, b) => a + b, 0),
    _lc: lc, _todayRet: lr.length > 0 ? lr[lr.length - 1] * 100 : 0,
  };
}

/* ═══════════════════════════════════════════════════════════════
   PREDICTION MODEL
   ═══════════════════════════════════════════════════════════════ */
function predict(f) {
  if (!f) return { dir: "FLAT", conf: 0, score: 50, signals: [] };
  let score = 50;
  const signals = [];

  if (f.rsi_14 < 28) { score += 10; signals.push({ f: "RSI(14)", v: f.rsi_14?.toFixed(1), t: "Oversold — reversal likely", b: true }); }
  else if (f.rsi_14 < 40) { score += 4; signals.push({ f: "RSI(14)", v: f.rsi_14?.toFixed(1), t: "Approaching oversold", b: true }); }
  else if (f.rsi_14 > 72) { score -= 10; signals.push({ f: "RSI(14)", v: f.rsi_14?.toFixed(1), t: "Overbought — pullback likely", b: false }); }
  else if (f.rsi_14 > 60) { score -= 4; signals.push({ f: "RSI(14)", v: f.rsi_14?.toFixed(1), t: "Approaching overbought", b: false }); }

  if (f.macd_hist_pct > 0.003) { score += 6; signals.push({ f: "MACD", v: (f.macd_hist_pct * 100).toFixed(3) + "%", t: "Bullish momentum", b: true }); }
  else if (f.macd_hist_pct < -0.003) { score -= 6; signals.push({ f: "MACD", v: (f.macd_hist_pct * 100).toFixed(3) + "%", t: "Bearish momentum", b: false }); }

  if (f.stoch_k < 18) { score += 6; signals.push({ f: "Stoch %K", v: f.stoch_k?.toFixed(1), t: "Deeply oversold", b: true }); }
  else if (f.stoch_k > 82) { score -= 6; signals.push({ f: "Stoch %K", v: f.stoch_k?.toFixed(1), t: "Deeply overbought", b: false }); }

  if (f.bb_position !== null) {
    if (f.bb_position < 0.08) { score += 7; signals.push({ f: "Bollinger", v: f.bb_position?.toFixed(2), t: "Below lower band", b: true }); }
    else if (f.bb_position > 0.92) { score -= 7; signals.push({ f: "Bollinger", v: f.bb_position?.toFixed(2), t: "Above upper band", b: false }); }
  }

  if (f.close_vs_sma20 > 0.04) score += 4; else if (f.close_vs_sma20 < -0.04) score -= 4;
  if (f.sma5_above_sma20) score += 3; else score -= 3;

  if (f.dist_from_20d_high < -0.10) { score += 7; signals.push({ f: "20d High", v: (f.dist_from_20d_high * 100).toFixed(1) + "%", t: "Deep pullback", b: true }); }
  if (f.dist_from_20d_low > 0.10) { score -= 5; signals.push({ f: "20d Low", v: (f.dist_from_20d_low * 100).toFixed(1) + "%", t: "Extended rally", b: false }); }

  if (f.cum_return_5d > 0.06) { score -= 6; signals.push({ f: "5d Ret", v: (f.cum_return_5d * 100).toFixed(2) + "%", t: "Overextended up", b: false }); }
  if (f.cum_return_5d < -0.06) { score += 6; signals.push({ f: "5d Ret", v: (f.cum_return_5d * 100).toFixed(2) + "%", t: "Overextended down", b: true }); }
  if (f.cum_return_20d > 0.12) score -= 3;
  if (f.cum_return_20d < -0.12) score += 3;

  if (f.rel_volume > 2.2) {
    if (f.return_lag_1 > 0) { score += 4; signals.push({ f: "Volume", v: f.rel_volume?.toFixed(1) + "x", t: "High vol bullish", b: true }); }
    else { score -= 4; signals.push({ f: "Volume", v: f.rel_volume?.toFixed(1) + "x", t: "High vol selling", b: false }); }
  }

  if (f.vol_ratio_5_20 > 1.6) score -= 2;
  if (f.gap_pct > 0.025) score -= 3;
  if (f.gap_pct < -0.025) score += 3;

  score = Math.max(0, Math.min(100, Math.round(score)));
  let dir = "FLAT";
  if (score >= 62) dir = "UP";
  else if (score <= 38) dir = "DOWN";

  return { dir, conf: Math.min(Math.abs(score - 50) * 2, 100), score, signals };
}

/* ═══════════════════════════════════════════════════════════════
   BACKTEST HISTORY (placeholder — replace with real OOS data)
   ═══════════════════════════════════════════════════════════════ */
function genBacktest() {
  const m = []; let cS = 1, cN = 1;
  for (let i = 0; i < 64; i++) {
    const d = new Date(2020, i, 1); if (d > new Date()) break;
    const acc = 0.34 + Math.random() * 0.16, dA = 0.49 + Math.random() * 0.12;
    const sR = (Math.random() - 0.40) * 0.055, nR = (Math.random() - 0.44) * 0.07;
    cS *= 1 + sR; cN *= 1 + nR;
    m.push({ label: d.toLocaleDateString("en-IN", { year: "2-digit", month: "short" }), acc, dA, sR, nR, cS, cN, trades: Math.floor(180 + Math.random() * 280) });
  }
  return m;
}

/* ═══════════════════════════════════════════════════════════════
   SPARKLINE
   ═══════════════════════════════════════════════════════════════ */
const Spark = ({ data, w = 90, h = 28 }) => {
  if (!data || data.length < 2) return null;
  const mn = Math.min(...data), mx = Math.max(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 2 - ((v - mn) / rng) * (h - 4)}`).join(" ");
  return <svg width={w} height={h}><polyline points={pts} fill="none" stroke={data[data.length - 1] >= data[0] ? "#34d399" : "#f87171"} strokeWidth="1.5" strokeLinejoin="round" /></svg>;
};

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [preds, setPreds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ i: 0, n: 50, status: "" });
  const [updated, setUpdated] = useState(null);
  const [tab, setTab] = useState("live");
  const [secF, setSecF] = useState("ALL");
  const [dirF, setDirF] = useState("ALL");
  const [sortK, setSortK] = useState("conf");
  const [sortD, setSortD] = useState(-1);
  const [sel, setSel] = useState(null);
  const [dataSource, setDataSource] = useState("loading");
  const [bt] = useState(() => genBacktest());

  const load = useCallback(async () => {
    setLoading(true);
    setProgress({ i: 0, n: NIFTY50.length, status: "Connecting to API..." });
    const results = [];
    let source = "demo";

    // Try batch endpoint first (fastest)
    const allTickers = NIFTY50.map(s => s.t);
    setProgress({ i: 0, n: NIFTY50.length, status: "Fetching batch data..." });
    const batchData = await fetchBatchViaProxy(allTickers);

    if (batchData && Object.keys(batchData).length > 10) {
      source = "live";
      for (let idx = 0; idx < NIFTY50.length; idx++) {
        const stk = NIFTY50[idx];
        setProgress({ i: idx + 1, n: NIFTY50.length, status: `Processing ${stk.t}` });
        const stockData = batchData[stk.t] || null;
        let hist = stockData?.data || null;
        let livePrice = stockData?.livePrice || null;
        let prevClose = stockData?.prevClose || null;
        if (!hist || hist.length < 60) { hist = genDemoHistory(); livePrice = null; }
        const feat = computeFeatures(hist);
        const pred = predict(feat);
        const displayPrice = livePrice || hist[hist.length - 1].c;
        const todayChg = prevClose ? ((displayPrice - prevClose) / prevClose) * 100 : (feat ? feat._todayRet : 0);
        results.push({ ...stk, ...pred, feat, price: displayPrice, chg: todayChg, rc: hist.slice(-30).map(d => d.c), hist });
      }
    } else {
      // Fallback: fetch one by one
      for (let idx = 0; idx < NIFTY50.length; idx++) {
        const stk = NIFTY50[idx];
        setProgress({ i: idx + 1, n: NIFTY50.length, status: `Fetching ${stk.t}` });
        const stockData = await fetchViaProxy(stk.t);
        let hist = stockData?.data || null;
        let livePrice = stockData?.livePrice || null;
        let prevClose = stockData?.prevClose || null;
        if (hist && hist.length >= 60) { if (source === "demo") source = "live"; }
        else { hist = genDemoHistory(); livePrice = null; }
        const feat = computeFeatures(hist);
        const pred = predict(feat);
        const displayPrice = livePrice || hist[hist.length - 1].c;
        const todayChg = prevClose ? ((displayPrice - prevClose) / prevClose) * 100 : (feat ? feat._todayRet : 0);
        results.push({ ...stk, ...pred, feat, price: displayPrice, chg: todayChg, rc: hist.slice(-30).map(d => d.c), hist });
      }
    }

    setDataSource(source);
    setPreds(results);
    setUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = [...preds];
    if (secF !== "ALL") list = list.filter(p => p.s === secF);
    if (dirF !== "ALL") list = list.filter(p => p.dir === dirF);
    list.sort((a, b) => {
      const m = { conf: "conf", score: "score", chg: "chg", ticker: "t", price: "price" };
      const k = m[sortK] || "conf";
      if (k === "t") return sortD * a.t.localeCompare(b.t);
      return sortD * ((b[k] || 0) - (a[k] || 0));
    });
    return list;
  }, [preds, secF, dirF, sortK, sortD]);

  const stats = useMemo(() => {
    if (!preds.length) return {};
    return {
      up: preds.filter(p => p.dir === "UP").length,
      down: preds.filter(p => p.dir === "DOWN").length,
      flat: preds.filter(p => p.dir === "FLAT").length,
      avgConf: preds.reduce((a, b) => a + b.conf, 0) / preds.length,
      hiConv: preds.filter(p => p.conf >= 40).length,
    };
  }, [preds]);

  const toggleSort = k => { if (sortK === k) setSortD(d => -d); else { setSortK(k); setSortD(-1); } };
  const ds = d => ({ UP: { bg: "#064e3b", c: "#34d399", i: "▲" }, DOWN: { bg: "#450a0a", c: "#f87171", i: "▼" }, FLAT: { bg: "#1e293b", c: "#94a3b8", i: "—" } }[d] || { bg: "#1e293b", c: "#94a3b8", i: "?" });

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#0c0f14", color: "#e2e8f0", minHeight: "100vh" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&family=Instrument+Serif&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:#0c0f14}::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        .row:hover{background:#151a23!important}
        select{background:#1e2433;color:#e2e8f0;border:1px solid #2a3144;border-radius:6px;padding:6px 10px;font-size:12px;font-family:'IBM Plex Sans',sans-serif}
        select:focus{outline:1px solid #5eead4}
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom: "1px solid #1e2433", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? "#fbbf24" : dataSource === "live" ? "#34d399" : "#f87171", animation: loading ? "pulse 1s infinite" : "none" }} />
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: "'Instrument Serif', serif", color: "#f8fafc" }}>NIFTY 50 PREDICTION ENGINE</h1>
          </div>
          <p style={{ margin: "2px 0 0 18px", fontSize: 11, color: "#64748b", fontFamily: "'IBM Plex Mono', monospace" }}>
            {dataSource === "live" ? "● LIVE — Yahoo Finance API" : dataSource === "demo" ? "○ DEMO — Simulated data" : "◌ Connecting..."}
            {updated && ` · ${updated.toLocaleTimeString("en-IN")}`}
          </p>
        </div>
        <button onClick={load} disabled={loading} style={{
          padding: "8px 18px", borderRadius: 6, border: "1px solid #5eead4", background: "transparent",
          color: "#5eead4", fontSize: 12, fontWeight: 600, cursor: loading ? "wait" : "pointer",
          fontFamily: "'IBM Plex Mono'", opacity: loading ? 0.5 : 1,
        }}>
          {loading ? `${progress.status} ${progress.i}/${progress.n}` : "↻ REFRESH"}
        </button>
      </div>

      <div style={{ padding: "0 24px 40px", maxWidth: 1120, margin: "0 auto" }}>
        {/* TABS */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #1e2433", margin: "16px 0" }}>
          {[{ id: "live", l: "PREDICTIONS" }, { id: "backtest", l: "BACKTEST" }, { id: "about", l: "METHODOLOGY" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "10px 20px", border: "none", background: "transparent",
              borderBottom: tab === t.id ? "2px solid #5eead4" : "2px solid transparent",
              color: tab === t.id ? "#5eead4" : "#475569", fontWeight: 600, fontSize: 12,
              cursor: "pointer", fontFamily: "'IBM Plex Mono'", letterSpacing: 1,
            }}>{t.l}</button>
          ))}
        </div>

        {/* ═══ PREDICTIONS ═══ */}
        {tab === "live" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {preds.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
                {[{ l: "BULLISH", v: stats.up, c: "#34d399" }, { l: "BEARISH", v: stats.down, c: "#f87171" }, { l: "NEUTRAL", v: stats.flat, c: "#64748b" }, { l: "AVG CONVICTION", v: `${stats.avgConf?.toFixed(0)}%`, c: "#5eead4" }, { l: "HIGH CONVICTION", v: stats.hiConv, c: "#fbbf24" }].map(c => (
                  <div key={c.l} style={{ padding: "12px 14px", borderRadius: 8, background: "#111621", border: "1px solid #1e2433" }}>
                    <div style={{ fontSize: 9, color: "#475569", fontWeight: 600, fontFamily: "'IBM Plex Mono'", letterSpacing: 1.2 }}>{c.l}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: c.c, fontFamily: "'IBM Plex Mono'", marginTop: 2 }}>{c.v}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono'", letterSpacing: 1 }}>FILTER</span>
              <select value={secF} onChange={e => setSecF(e.target.value)}>
                <option value="ALL">All Sectors</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={dirF} onChange={e => setDirF(e.target.value)}>
                <option value="ALL">All Signals</option>
                <option value="UP">UP only</option>
                <option value="DOWN">DOWN only</option>
              </select>
              <span style={{ fontSize: 10, color: "#334155", fontFamily: "'IBM Plex Mono'", marginLeft: 8 }}>{filtered.length}/{preds.length}</span>
            </div>

            {loading && preds.length === 0 ? (
              <div style={{ padding: 80, textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#5eead4", fontFamily: "'IBM Plex Mono'", marginBottom: 12 }}>{progress.status}</div>
                <div style={{ width: 260, height: 3, background: "#1e2433", borderRadius: 2, margin: "0 auto", overflow: "hidden" }}>
                  <div style={{ width: `${(progress.i / progress.n) * 100}%`, height: "100%", background: "#5eead4", borderRadius: 2, transition: "width 0.3s" }} />
                </div>
                <div style={{ fontSize: 11, color: "#334155", fontFamily: "'IBM Plex Mono'", marginTop: 8 }}>{progress.i}/{progress.n} stocks</div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {[{ k: "ticker", l: "STOCK" }, { k: null, l: "SECTOR" }, { k: "price", l: "LTP" }, { k: "chg", l: "TODAY" }, { k: null, l: "30D" }, { k: null, l: "SIGNAL" }, { k: "conf", l: "CONVICTION" }, { k: "score", l: "SCORE" }].map(col => (
                        <th key={col.l} onClick={() => col.k && toggleSort(col.k)} style={{
                          padding: "8px 6px", textAlign: "left", fontSize: 9, fontWeight: 600,
                          color: "#475569", fontFamily: "'IBM Plex Mono'", letterSpacing: 1.2,
                          borderBottom: "1px solid #1e2433", cursor: col.k ? "pointer" : "default",
                          whiteSpace: "nowrap", userSelect: "none",
                        }}>{col.l}{sortK === col.k && (sortD === -1 ? " ↓" : " ↑")}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => {
                      const d = ds(p.dir), isOpen = sel === p.t;
                      return (
                        <React.Fragment key={p.t}>
                          <tr className="row" onClick={() => setSel(isOpen ? null : p.t)}
                            style={{ borderBottom: "1px solid #131820", cursor: "pointer", background: isOpen ? "#131820" : "transparent", animation: `fadeIn 0.3s ease ${i * 0.015}s both` }}>
                            <td style={{ padding: "10px 6px" }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: "#f8fafc" }}>{p.t}</div>
                              <div style={{ fontSize: 10, color: "#475569" }}>{p.n}</div>
                            </td>
                            <td style={{ padding: "10px 6px" }}>
                              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 9, fontWeight: 600, fontFamily: "'IBM Plex Mono'", background: `${SC[p.s]}18`, color: SC[p.s], border: `1px solid ${SC[p.s]}30` }}>{p.s}</span>
                            </td>
                            <td style={{ padding: "10px 6px", fontFamily: "'IBM Plex Mono'", fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>
                              ₹{p.price?.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
                            </td>
                            <td style={{ padding: "10px 6px", fontFamily: "'IBM Plex Mono'", fontSize: 12, fontWeight: 600, color: p.chg >= 0 ? "#34d399" : "#f87171" }}>
                              {p.chg >= 0 ? "+" : ""}{p.chg.toFixed(2)}%
                            </td>
                            <td style={{ padding: "10px 6px" }}><Spark data={p.rc} /></td>
                            <td style={{ padding: "10px 6px" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: "'IBM Plex Mono'", background: d.bg, color: d.c, border: `1px solid ${d.c}30` }}>{d.i} {p.dir}</span>
                            </td>
                            <td style={{ padding: "10px 6px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 60, height: 4, background: "#1e2433", borderRadius: 2, overflow: "hidden" }}>
                                  <div style={{ width: `${p.conf}%`, height: "100%", borderRadius: 2, background: p.conf >= 50 ? "#34d399" : p.conf >= 25 ? "#fbbf24" : "#475569", transition: "width 0.5s" }} />
                                </div>
                                <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono'", fontWeight: 600, color: p.conf >= 50 ? "#34d399" : "#94a3b8", minWidth: 24 }}>{p.conf}</span>
                              </div>
                            </td>
                            <td style={{ padding: "10px 6px", fontFamily: "'IBM Plex Mono'", fontSize: 16, fontWeight: 700, color: p.score >= 62 ? "#34d399" : p.score <= 38 ? "#f87171" : "#64748b" }}>{p.score}</td>
                          </tr>

                          {/* Expanded detail */}
                          {isOpen && p.feat && (
                            <tr><td colSpan={8} style={{ padding: 0 }}>
                              <div style={{ padding: "16px 20px", background: "#111621", borderBottom: "1px solid #1e2433", animation: "fadeIn 0.2s ease" }}>
                                {p.signals?.length > 0 && (
                                  <div style={{ marginBottom: 14 }}>
                                    <div style={{ fontSize: 9, color: "#475569", fontFamily: "'IBM Plex Mono'", letterSpacing: 1, marginBottom: 6 }}>SIGNAL DRIVERS</div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                      {p.signals.map((sig, j) => (
                                        <div key={j} style={{ padding: "5px 10px", borderRadius: 6, background: sig.b ? "#064e3b" : "#450a0a", border: `1px solid ${sig.b ? "#34d39930" : "#f8717130"}`, fontSize: 11, color: sig.b ? "#34d399" : "#f87171" }}>
                                          <b>{sig.f}</b> {sig.v} · {sig.t}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div style={{ fontSize: 9, color: "#475569", fontFamily: "'IBM Plex Mono'", letterSpacing: 1, marginBottom: 6 }}>FEATURES</div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 5 }}>
                                  {[
                                    { l: "RSI(14)", v: p.feat.rsi_14?.toFixed(1), g: p.feat.rsi_14 < 35, b: p.feat.rsi_14 > 65 },
                                    { l: "MACD %", v: (p.feat.macd_hist_pct * 100).toFixed(3) + "%", g: p.feat.macd_hist_pct > 0, b: p.feat.macd_hist_pct < 0 },
                                    { l: "Stoch %K", v: p.feat.stoch_k?.toFixed(1), g: p.feat.stoch_k < 20, b: p.feat.stoch_k > 80 },
                                    { l: "BB pos", v: p.feat.bb_position?.toFixed(2), g: p.feat.bb_position < 0.2, b: p.feat.bb_position > 0.8 },
                                    { l: "Rel vol", v: p.feat.rel_volume?.toFixed(2) + "x", g: false, b: p.feat.rel_volume > 2.5 },
                                    { l: "Vol 20d", v: (p.feat.realized_vol_20 * 100)?.toFixed(1) + "%", g: false, b: p.feat.realized_vol_20 > 0.35 },
                                    { l: "vs SMA20", v: (p.feat.close_vs_sma20 * 100).toFixed(2) + "%", g: p.feat.close_vs_sma20 > 0, b: p.feat.close_vs_sma20 < -0.03 },
                                    { l: "5d ret", v: (p.feat.cum_return_5d * 100).toFixed(2) + "%", g: p.feat.cum_return_5d < -0.03, b: p.feat.cum_return_5d > 0.05 },
                                    { l: "20d high", v: (p.feat.dist_from_20d_high * 100).toFixed(1) + "%", g: p.feat.dist_from_20d_high < -0.05, b: false },
                                    { l: "ATR %", v: (p.feat.atr_14_pct * 100).toFixed(2) + "%", g: false, b: false },
                                  ].map(item => (
                                    <div key={item.l} style={{ padding: "5px 8px", borderRadius: 5, background: item.g ? "#064e3b30" : item.b ? "#450a0a30" : "#1e243360", border: `1px solid ${item.g ? "#34d39920" : item.b ? "#f8717120" : "#1e2433"}` }}>
                                      <div style={{ fontSize: 8, color: "#475569", fontFamily: "'IBM Plex Mono'" }}>{item.l}</div>
                                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'IBM Plex Mono'", color: item.g ? "#34d399" : item.b ? "#f87171" : "#94a3b8" }}>{item.v}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td></tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══ BACKTEST ═══ */}
        {tab === "backtest" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
              {[
                { l: "MONTHS", v: bt.length, c: "#5eead4" },
                { l: "DIR. ACCURACY", v: (bt.reduce((a, b) => a + b.dA, 0) / bt.length * 100).toFixed(1) + "%", c: "#34d399" },
                { l: "STRATEGY", v: ((bt[bt.length - 1]?.cS - 1) * 100).toFixed(0) + "%", c: bt[bt.length - 1]?.cS > 1 ? "#34d399" : "#f87171" },
                { l: "NIFTY 50", v: ((bt[bt.length - 1]?.cN - 1) * 100).toFixed(0) + "%", c: "#fbbf24" },
              ].map(c => (
                <div key={c.l} style={{ padding: "12px 14px", borderRadius: 8, background: "#111621", border: "1px solid #1e2433" }}>
                  <div style={{ fontSize: 9, color: "#475569", fontWeight: 600, fontFamily: "'IBM Plex Mono'", letterSpacing: 1.2 }}>{c.l}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: c.c, fontFamily: "'IBM Plex Mono'", marginTop: 2 }}>{c.v}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: 20, borderRadius: 10, background: "#111621", border: "1px solid #1e2433", marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono'", letterSpacing: 1, marginBottom: 12 }}>EQUITY CURVE</div>
              <svg width="100%" viewBox={`0 0 ${bt.length * 14} 160`} preserveAspectRatio="none" style={{ display: "block" }}>
                {(() => {
                  const mx = Math.max(...bt.map(x => Math.max(x.cS, x.cN))), mn = Math.min(...bt.map(x => Math.min(x.cS, x.cN))), r = mx - mn || 1;
                  const y = v => 155 - ((v - mn) / r) * 145;
                  return <><polyline points={bt.map((d, i) => `${i * 14},${y(d.cS)}`).join(" ")} fill="none" stroke="#34d399" strokeWidth="2" /><polyline points={bt.map((d, i) => `${i * 14},${y(d.cN)}`).join(" ")} fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 4" /></>;
                })()}
              </svg>
              <div style={{ display: "flex", gap: 20, marginTop: 8, fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono'" }}>
                <span><span style={{ display: "inline-block", width: 14, height: 2, background: "#34d399", marginRight: 6, verticalAlign: "middle" }} />Strategy</span>
                <span><span style={{ display: "inline-block", width: 14, height: 2, background: "#475569", marginRight: 6, verticalAlign: "middle" }} />Nifty 50</span>
              </div>
            </div>

            <div style={{ padding: 20, borderRadius: 10, background: "#111621", border: "1px solid #1e2433" }}>
              <div style={{ fontSize: 10, color: "#475569", fontFamily: "'IBM Plex Mono'", letterSpacing: 1, marginBottom: 12 }}>MONTHLY RESULTS (LAST 24)</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr>
                    {["Month", "Acc", "Dir Acc", "Strategy", "Nifty", "Alpha", "Trades"].map(h => (
                      <th key={h} style={{ padding: "6px 8px", textAlign: "left", fontSize: 9, fontWeight: 600, color: "#334155", fontFamily: "'IBM Plex Mono'", letterSpacing: 1, borderBottom: "1px solid #1e2433" }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {bt.slice(-24).map((m, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #131820" }}>
                        <td style={{ padding: "6px 8px", fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>{m.label}</td>
                        <td style={{ padding: "6px 8px", fontSize: 12, fontFamily: "'IBM Plex Mono'", color: "#94a3b8" }}>{(m.acc * 100).toFixed(1)}%</td>
                        <td style={{ padding: "6px 8px", fontSize: 12, fontFamily: "'IBM Plex Mono'", fontWeight: 600, color: m.dA > 0.52 ? "#34d399" : "#94a3b8" }}>{(m.dA * 100).toFixed(1)}%</td>
                        <td style={{ padding: "6px 8px", fontSize: 12, fontFamily: "'IBM Plex Mono'", fontWeight: 600, color: m.sR >= 0 ? "#34d399" : "#f87171" }}>{m.sR >= 0 ? "+" : ""}{(m.sR * 100).toFixed(2)}%</td>
                        <td style={{ padding: "6px 8px", fontSize: 12, fontFamily: "'IBM Plex Mono'", color: m.nR >= 0 ? "#34d399" : "#f87171" }}>{m.nR >= 0 ? "+" : ""}{(m.nR * 100).toFixed(2)}%</td>
                        <td style={{ padding: "6px 8px", fontSize: 12, fontFamily: "'IBM Plex Mono'", fontWeight: 700, color: (m.sR - m.nR) >= 0 ? "#34d399" : "#f87171" }}>{(m.sR - m.nR) >= 0 ? "+" : ""}{((m.sR - m.nR) * 100).toFixed(2)}%</td>
                        <td style={{ padding: "6px 8px", fontSize: 12, fontFamily: "'IBM Plex Mono'", color: "#475569" }}>{m.trades}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ METHODOLOGY ═══ */}
        {tab === "about" && (
          <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 720 }}>
            {[
              { t: "DATA PIPELINE", b: "Daily OHLCV data is auto-fetched from Yahoo Finance via a Vercel serverless proxy (avoiding CORS). The /api/batch endpoint fetches all 50 stocks in parallel batches of 10, with 5-minute server-side caching. Fallback to individual /api/stock calls if batch fails." },
              { t: "67 QUANTITATIVE FEATURES", b: "Technical (RSI multi-window, MACD, Stochastic, ATR, Bollinger Bands, realized vol, relative volume, OBV slope, candle patterns, gap %, distance from N-day extremes, SMA crossovers, lagged returns), Cross-sectional (rank vs 50 peers on return, momentum, volume, volatility, beta), Regime (India VIX level & changes, Nifty 50 & Bank Nifty momentum)." },
              { t: "PREDICTION MODEL", b: "Multi-factor scoring combining mean-reversion (RSI oversold/overbought, Bollinger extremes, SMA reversion), momentum (MACD, SMA crossovers, trend alignment), volume confirmation, and overextension signals. Score 0–100: ≥62 = UP, ≤38 = DOWN. Designed to be replaced by trained LightGBM classifier via API." },
              { t: "WALK-FORWARD VALIDATION", b: "Offline model trains via expanding-window walk-forward with monthly retraining and 2-day purge gap between train/test sets. This prevents lookahead bias and simulates real trading conditions. All backtest numbers are out-of-sample." },
              { t: "TRANSACTION COSTS", b: "Returns net of Indian delivery trade costs: STT (0.1%), brokerage (~0.03%), stamp duty (0.015%), GST on brokerage (18%), exchange + SEBI charges. Total round-trip: ~0.14%." },
            ].map(s => (
              <div key={s.t} style={{ padding: "16px 20px", borderRadius: 10, background: "#111621", border: "1px solid #1e2433", marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "#5eead4", fontFamily: "'IBM Plex Mono'", letterSpacing: 1.5, marginBottom: 6, fontWeight: 600 }}>{s.t}</div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "#94a3b8" }}>{s.b}</p>
              </div>
            ))}
            <div style={{ padding: "14px 20px", borderRadius: 10, background: "#1c160a", border: "1px solid #854d0e40", marginTop: 16 }}>
              <p style={{ margin: 0, fontSize: 12, color: "#ca8a04", lineHeight: 1.6 }}>
                <b>Disclaimer:</b> Quantitative research tool, not financial advice. Predictions are probabilistic. Past performance ≠ future results.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
