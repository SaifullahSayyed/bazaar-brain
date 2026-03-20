require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
const winston = require('winston');

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

const app = express();
app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173'] }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ['http://localhost:5173'] }
});

const PORT = process.env.PORT || 8080;

const NSE_SECTORS = [
  { id:'S1', name:'Banking & Finance', symbol:'^NSEBANK', nifty:'NIFTY BANK' },
  { id:'S2', name:'Information Technology', symbol:'^CNXIT', nifty:'NIFTY IT' },
  { id:'S3', name:'FMCG', symbol:'^CNXFMCG', nifty:'NIFTY FMCG' },
  { id:'S4', name:'Pharmaceuticals', symbol:'^CNXPHARMA', nifty:'NIFTY PHARMA' },
  { id:'S5', name:'Energy', symbol:'^CNXENERGY', nifty:'NIFTY ENERGY' },
  { id:'S6', name:'Auto', symbol:'^CNXAUTO', nifty:'NIFTY AUTO' },
  { id:'S7', name:'Metals & Mining', symbol:'^CNXMETAL', nifty:'NIFTY METAL' },
  { id:'S8', name:'Real Estate', symbol:'^CNXREALTY', nifty:'NIFTY REALTY' }
];

// State
let globalState = {
  sectorsTarget: NSE_SECTORS.map(s => ({ ...s })),
  sectorsCurrent: NSE_SECTORS.map(s => ({
    ...s, tension: 0, voltage: 50, waterLevel: 0, 
    temperature: 0, humidity: 0, pressure: 980, 
    priceChangePct: 0, currentPrice: 0, previousClose: 0, 
    volumeRatio: 0, signal: 'NEUTRAL'
  })),
  marketMetaTarget: { nifty50: { price: 0, changePct: 0 }, sensex: { price: 0, changePct: 0 } },
  marketMetaCurrent: { nifty50: { price: 0, changePct: 0 }, sensex: { price: 0, changePct: 0 } },
  lastSync: new Date().toISOString(),
  marketStatus: 'CLOSED',
  dataFreshness: 'MARKET_CLOSED',
  tickId: 0,
  totalTicksSent: 0,
  startTime: Date.now()
};

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function checkMarketClosed() {
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

async function fetchYahooData(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;
    const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (response.data?.chart?.result?.[0]?.meta) {
      return response.data.chart.result[0].meta;
    }
    return null;
  } catch (error) {
    logger.error(`Error fetching data for ${symbol}: ${error.message}`);
    return null;
  }
}

async function pollMarketData() {
  try {
    const isClosed = checkMarketClosed();
    globalState.marketStatus = isClosed ? 'CLOSED' : 'OPEN';
    globalState.dataFreshness = isClosed ? 'MARKET_CLOSED' : 'LIVE';

    // Sectors
    for (let i = 0; i < NSE_SECTORS.length; i++) {
      const sector = NSE_SECTORS[i];
      const meta = await fetchYahooData(sector.symbol);
      if (!meta) continue;

      const currentPrice = meta.regularMarketPrice || 0;
      const previousClose = meta.previousClose || 1;
      const dayHigh = meta.regularMarketDayHigh || currentPrice;
      const dayLow = meta.regularMarketDayLow || currentPrice;
      const volume = meta.regularMarketVolume || 0;
      const avgVolume = meta.averageDailyVolume10Day || 1;

      const priceChangePct = ((currentPrice - previousClose) / previousClose) * 100;
      const volumeRatio = volume / (avgVolume || 1);
      const denominator = (dayHigh - dayLow) || 1;
      const intraRange = clamp((currentPrice - dayLow) / denominator, 0, 1);

      const tension = clamp(Math.abs(priceChangePct) / 10, 0, 1);
      const voltage = clamp(50 + (priceChangePct * 2), 30, 70);
      const waterLevel = clamp(volumeRatio / 3, 0, 1);
      const temperature = currentPrice;
      const humidity = intraRange;
      const pressure = clamp(980 + (priceChangePct * 5), 950, 1020);

      const signal = priceChangePct > 0.5 ? 'BULLISH' :
                     priceChangePct < -0.5 ? 'BEARISH' : 'NEUTRAL';

      globalState.sectorsTarget[i] = {
        ...sector, tension, voltage, waterLevel, temperature, humidity, pressure,
        priceChangePct, currentPrice, previousClose, volumeRatio, signal
      };
    }

    // NIFTY50 & SENSEX
    const niftyMeta = await fetchYahooData('^NSEI');
    if (niftyMeta) {
      const p = niftyMeta.regularMarketPrice || 0;
      const c = niftyMeta.previousClose || 1;
      globalState.marketMetaTarget.nifty50 = { price: p, changePct: ((p - c) / c) * 100 };
    }
    const sensexMeta = await fetchYahooData('^BSESN');
    if (sensexMeta) {
      const p = sensexMeta.regularMarketPrice || 0;
      const c = sensexMeta.previousClose || 1;
      globalState.marketMetaTarget.sensex = { price: p, changePct: ((p - c) / c) * 100 };
    }

    globalState.lastSync = new Date().toISOString();
  } catch (error) {
    logger.error(`Error in pollMarketData: ${error.message}`);
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

  const payload = {
    timestamp: new Date().toISOString(),
    tickId: globalState.tickId,
    marketStatus: globalState.marketStatus,
    dataFreshness: globalState.dataFreshness,
    sectors: globalState.sectorsCurrent,
    marketMeta: {
      nifty50: globalState.marketMetaCurrent.nifty50,
      sensex: globalState.marketMetaCurrent.sensex,
      lastSync: globalState.lastSync,
      syncAgeSeconds: Math.floor((Date.now() - new Date(globalState.lastSync).getTime()) / 1000)
    },
    serverMeta: {
      uptimeSeconds: Math.floor((Date.now() - globalState.startTime) / 1000),
      connectedClients: io.engine.clientsCount,
      totalTicksSent: globalState.totalTicksSent,
      // approximate memory in MB
      memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024)
    }
  };

  io.emit('tick', payload);
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
setInterval(pollMarketData, 60000);

const startServer = () => {
  server.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
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
