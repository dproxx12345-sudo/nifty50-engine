// /api/stock?ticker=RELIANCE
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  const { ticker } = req.query;
  if (!ticker) return res.status(400).json({ error: "Missing ticker" });

  const yfTicker = `${ticker}.NS`;
  const end = Math.floor(Date.now() / 1000);
  const start = end - 86400 * 200;

  for (const host of ["query1", "query2"]) {
    try {
      const r = await fetch(
        `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfTicker)}?period1=${start}&period2=${end}&interval=1d&includeAdjustedClose=true`,
        { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" } }
      );
      if (!r.ok) continue;
      const j = await r.json();
      const result = j?.chart?.result?.[0];
      if (!result?.timestamp) continue;
      const q = result.indicators?.quote?.[0];
      const adj = result.indicators?.adjclose?.[0]?.adjclose;
      if (!q) continue;
      const meta = result.meta || {};

      // meta.regularMarketPrice and meta.previousClose are ALWAYS correct
      // They reflect current post-split prices
      const currentPrice = meta.regularMarketPrice;
      const prevClose = meta.previousClose || meta.chartPreviousClose;
      const dayChangePct = (currentPrice && prevClose && prevClose > 0)
        ? Math.round(((currentPrice - prevClose) / prevClose) * 10000) / 100
        : null;

      // History: use adjusted close for feature computation
      // These may look different from actual prices for split stocks
      // but RSI/MACD/momentum features work correctly on adjusted data
      const history = result.timestamp.map((ts, i) => {
        const c = adj?.[i] ?? q.close?.[i];
        const o = q.open?.[i];
        if (!c || !o || c <= 0) return null;
        return {
          d: new Date(ts * 1000).toISOString().slice(0, 10),
          o: Math.round(o * 100) / 100,
          h: Math.round((q.high?.[i] || o) * 100) / 100,
          l: Math.round((q.low?.[i] || o) * 100) / 100,
          c: Math.round(c * 100) / 100,
          v: q.volume?.[i] || 0,
        };
      }).filter(Boolean);

      return res.status(200).json({
        ticker, currentPrice, prevClose, dayChangePct,
        count: history.length, data: history,
      });
    } catch { continue; }
  }
  return res.status(502).json({ error: `Failed for ${ticker}` });
}
