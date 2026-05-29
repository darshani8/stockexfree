// Replaces the old AWS Lambda (Puppeteer scrape of Google Finance) with a free,
// no-key fetch of Yahoo Finance's public chart JSON. Runs on the Cloudflare Pages
// edge runtime. Output shape matches exactly what app/page.js expects.
export const runtime = "edge";

// Display symbol (shown in the ticker) -> Yahoo Finance symbol.
// NSE (India) tickers use the ".NS" suffix; BRK.B is "BRK-B" on Yahoo.
const STOCKS = [
  // India (NSE) -- Yahoo symbol uses the ".NS" suffix
  { symbol: "RELIANCE", yahoo: "RELIANCE.NS" },
  { symbol: "INFY", yahoo: "INFY.NS" },
  { symbol: "TCS", yahoo: "TCS.NS" },
  { symbol: "HDFCBANK", yahoo: "HDFCBANK.NS" },
  { symbol: "BHARTIARTL", yahoo: "BHARTIARTL.NS" },
  { symbol: "ITC", yahoo: "ITC.NS" },
  { symbol: "ICICIBANK", yahoo: "ICICIBANK.NS" },
  { symbol: "KOTAKBANK", yahoo: "KOTAKBANK.NS" },
  { symbol: "LT", yahoo: "LT.NS" },
  { symbol: "ADANIENT", yahoo: "ADANIENT.NS" },
  { symbol: "SBIN", yahoo: "SBIN.NS" },
  { symbol: "HINDUNILVR", yahoo: "HINDUNILVR.NS" },
  { symbol: "BAJFINANCE", yahoo: "BAJFINANCE.NS" },
  { symbol: "MARUTI", yahoo: "MARUTI.NS" },
  { symbol: "WIPRO", yahoo: "WIPRO.NS" },
  { symbol: "AXISBANK", yahoo: "AXISBANK.NS" },
  { symbol: "ASIANPAINT", yahoo: "ASIANPAINT.NS" },
  { symbol: "HCLTECH", yahoo: "HCLTECH.NS" },
  { symbol: "SUNPHARMA", yahoo: "SUNPHARMA.NS" },
  { symbol: "TITAN", yahoo: "TITAN.NS" },
  // US
  { symbol: "AAPL", yahoo: "AAPL" },
  { symbol: "MSFT", yahoo: "MSFT" },
  { symbol: "GOOGL", yahoo: "GOOGL" },
  { symbol: "TSLA", yahoo: "TSLA" },
  { symbol: "AMZN", yahoo: "AMZN" },
  { symbol: "META", yahoo: "META" },
  { symbol: "NVDA", yahoo: "NVDA" },
  { symbol: "NFLX", yahoo: "NFLX" },
  { symbol: "DIS", yahoo: "DIS" },
  { symbol: "BRK.B", yahoo: "BRK-B" },
  { symbol: "AMD", yahoo: "AMD" },
  { symbol: "INTC", yahoo: "INTC" },
  { symbol: "JPM", yahoo: "JPM" },
  { symbol: "V", yahoo: "V" },
  { symbol: "MA", yahoo: "MA" },
  { symbol: "KO", yahoo: "KO" },
  { symbol: "PEP", yahoo: "PEP" },
  { symbol: "WMT", yahoo: "WMT" },
  { symbol: "BA", yahoo: "BA" },
  { symbol: "ORCL", yahoo: "ORCL" },
];

// Map ISO currency code -> the symbol the ticker used to show (Google's price text).
const CURRENCY_SYMBOL = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

const fetchOne = async ({ symbol, yahoo }) => {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahoo}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        // Cloudflare-only: cache the upstream call at the edge for 5 minutes so
        // visitors don't each hit Yahoo. Ignored harmlessly during local dev.
        cf: { cacheTtl: 300, cacheEverything: true },
      }
    );
    if (!res.ok) return null;

    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const curPrice = meta.regularMarketPrice;
    const prePrice = meta.chartPreviousClose ?? meta.previousClose;
    if (curPrice == null || prePrice == null) return null;

    const diff = curPrice - prePrice;
    const percent = ((diff / prePrice) * 100).toFixed(2) + "%";

    let direction = "no-change";
    if (diff > 0) direction = "up";
    else if (diff < 0) direction = "down";

    return {
      symbol,
      curPrice: Number(curPrice.toFixed(2)),
      prePrice: Number(prePrice.toFixed(2)),
      percent,
      currency: CURRENCY_SYMBOL[meta.currency] || meta.currency,
      diff: diff.toFixed(2),
      direction,
    };
  } catch {
    return null;
  }
};

export async function GET() {
  const results = await Promise.all(STOCKS.map(fetchOne));
  const stocks = results.filter(Boolean);

  return new Response(JSON.stringify(stocks), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      // Let any CDN/browser reuse the response for 5 min, serve stale while revalidating.
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
