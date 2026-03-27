require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { auditAllSectors } = require('./Z3Engine');
const { getCachedSectorStocks } = require('./stockFetcher');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Logger Setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: 'server.log' })
  ]
});

const corsOptions = {
  origin: function (origin, callback) {
    // During development, allow localhost/127.0.0.1 and explicit null origins
    const isLocal = !origin || 
                   origin.startsWith('http://localhost:') || 
                   origin.startsWith('http://127.0.0.1:') ||
                   origin === 'null';
                   
    if (isLocal) {
      callback(null, true);
    } else {
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const app = express();
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

/**
 * POST /z3-audit
 * Accepts sector data from the frontend and runs actual Z3 SMT checks.
 * Returns SAT/UNSAT results with SMTLIB2 proofs.
 */
app.post('/z3-audit', async (req, res) => {
  try {
    const { sectors } = req.body;
    if (!sectors || !Array.isArray(sectors)) {
      return res.status(400).json({ error: 'sectors array required' });
    }
    
    logger.info(`[Z3] Audit requested for ${sectors.length} sectors`);
    const result = await auditAllSectors(sectors);
    logger.info(`[Z3] Audit complete — ${result.violations} violations in ${result.totalSolveTimeMs.toFixed(2)}ms`);
    
    res.json(result);
  } catch (err) {
    logger.error('[Z3] Audit error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /z3-status
 * Returns the current sector state for Z3 auditing.
 */
app.get('/z3-status', (req, res) => {
  res.json({
    engine: 'z3-solver (Microsoft Z3 WASM v4.x)',
    sectors: globalState.sectorsCurrent.length,
    ready: true,
  });
});

/**
 * GET /backtest-stats
 * MOD 3: Serves live backtest results JSON to the frontend BacktestBadge component.
 */
app.get('/backtest-stats', (req, res) => {
  try {
    const resultsPath = path.join(__dirname, 'backtest_results.json');
    const raw = fs.readFileSync(resultsPath, 'utf8');
    const data = JSON.parse(raw);
    res.json({ ...data, source: 'backtest_results.json' });
  } catch (err) {
    logger.error('[BacktestStats] Failed to read results:', err.message);
    res.status(500).json({ error: 'Backtest results unavailable', message: err.message });
  }
});

/**
 * POST /toggle-live
 * Overrides the timezone checks and forces the engine to attempt live Tier 1 / Tier 2 fetches.
 */
app.post('/toggle-live', (req, res) => {
  globalState.forceLiveMode = !globalState.forceLiveMode;
  logger.info(`[ForceLive] Toggled forceLiveMode to ${globalState.forceLiveMode}`);
  
  // Instantly poll to update marketStatus
  pollMarketData();
  
  res.json({ forceLiveMode: globalState.forceLiveMode, status: 'ok' });
});

/**
 * GET /api/sector/:sectorId/stocks
 * Fetches constituent stock data for a specific sector with Z3 boundaries
 */
app.get('/api/sector/:sectorId/stocks', async (req, res) => {
  try {
    const { sectorId } = req.params;
    if (!['S1','S2','S3','S4','S5','S6','S7','S8'].includes(sectorId)) {
      return res.status(400).json({ error: 'Invalid sector ID' });
    }
    
    logger.info(`Stock data requested: ${sectorId}`);
    const stocks = await getCachedSectorStocks(sectorId);
    
    res.json({
      sectorId,
      stocks,
      cachedAt: new Date().toISOString(),
      count: stocks.length
    });
  } catch (err) {
    logger.error('Stock fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch stock data' });
  }
});

const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

const PORT = process.env.PORT || 8080;

const NSE_SECTORS = [
  { id:'S1', name:'Banking & Finance', symbol:'^NSEBANK', nifty:'NIFTY BANK', lastPrice: 51240.50 },
  { id:'S2', name:'Information Technology', symbol:'^CNXIT', nifty:'NIFTY IT', lastPrice: 38450.20 },
  { id:'S3', name:'FMCG', symbol:'^CNXFMCG', nifty:'NIFTY FMCG', lastPrice: 54120.75 },
  { id:'S4', name:'Pharmaceuticals', symbol:'^CNXPHARMA', nifty:'NIFTY PHARMA', lastPrice: 21340.40 },
  { id:'S5', name:'Energy', symbol:'^CNXENERGY', nifty:'NIFTY ENERGY', lastPrice: 39560.15 },
  { id:'S6', name:'Auto', symbol:'^CNXAUTO', nifty:'NIFTY AUTO', lastPrice: 24780.90 },
  { id:'S7', name:'Metals & Mining', symbol:'^CNXMETAL', nifty:'NIFTY METAL', lastPrice: 9840.30 },
  { id:'S8', name:'Real Estate', symbol:'^CNXREALTY', nifty:'NIFTY REALTY', lastPrice: 1045.60 }
];

// State
let globalState = {
  sectorsTarget: NSE_SECTORS.map(s => ({ ...s, currentPrice: s.lastPrice, previousClose: s.lastPrice })),
  sectorsCurrent: NSE_SECTORS.map(s => ({
    ...s, tension: 0, voltage: 50, waterLevel: 0, 
    temperature: 0, humidity: 0, pressure: 980, 
    priceChangePct: 0, currentPrice: s.lastPrice, previousClose: s.lastPrice, 
    volumeRatio: 0, signal: 'NEUTRAL'
  })),
  marketMetaTarget: { nifty50: { price: 0, changePct: 0 }, sensex: { price: 0, changePct: 0 } },
  marketMetaCurrent: { nifty50: { price: 0, changePct: 0 }, sensex: { price: 0, changePct: 0 } },
  lastSync: new Date().toISOString(),
  marketStatus: 'CLOSED',
  dataFreshness: 'MARKET_CLOSED',
  tickId: 0,
  totalTicksSent: 0,
  startTime: Date.now(),
  forceLiveMode: true
};

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function checkMarketClosed() {
  if (globalState.forceLiveMode) return false;

  const now = new Date();
  // IST is UTC+5:30
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istDate = new Date(utcMs + (330 * 60000));
  
  const day = istDate.getDay();
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  
  // Mon-Fri = 1-5
  if (day === 0 || day === 6) return true;
  
  const timeInMinutes = hours * 60 + minutes;
  const marketOpen = 9 * 60 + 15; // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM
  
  return timeInMinutes < marketOpen || timeInMinutes > marketClose;
}

/**
 * NSE Official index to Yahoo symbol map for Tier 1 lookups.
 * NSE API uses index names like 'NIFTY BANK', not ticker symbols.
 */
const NSE_INDEX_MAP = {
  '^NSEBANK':   'NIFTY BANK',
  '^CNXIT':     'NIFTY IT',
  '^CNXFMCG':  'NIFTY FMCG',
  '^CNXPHARMA':'NIFTY PHARMA',
  '^CNXENERGY':'NIFTY ENERGY',
  '^CNXAUTO':  'NIFTY AUTO',
  '^CNXMETAL': 'NIFTY METAL',
  '^CNXREALTY':'NIFTY REALTY',
  '^NSEI':     'NIFTY 50',
  '^BSESN':    null, // BSE not on NSE API
};

/**
 * MOD 4: Fetch from NSE Official API (Tier 1) with browser-spoofing headers.
 * Returns null on any failure so waterfall can fall through.
 *
 * ⚠️  HACKATHON-STAGE PROOF OF CONCEPT — NOT FOR PRODUCTION
 * This approach uses a 2-step CSRF cookie handshake to authenticate with NSE's
 * public-facing web API. This will break unpredictably as NSE updates its
 * session management and is NOT a licensed data integration.
 *
 * PRODUCTION MIGRATION PATH:
 * Replace this function with one of:
 *   1. Angel One Breeze Connect API  →  https://breeze.inuvest.tech (licensed, real-time)
 *   2. NSE Market Data Feed (licensed)  →  https://www.nseindia.com/data-products
 *   3. Upstox Market Data WebSocket  →  https://upstox.com/developer/api-documentation
 * All three provide authenticated WebSocket streaming with no CSRF dependency.
 * The waterfall architecture below (Tier 1 → Tier 2 → Tier 3 → Simulation)
 * requires only swapping this single function to go production-ready.
 */
async function fetchNSEOfficial(symbol) {
  const indexName = NSE_INDEX_MAP[symbol];
  if (!indexName) return null;

  try {
    const commonHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'sec-fetch-user': '?1',
      'Priority': 'u=0, i',
      'upgrade-insecure-requests': '1',
    };

    // NSE requires a prior session cookie — two-request handshake
    const sessionRes = await axios.get('https://www.nseindia.com', {
      headers: commonHeaders,
      timeout: 8000,
    });
    const cookies = (sessionRes.headers['set-cookie'] || []).join('; ');

    // Mimic human-like wait before hit the API
    await sleep(800);

    const apiRes = await axios.get(
      `https://www.nseindia.com/api/equity-stockIndices?index=${encodeURIComponent(indexName)}`,
      {
        headers: {
          ...commonHeaders,
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://www.nseindia.com/get-quotes/equity?symbol=NIFTY%2050',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'Cookie': cookies,
        },
        timeout: 10000,
      }
    );

    const record = apiRes.data?.data?.[0];
    if (!record) return null;

    const lastPrice  = parseFloat(record.lastPrice?.replace(/,/g, '')) || 0;
    const prevClose  = parseFloat(record.previousClose?.replace(/,/g, '')) || 1;
    const dayHigh    = parseFloat(record.dayHigh?.replace(/,/g, ''))    || lastPrice;
    const dayLow     = parseFloat(record.dayLow?.replace(/,/g, ''))     || lastPrice;

    logger.info(`[Waterfall] Tier 1 NSE_OFFICIAL success for ${symbol} (${indexName}): ₹${lastPrice}`);
    return {
      regularMarketPrice: lastPrice,
      previousClose:      prevClose,
      regularMarketDayHigh: dayHigh,
      regularMarketDayLow:  dayLow,
      fiftyTwoWeekHigh: dayHigh,
      fiftyTwoWeekLow:  dayLow,
      _source: 'TIER_1_NSE_OFFICIAL',
    };
  } catch (err) {
    logger.warn(`[Waterfall] Tier 1 NSE_OFFICIAL failed for ${symbol}: ${err.message}`);
    return null;
  }
}

async function fetchWaterfallData(symbol) {
  // Tier 1 (Primary): NSE Official API
  const nseMeta = await fetchNSEOfficial(symbol);
  if (nseMeta) return nseMeta;

  // Tier 2 (Secondary): Yahoo Finance API
  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=5d`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=5d`,
  ];
  
  for (const url of urls) {
    try {
      const response = await axios.get(url, { 
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        timeout: 8000
      });
      if (response.data?.chart?.result?.[0]?.meta) {
        const meta = response.data.chart.result[0].meta;
        meta._source = 'TIER_2_YAHOO';
        return meta;
      }
    } catch (error) {
      logger.warn(`[Waterfall] Tier 2 ${symbol} fetch failed (${url.includes('query2') ? 'q2' : 'q1'}): ${error.message}`);
    }
  }

  // Tier 3 is handled by returning null, which triggers the micro-jitter cache fallback.
  return null;
}

async function fetchWaterfallIndexData(symbol) {
  const meta = await fetchWaterfallData(symbol);
  if (meta) return meta;
  
  // Tier 3 Cache for indices
  const currentTarget = symbol === '^NSEI' ? globalState.marketMetaTarget.nifty50 : globalState.marketMetaTarget.sensex;
  if (currentTarget && currentTarget.price > 0) {
    const jitter = 1 + ((Math.random() - 0.5) * 0.0005);
    currentTarget.price *= jitter;
    // Assuming previousClose is somewhat stable, we can approximate changePct
    currentTarget._source = 'TIER_3_CACHE';
    return currentTarget; // Return the mutated target to satisfy the caller
  }
  return null;
}

async function pollMarketData() {
  try {
    const isClosed = checkMarketClosed();
    globalState.marketStatus = isClosed ? 'CLOSED' : 'OPEN';
    let successCount = 0;
    let activeWaterfallTier = 'TIER_1_BREEZE';

    // Sectors
    for (let i = 0; i < NSE_SECTORS.length; i++) {
      const sector = NSE_SECTORS[i];
      let meta = await fetchWaterfallData(sector.symbol);
      
      let currentPrice, previousClose, dayHigh, dayLow, fiftyTwoWkHigh, fiftyTwoWkLow;

      if (meta) {
        // TIER 2 SUCCESS
        activeWaterfallTier = meta._source;
        currentPrice  = meta.regularMarketPrice    || 0;
        previousClose = meta.previousClose          || 1;
        dayHigh       = meta.regularMarketDayHigh   || currentPrice;
        dayLow        = meta.regularMarketDayLow    || currentPrice;
        fiftyTwoWkHigh = meta.fiftyTwoWeekHigh      || currentPrice;
        fiftyTwoWkLow  = meta.fiftyTwoWeekLow       || currentPrice;
      } else {
        // TIER 3 (EMERGENCY CACHE OVERWRITE)
        activeWaterfallTier = 'TIER_3_CACHE';
        logger.warn(`[Waterfall] WARNING: Tier 2 Offline for ${sector.symbol}. Activating Tier 3 Micro-Jitter Cache.`);
        const cached = globalState.sectorsTarget[i];
        if (cached && cached.currentPrice > 0) {
          const jitter = 1 + ((Math.random() - 0.5) * 0.001); // +/- 0.05% jitter
          currentPrice = cached.currentPrice * jitter;
          previousClose = cached.previousClose;
          dayHigh = cached.dayHigh || currentPrice;
          dayLow = cached.dayLow || currentPrice;
          fiftyTwoWkHigh = currentPrice;
          fiftyTwoWkLow = currentPrice;
        } else {
          continue; // No cache available
        }
      }

      const priceChangePct = ((currentPrice - previousClose) / previousClose) * 100;
      const denominator    = (dayHigh - dayLow) || 1;
      const intraRange     = clamp((currentPrice - dayLow) / denominator, 0, 1);

      const intradayRange = dayHigh - dayLow;
      const annualRange   = (fiftyTwoWkHigh - fiftyTwoWkLow) || 1;
      const typicalDayRange = annualRange / 250;
      const activityRatio = clamp(intradayRange / (typicalDayRange || 1), 0, 5);

      const tension     = clamp(Math.abs(priceChangePct) / 10, 0, 1);
      const voltage     = clamp(50 + (priceChangePct * 2), 30, 70);
      const waterLevel  = clamp(activityRatio / 3, 0, 1);
      const temperature = currentPrice;
      const humidity    = intraRange;
      const pressure    = clamp(980 + (priceChangePct * 5), 950, 1020);

      const signal = priceChangePct > 0.5 ? 'BULLISH' :
                     priceChangePct < -0.5 ? 'BEARISH' : 'NEUTRAL';

      globalState.sectorsTarget[i] = {
        ...sector, tension, voltage, waterLevel, temperature, humidity, pressure,
        priceChangePct, currentPrice, previousClose, dayHigh, dayLow,
        volumeRatio: activityRatio,
        signal,
        dataSource: activeWaterfallTier,
      };
      successCount++;
    }

    // Set dataFreshness based on waterfall tier
    globalState.dataFreshness = successCount > 0 ? activeWaterfallTier : (isClosed ? 'MARKET_CLOSED' : 'SIMULATION');
    logger.info(`[Waterfall] ${successCount}/${NSE_SECTORS.length} sectors alive. Source: ${globalState.dataFreshness}`);

    // NIFTY50 & SENSEX via Waterfall
    const niftyMeta = await fetchWaterfallIndexData('^NSEI');
    if (niftyMeta && niftyMeta._source === 'TIER_2_YAHOO') {
      const p = niftyMeta.regularMarketPrice || 0;
      const c = niftyMeta.previousClose || 1;
      globalState.marketMetaTarget.nifty50 = { price: p, changePct: ((p - c) / c) * 100 };
    } else if (niftyMeta && niftyMeta._source === 'TIER_3_CACHE') {
      // It was already mutated in fetchWaterfallIndexData
    }

    const sensexMeta = await fetchWaterfallIndexData('^BSESN');
    if (sensexMeta && sensexMeta._source === 'TIER_2_YAHOO') {
      const p = sensexMeta.regularMarketPrice || 0;
      const c = sensexMeta.previousClose || 1;
      globalState.marketMetaTarget.sensex = { price: p, changePct: ((p - c) / c) * 100 };
    }

    globalState.lastSync = new Date().toISOString();
  } catch (error) {
    logger.error(`Error in pollMarketData Waterfall: ${error.message}`);
  }
}

// Interpolation & Broadcaster
setInterval(() => {
  globalState.tickId++;
  globalState.totalTicksSent++;

  // Interpolate sectors
  for (let i = 0; i < NSE_SECTORS.length; i++) {
    const t = globalState.sectorsTarget[i];
    const c = globalState.sectorsCurrent[i];
    if (t.currentPrice !== undefined) {
      ['tension', 'voltage', 'waterLevel', 'temperature', 'humidity', 'pressure', 'priceChangePct', 'currentPrice', 'volumeRatio'].forEach(key => {
        if (t[key] !== undefined) {
          c[key] = (c[key] !== undefined ? c[key] : t[key]) + (t[key] - (c[key] || 0)) * 0.15;
        }
      });
      c.signal = t.signal;
      c.previousClose = t.previousClose;
    }
  }

  // Interpolate marketMeta
  ['nifty50', 'sensex'].forEach(idx => {
    const t = globalState.marketMetaTarget[idx];
    const c = globalState.marketMetaCurrent[idx];
    c.price += (t.price - c.price) * 0.15;
    c.changePct += (t.changePct - c.changePct) * 0.15;
  });

  io.emit('tick', {
    sectors: globalState.sectorsCurrent,
    marketMeta: globalState.marketMetaCurrent,
    serverMeta: {
      memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      uptime: Date.now() - globalState.startTime,
      lastSync: globalState.lastSync,
      tickId: globalState.tickId,
      dataFreshness: globalState.dataFreshness
    },
    timestamp: new Date().toISOString()
  });
}, 700);

// Health Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    marketStatus: globalState.marketStatus,
    lastSync: globalState.lastSync,
    connectedClients: io.engine.clientsCount,
    uptime: Math.floor((Date.now() - globalState.startTime) / 1000),
    memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
  });
});

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Start Server
pollMarketData();
setInterval(pollMarketData, 30000);  // Poll every 30s for fresher data

const startServer = () => {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server listening on port ${PORT} (0.0.0.0)`);
  });
};

const shutdown = () => {
  logger.info('SIGTERM/SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();
