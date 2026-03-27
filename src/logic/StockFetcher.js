export const SECTOR_STOCKS = {
  S1: [ // Banking
    { name:'HDFC Bank', symbol:'HDFCBANK.NS' },
    { name:'ICICI Bank', symbol:'ICICIBANK.NS' },
    { name:'SBI', symbol:'SBIN.NS' }
  ],
  S2: [ // IT
    { name:'TCS', symbol:'TCS.NS' },
    { name:'Infosys', symbol:'INFY.NS' },
    { name:'HCL Tech', symbol:'HCLTECH.NS' }
  ],
  S3: [ // FMCG
    { name:'HUL', symbol:'HINDUNILVR.NS' },
    { name:'ITC', symbol:'ITC.NS' },
    { name:'Nestle', symbol:'NESTLEIND.NS' }
  ],
  S4: [ // Pharma
    { name:'Sun Pharma', symbol:'SUNPHARMA.NS' },
    { name:'Dr Reddys', symbol:'DRREDDY.NS' },
    { name:'Cipla', symbol:'CIPLA.NS' }
  ],
  S5: [ // Energy
    { name:'Reliance', symbol:'RELIANCE.NS' },
    { name:'ONGC', symbol:'ONGC.NS' },
    { name:'Power Grid', symbol:'POWERGRID.NS' }
  ],
  S6: [ // Auto
    { name:'Maruti', symbol:'MARUTI.NS' },
    { name:'Tata Motors', symbol:'TATAMOTORS.NS' },
    { name:'M&M', symbol:'M&M.NS' }
  ],
  S7: [ // Metal
    { name:'Tata Steel', symbol:'TATASTEEL.NS' },
    { name:'JSW Steel', symbol:'JSWSTEEL.NS' },
    { name:'Hindalco', symbol:'HINDALCO.NS' }
  ],
  S8: [ // Realty
    { name:'DLF', symbol:'DLF.NS' },
    { name:'Godrej Prop', symbol:'GODREJPROP.NS' },
    { name:'Oberoi', symbol:'OBEROIRLTY.NS' }
  ]
};

const cache = {};
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Fetch the 3 constituent stocks for a given sector ID.
 * Returns an array of objects: { symbol, name, price, changePct, status }
 */
export async function fetchConstituentStocks(sectorId, sectorName) {
  const stocks = SECTOR_STOCKS[sectorId];
  if (!stocks) return [];

  const cacheKey = `sector_${sectorId}`;
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    return cache[cacheKey].data;
  }

  try {
    const promises = stocks.map(async (stock) => {
      try {
        const response = await fetch(`/api/yahoo/v7/finance/quote?symbols=${stock.symbol}`);
        
        if (!response.ok) {
           console.error(`Failed to fetch ${stock.symbol}: ${response.status}`);
           return null;
        }

        const data = await response.json();
        const result = data.quoteResponse?.result?.[0];
        
        if (result) {
          const currentPrice = result.regularMarketPrice || 0;
          const prevClose = result.regularMarketPreviousClose || currentPrice || 1;
          const dayOpen = result.regularMarketOpen || currentPrice;
          const dayHigh = result.regularMarketDayHigh || currentPrice;
          const dayLow = result.regularMarketDayLow || currentPrice;
          const volume = result.regularMarketVolume || 0;
          const avgVolume = Math.max(result.averageDailyVolume10Day || result.averageDailyVolume3Month || 1, 1);
          
          const changePct = ((currentPrice - prevClose) / prevClose) * 100;
          
          // Z3 Boundaries - protecting against 0 division or bad data
          const FLOOR = Math.max(prevClose * 0.97, dayLow);
          const CEILING = Math.min(prevClose * 1.03, dayHigh * 1.005);
          const PIVOT = (dayHigh + dayLow + prevClose) / 3;
          const SUPPORT = (2 * PIVOT) - dayHigh;
          const RESISTANCE = (2 * PIVOT) - dayLow;

          let status = 'SAFE ✓';
          let verdict = 'SAFE';
          if (currentPrice > RESISTANCE) {
            status = 'WATCH ⚠';
            verdict = 'WARNING';
          } else if (currentPrice < SUPPORT && currentPrice > 0) {
            status = 'RISK ⚠';
            verdict = 'RISK';
          }
          
          return {
            symbol: stock.symbol,
            name: stock.name,
            sector: sectorName,
            price: currentPrice,
            changePct: changePct || 0,
            status,
            verdict,
            stats: {
              prevClose,
              dayOpen,
              dayHigh,
              dayLow,
              volume,
              avgVolume,
              volumeRatio: volume / avgVolume
            },
            z3: {
              FLOOR,
              CEILING,
              PIVOT,
              SUPPORT,
              RESISTANCE
            }
          };
        }
        return null;
      } catch (err) {
        console.error(`Error fetching data for ${stock.symbol}`, err);
        return null;
      }
    });

    const results = await Promise.all(promises);
    const validResults = results.filter(r => r !== null);
    
    cache[cacheKey] = {
      timestamp: Date.now(),
      data: validResults
    };
    
    return validResults;
  } catch (error) {
    console.error("fetchConstituentStocks general error", error);
    return [];
  }
}
