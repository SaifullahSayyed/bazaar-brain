const axios = require('axios');

async function testYahoo() {
  const symbol = '^NSEI';
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=5d`;
  try {
    const response = await axios.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 8000
    });
    console.log('Yahoo Success:', response.data?.chart?.result?.[0]?.meta?.regularMarketPrice);
  } catch (error) {
    console.error('Yahoo Failed:', error.message);
  }
}

testYahoo();
