// Vercel Serverless — Stock data proxy
// /api/stock?ticker=RELIANCE
// Gets current price from Google Finance (always split-adjusted)
// Gets historical OHLCV from Yahoo Finance (adjusted close)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "Missing ticker" });

  // 1. Get current price from Google Finance page
  let currentPrice = null, prevClose = null, dayChange = null, dayChangePct = null;
  try {
    const gUrl = `https://www.google.com/finance/quote/${encodeURIComponent(ticker)}:NSE`;
    const gRes = await fetch(gUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    if (gRes.ok) {
      const html = await gRes.text();
      // Extract price from data-last-price attribute
      const priceMatch = html.match(/data-last-price="([^"]+)"/);
      if (priceMatch) currentPrice = parseFloat(priceMatch[1]);
      // Extract previous close
      const prevMatch = html.match(/Previous close.*?>([\d,]+\.\d+)</s);
      if (prevMatch) prevClose = parseFloat(prevMatch[1].replace(/,/g, ""));
      // Extract change
      const changeMatch = html.match(/data-currency-code="INR"[^>]*>.*?data-last-price="[^"]*"[^>]*>.*?([\-+][\d.]+).*?([\-+][\d.]+%)/s);
      if (!prevClose && currentPrice) {
        // Try to calculate from the page
        const chgMatch = html.match(/data-last-price="[\d.]+"[^>]*>[^<]*<\/div>\s*<div[^>]*><span[^>]*>([\d,.]+)<\/span>/s);
      }
    }
  } catch {}

  // 2. Get historical data from Yahoo Finance
  let history = [];
  const yfTicker = `${ticker}.NS`;
  const end = Math.floor(Date.now() / 1000);
  const start = end - 86400 * 200;

  for (const host of ["query1", "query2"]) {
    try {
      const url = `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfTicker)}?period1=${start}&period2=${end}&interval=1d&includeAdjustedClose=true`;
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      });
      if (!r.ok) continue;
      const j = await r.json();
      const result = j?.chart?.result?.[0];
      if (!result?.timestamp) continue;
      const q = result.indicators?.quote?.[0];
      const adjArr = result.indicators?.adjclose?.[0]?.adjclose;
      if (!q) continue;

      const meta = result.meta || {};

      // If we didn't get price from Google, use Yahoo meta
      if (!currentPrice) currentPrice = meta.regularMarketPrice;
      if (!prevClose) prevClose = meta.previousClose || meta.chartPreviousClose;

      // Build history using adjusted prices
      // But we need to scale so the LAST adjusted close matches currentPrice
      const rawHistory = result.timestamp.map((ts, i) => {
        const adjC = adjArr?.[i] ?? q.close?.[i];
        const rawC = q.close?.[i];
        const o = q.open?.[i];
        const h = q.high?.[i];
        const l = q.low?.[i];
        if (!adjC || !rawC || !o || adjC <= 0) return null;
        return { d: new Date(ts * 1000).toISOString().slice(0, 10), o, h, l, c: adjC, rawC, v: q.volume?.[i] || 0 };
      }).filter(Boolean);

      if (rawHistory.length > 0 && currentPrice) {
        // Scale factor: make last history close = currentPrice
        const lastAdjClose = rawHistory[rawHistory.length - 1].c;
        const scale = lastAdjClose > 0 ? currentPrice / lastAdjClose : 1;

        history = rawHistory.map(d => ({
          d: d.d,
          o: Math.round(d.o * (d.c / d.rawC) * scale * 100) / 100,
          h: Math.round(d.h * (d.c / d.rawC) * scale * 100) / 100,
          l: Math.round(d.l * (d.c / d.rawC) * scale * 100) / 100,
          c: Math.round(d.c * scale * 100) / 100,
          v: d.v,
        }));
      } else {
        history = rawHistory.map(d => ({
          d: d.d,
          o: Math.round(d.o * 100) / 100,
          h: Math.round(d.h * 100) / 100,
          l: Math.round(d.l * 100) / 100,
          c: Math.round(d.c * 100) / 100,
          v: d.v,
        }));
      }
      break;
    } catch { continue; }
  }

  // Calculate day change
  if (currentPrice && prevClose && prevClose > 0) {
    dayChange = Math.round((currentPrice - prevClose) * 100) / 100;
    dayChangePct = Math.round(((currentPrice - prevClose) / prevClose) * 10000) / 100;
  }

  return res.status(200).json({
    ticker,
    currentPrice,
    prevClose,
    dayChange,
    dayChangePct,
    count: history.length,
    data: history,
  });
}
