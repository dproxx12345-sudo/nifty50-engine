// Vercel Serverless Function — Yahoo Finance CORS Proxy
// Endpoint: /api/stock?ticker=RELIANCE
// Returns: JSON with OHLCV history from Yahoo Finance

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  const { ticker } = req.query;
  if (!ticker) {
    return res.status(400).json({ error: "Missing ?ticker= parameter" });
  }

  const yfTicker = ticker.endsWith(".NS") ? ticker : `${ticker}.NS`;
  const end = Math.floor(Date.now() / 1000);
  const start = end - 86400 * 150; // ~150 days

  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${yfTicker}?period1=${start}&period2=${end}&interval=1d`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${yfTicker}?period1=${start}&period2=${end}&interval=1d`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) continue;

      const data = await response.json();
      const result = data?.chart?.result?.[0];

      if (!result?.timestamp) continue;

      const q = result.indicators?.quote?.[0];
      if (!q) continue;

      const ohlcv = result.timestamp
        .map((ts, i) => ({
          d: new Date(ts * 1000).toISOString().slice(0, 10),
          o: q.open?.[i],
          h: q.high?.[i],
          l: q.low?.[i],
          c: q.close?.[i],
          v: q.volume?.[i],
        }))
        .filter((x) => x.c > 0 && x.o > 0);

      return res.status(200).json({
        ticker: ticker,
        count: ohlcv.length,
        data: ohlcv,
      });
    } catch (err) {
      continue;
    }
  }

  return res.status(502).json({
    error: `Failed to fetch data for ${ticker}`,
    ticker: ticker,
  });
}
