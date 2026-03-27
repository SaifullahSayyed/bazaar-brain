const axios = require('axios');

const SECTOR_STOCKS = {
  S1: [
    { name:'HDFC Bank', symbol:'HDFCBANK.NS', shortName:'HDFCBANK' },
    { name:'ICICI Bank', symbol:'ICICIBANK.NS', shortName:'ICICIBANK' },
    { name:'State Bank of India', symbol:'SBIN.NS', shortName:'SBIN' }
  ],
  S2: [
    { name:'TCS', symbol:'TCS.NS', shortName:'TCS' },
    { name:'Infosys', symbol:'INFY.NS', shortName:'INFY' },
    { name:'HCL Technologies', symbol:'HCLTECH.NS', shortName:'HCLTECH' }
  ],
  S3: [
    { name:'Hindustan Unilever', symbol:'HINDUNILVR.NS', shortName:'HUL' },
    { name:'ITC', symbol:'ITC.NS', shortName:'ITC' },
    { name:'Nestle India', symbol:'NESTLEIND.NS', shortName:'NESTLE' }
  ],
  S4: [
    { name:'Sun Pharma', symbol:'SUNPHARMA.NS', shortName:'SUNPHARMA' },
    { name:'Dr Reddys', symbol:'DRREDDY.NS', shortName:'DRREDDY' },
    { name:'Cipla', symbol:'CIPLA.NS', shortName:'CIPLA' }
  ],
  S5: [
    { name:'Reliance Industries', symbol:'RELIANCE.NS', shortName:'RELIANCE' },
    { name:'ONGC', symbol:'ONGC.NS', shortName:'ONGC' },
    { name:'Power Grid', symbol:'POWERGRID.NS', shortName:'POWERGRID' }
  ],
  S6: [
    { name:'Maruti Suzuki', symbol:'MARUTI.NS', shortName:'MARUTI' },
    { name:'Tata Motors', symbol:'TATAMOTORS.NS', shortName:'TATAMOTORS' },
    { name:'Mahindra & Mahindra', symbol:'M&M.NS', shortName:'M&M' }
  ],
  S7: [
    { name:'Tata Steel', symbol:'TATASTEEL.NS', shortName:'TATASTEEL' },
    { name:'JSW Steel', symbol:'JSWSTEEL.NS', shortName:'JSWSTEEL' },
    { name:'Hindalco', symbol:'HINDALCO.NS', shortName:'HINDALCO' }
  ],
  S8: [
    { name:'DLF', symbol:'DLF.NS', shortName:'DLF' },
    { name:'Godrej Properties', symbol:'GODREJPROP.NS', shortName:'GODREJ' },
    { name:'Oberoi Realty', symbol:'OBEROIRLTY.NS', shortName:'OBEROI' }
  ]
};

async function fetchStockData(symbol) {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + symbol + '?interval=1m&range=1d';
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      },
      timeout: 8000
    });
    
    const meta = response.data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const currentPrice = meta.regularMarketPrice || 0;
    const previousClose = meta.previousClose || currentPrice;
    const dayHigh = meta.regularMarketDayHigh || currentPrice;
    const dayLow = meta.regularMarketDayLow || currentPrice;
    const volume = meta.regularMarketVolume || 0;
    const avgVolume = meta.averageDailyVolume10Day || 1;

    // Price change
    const priceChange = currentPrice - previousClose;
    const priceChangePct = previousClose > 0 ? (priceChange / previousClose) * 100 : 0;

    // Volume ratio
    const volumeRatio = avgVolume > 0 ? volume / avgVolume : 0;

    // PIVOT POINT ZONE CALCULATION
    const pivot = (dayHigh + dayLow + previousClose) / 3;
    const support1 = (2 * pivot) - dayHigh;
    const resistance1 = (2 * pivot) - dayLow;
    const support2 = pivot - (dayHigh - dayLow);
    const resistance2 = pivot + (dayHigh - dayLow);

    // Z3 Zone Status
    let zoneStatus = 'SAFE';
    let zoneLabel = 'In Normal Range';
    if (currentPrice > resistance1) {
      zoneStatus = 'BREAKOUT';
      zoneLabel = 'Above Resistance — Watch';
    } else if (currentPrice < support1) {
      zoneStatus = 'BREAKDOWN';
      zoneLabel = 'Below Support — Risk';
    } else if (currentPrice > pivot) {
      zoneStatus = 'SAFE';
      zoneLabel = 'Above Pivot — Bullish bias';
    } else {
      zoneStatus = 'SAFE';
      zoneLabel = 'Below Pivot — Bearish bias';
    }

    // Signal
    const signal = priceChangePct > 0.3 ? 'BULLISH' : priceChangePct < -0.3 ? 'BEARISH' : 'NEUTRAL';

    // Volume confirmation
    const volumeConfirmed = volumeRatio > 0.8;

    return {
      symbol,
      currentPrice,
      previousClose,
      priceChange,
      priceChangePct,
      dayHigh,
      dayLow,
      volume,
      volumeRatio,
      pivot: parseFloat(pivot.toFixed(2)),
      support1: parseFloat(support1.toFixed(2)),
      resistance1: parseFloat(resistance1.toFixed(2)),
      support2: parseFloat(support2.toFixed(2)),
      resistance2: parseFloat(resistance2.toFixed(2)),
      zoneStatus,
      zoneLabel,
      signal,
      volumeConfirmed,
      lastUpdated: new Date().toISOString()
    };
  } catch (err) {
    return null;
  }
}

async function fetchSectorStocks(sectorId) {
  const stocks = SECTOR_STOCKS[sectorId];
  if (!stocks) return [];

  const results = await Promise.allSettled(
    stocks.map(async (stock) => {
      const data = await fetchStockData(stock.symbol);
      if (!data) return null;
      return {
        ...stock,
        ...data
      };
    })
  );

  return results
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => r.value);
}

const stockCache = new Map();
const CACHE_TTL = 60000;

async function getCachedSectorStocks(sectorId) {
  const cached = stockCache.get(sectorId);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }
  const data = await fetchSectorStocks(sectorId);
  stockCache.set(sectorId, { data, time: Date.now() });
  return data;
}

module.exports = { getCachedSectorStocks, SECTOR_STOCKS };
