// Vercel Serverless Function — Batch Yahoo Finance fetch
// Endpoint: /api/batch?tickers=RELIANCE,TCS,HDFCBANK
// Returns: JSON with OHLCV for all requested tickers

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  const { tickers } = req.query;
  if (!tickers) {
    return res.status(400).json({ error: "Missing ?tickers= parameter" });
  }

  const tickerList = tickers.split(",").map((t) => t.trim()).filter(Boolean);
  if (tickerList.length > 55) {
    return res.status(400).json({ error: "Maximum 55 tickers per request" });
  }

  const end = Math.floor(Date.now() / 1000);
  const start = end - 86400 * 150;

  async function fetchOne(ticker) {
    const yfTicker = ticker.endsWith(".NS") ? ticker : `${ticker}.NS`;
    const urls = [
      `https://query1.finance.yahoo.com/v8/finance/chart/${yfTicker}?period1=${start}&period2=${end}&interval=1d`,
      `https://query2.finance.yahoo.com/v8/finance/chart/${yfTicker}?period1=${start}&period2=${end}&interval=1d`,
    ];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (!response.ok) continue;

        const data = await response.json();
        const result = data?.chart?.result?.[0];
        if (!result?.timestamp) continue;

        const q = result.indicators?.quote?.[0];
        if (!q) continue;

        return {
          ticker,
          data: result.timestamp
            .map((ts, i) => ({
              d: new Date(ts * 1000).toISOString().slice(0, 10),
              o: q.open?.[i],
              h: q.high?.[i],
              l: q.low?.[i],
              c: q.close?.[i],
              v: q.volume?.[i],
            }))
            .filter((x) => x.c > 0 && x.o > 0),
        };
      } catch {
        continue;
      }
    }
    return { ticker, data: [], error: "Failed to fetch" };
  }

  // Fetch in parallel batches of 10 to avoid rate limits
  const results = [];
  for (let i = 0; i < tickerList.length; i += 10) {
    const batch = tickerList.slice(i, i + 10);
    const batchResults = await Promise.all(batch.map(fetchOne));
    results.push(...batchResults);
  }

  return res.status(200).json({
    count: results.length,
    fetched: results.filter((r) => r.data.length > 0).length,
    failed: results.filter((r) => r.data.length === 0).length,
    results,
  });
}
