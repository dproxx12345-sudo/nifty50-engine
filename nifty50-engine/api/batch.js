// /api/batch?tickers=RELIANCE,TCS,HDFCBANK
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  const { tickers } = req.query;
  if (!tickers) return res.status(400).json({ error: "Missing tickers" });
  const list = tickers.split(",").map(t => t.trim()).filter(Boolean).slice(0, 55);
  const end = Math.floor(Date.now() / 1000);
  const start = end - 86400 * 200;

  async function fetchOne(ticker) {
    let currentPrice = null, prevClose = null;

    // Google Finance
    try {
      const r = await fetch(`https://www.google.com/finance/quote/${encodeURIComponent(ticker)}:NSE`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
      });
      if (r.ok) {
        const html = await r.text();
        const pm = html.match(/data-last-price="([^"]+)"/);
        if (pm) currentPrice = parseFloat(pm[1]);
        const pcm = html.match(/data-previous-close="([^"]+)"/);
        if (pcm) prevClose = parseFloat(pcm[1]);
        if (!prevClose) {
          const pcm2 = html.match(/Previous close[\s\S]*?>([\d,]+\.\d+)/);
          if (pcm2) prevClose = parseFloat(pcm2[1].replace(/,/g, ""));
        }
      }
    } catch {}

    // Yahoo Finance for history
    const yfTicker = `${ticker}.NS`;
    for (const host of ["query1", "query2"]) {
      try {
        const r = await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfTicker)}?period1=${start}&period2=${end}&interval=1d&includeAdjustedClose=true`, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        });
        if (!r.ok) continue;
        const j = await r.json();
        const result = j?.chart?.result?.[0];
        if (!result?.timestamp) continue;
        const q = result.indicators?.quote?.[0];
        const adj = result.indicators?.adjclose?.[0]?.adjclose;
        if (!q) continue;
        const meta = result.meta || {};
        if (!currentPrice) currentPrice = meta.regularMarketPrice;
        if (!prevClose) prevClose = meta.previousClose;

        const data = result.timestamp.map((ts, i) => {
          const c = adj?.[i] ?? q.close?.[i];
          const o = q.open?.[i];
          if (!c || !o || c <= 0) return null;
          return { d: new Date(ts * 1000).toISOString().slice(0, 10), o: Math.round(o*100)/100, h: Math.round((q.high?.[i]||o)*100)/100, l: Math.round((q.low?.[i]||o)*100)/100, c: Math.round(c*100)/100, v: q.volume?.[i]||0 };
        }).filter(Boolean);

        const dayChangePct = (currentPrice && prevClose && prevClose > 0)
          ? Math.round(((currentPrice - prevClose) / prevClose) * 10000) / 100 : null;

        return { ticker, currentPrice, prevClose, dayChangePct, data };
      } catch { continue; }
    }
    return { ticker, currentPrice, prevClose, dayChangePct: null, data: [] };
  }

  const results = [];
  for (let i = 0; i < list.length; i += 5) {
    const batch = list.slice(i, i + 5);
    results.push(...await Promise.all(batch.map(fetchOne)));
  }

  return res.status(200).json({ count: results.length, fetched: results.filter(r => r.data?.length > 0).length, results });
}
