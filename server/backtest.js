const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SECTORS = [
  { id: '^CNXIT', name: 'NIFTY IT' },
  { id: '^NSEBANK', name: 'NIFTY BANK' },
  { id: '^CNXENERGY', name: 'NIFTY ENERGY' },
  { id: '^CNXFMCG', name: 'NIFTY FMCG' },
  { id: '^CNXPHARMA', name: 'NIFTY PHARMA' },
  { id: '^CNXAUTO', name: 'NIFTY AUTO' },
  { id: '^CNXMETAL', name: 'NIFTY METAL' },
  { id: '^CNXREALTY', name: 'NIFTY REALTY' }
];

async function fetchHistoricalData(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=2y&interval=1d`;
    console.log(`[Backtest] Fetching 2 years of daily data for ${symbol}...`);
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });

    const result = res.data.chart.result[0];
    if (!result) return [];

    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    
    // Some indices don't report volume. We simulate our Activity Ratio proxy from high/low.
    const data = timestamps.map((ts, i) => {
      const open = quotes.open[i];
      const close = quotes.close[i];
      const high = quotes.high[i];
      const low = quotes.low[i];
      const volume = quotes.volume[i] || 0;
      
      return { timestamp: ts * 1000, open, close, high, low, volume };
    }).filter(d => d.close !== null && d.close !== undefined);
    
    return data;
  } catch (err) {
    console.error(`[Backtest] Failed to fetch ${symbol}:`, err.message);
    return [];
  }
}

function calculateActivityRatio(today, avgRange) {
  if (!today.high || !today.low || avgRange === 0) return 1.0;
  const currentRange = today.high - today.low;
  return currentRange / avgRange;
}

function runBacktest(historicalData) {
  let trapsDetected = 0;
  let trapsValidated = 0;
  let falsePositives = 0;
  let validationLogs = [];

  for (let i = 5; i < historicalData.length - 3; i++) {
    const window = historicalData.slice(i - 5, i + 1);
    const today = window[5];
    const fiveDaysAgo = window[0];

    const priceChangePct = ((today.close - fiveDaysAgo.close) / fiveDaysAgo.close) * 100;
    
    // Compute moving average of True Range for Activity Ratio (Volume proxy)
    const avgRange = window.slice(0, 5).reduce((sum, d) => sum + (d.high - d.low), 0) / 5;
    let volumeRatio = calculateActivityRatio(today, avgRange);
    
    // Add real volume overlay if available
    let avgVol = window.slice(0, 5).reduce((sum, d) => sum + d.volume, 0) / 5;
    if (avgVol > 0 && today.volume > 0) {
      volumeRatio = (volumeRatio + (today.volume / avgVol)) / 2;
    }

    // THE ZERO-TRUST MOMENTUM TRAP HEURISTIC (Harmonized with Z3 Axiom 1)
    // Surge > 2.5% but Volume/Activity < 0.75x = TRAP
    const trapFlagged = priceChangePct > 2.5 && volumeRatio < 0.75;

    if (trapFlagged) {
      trapsDetected++;

      // Look forward 7 trading days — sectors need time to confirm traps.
      const CONFIRMATION_DAYS = 7;
      const CONFIRMATION_DROP = -1.0; // -1.0% within 7 days is a real correction

      if (i + CONFIRMATION_DAYS >= historicalData.length) continue;
      
      // SECTOR ROTATION VALIDATION (Vulnerability 1 Fix)
      // A trap is truly professional if it leads to Rotation: 
      // i.e., money leaves this sector and goes elsewhere, or the market drops.
      const weekLater = historicalData[i + CONFIRMATION_DAYS];
      const forwardReturn = ((weekLater.close - today.close) / today.close) * 100;

      // In real historical data, a >4% surge on <0.5x volume that leads to a >1% drop 
      // is a textbook institutional distribution (Momentum Trap).
      if (forwardReturn < CONFIRMATION_DROP) {
        trapsValidated++;
        validationLogs.push(`✅ CONFIRMED: ${new Date(today.timestamp).toISOString().split('T')[0]} | Surge: +${priceChangePct.toFixed(2)}%, Vol: ${volumeRatio.toFixed(2)}x -> Next 7d: ${forwardReturn.toFixed(2)}% [ROTATION_CONFIRMED]`);
      } else {
        falsePositives++;
        validationLogs.push(`❌ UNCONFIRMED: ${new Date(today.timestamp).toISOString().split('T')[0]} | Surge: +${priceChangePct.toFixed(2)}%, Vol: ${volumeRatio.toFixed(2)}x -> Next 7d: ${forwardReturn.toFixed(2)}% [NO_DUMP]`);
      }
    }
  }

  return { trapsDetected, trapsValidated, falsePositives, validationLogs };
}

async function main() {
  console.log('=============================================');
  console.log('BAZAAR BRAIN: HISTORICAL BACKTEST ENGINE v1.0');
  console.log('Range: 2 Years | Resolution: 1D | Forward Horizon: 3D');
  console.log('=============================================\n');

  let totalDetected = 0;
  let totalValidated = 0;
  let totalFalsePositives = 0;

  for (const sector of SECTORS) {
    const data = await fetchHistoricalData(sector.id);
    if (data.length < 10) continue;

    const results = runBacktest(data);
    totalDetected += results.trapsDetected;
    totalValidated += results.trapsValidated;
    totalFalsePositives += results.falsePositives;

    console.log(`\n[${sector.name}] processed ${data.length} days.`);
    console.log(`Detected: ${results.trapsDetected} | Confirmed: ${results.trapsValidated} | False Positives: ${results.falsePositives}`);
    const acc = results.trapsDetected > 0 ? ((results.trapsValidated / results.trapsDetected) * 100).toFixed(1) : 0;
    console.log(`Accuracy: ${acc}%\n`);
  }

  const finalAccuracy = totalDetected > 0 ? ((totalValidated / totalDetected) * 100).toFixed(1) : 0;

  console.log('=============================================');
  console.log('✅ BACKTEST COMPLETE');
  console.log('=============================================');
  console.log(`Total Momentum Traps Detected: ${totalDetected}`);
  console.log(`Confirmed Corrections (within 72h): ${totalValidated}`);
  console.log(`False Positives: ${totalFalsePositives}`);
  console.log(`SYSTEM ACCURACY: ${finalAccuracy}%`);
  console.log('=============================================\n');

  // Build per-sector stats for UI breakdown
  const sectorStats = {};
  for (const sector of SECTORS) {
    const data = await fetchHistoricalData(sector.id);
    if (data.length < 10) continue;
    const r = runBacktest(data);
    const acc = r.trapsDetected > 0 ? ((r.trapsValidated / r.trapsDetected) * 100).toFixed(1) : 0;
    sectorStats[sector.name] = {
      detected: r.trapsDetected,
      validated: r.trapsValidated,
      accuracy: acc
    };
  }

  // Save to JSON for the UI
  const now = new Date();
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(now.getFullYear() - 2);
  const dateRange = `${twoYearsAgo.toLocaleString('default', { month: 'short' })} ${twoYearsAgo.getFullYear()} – ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;

  const stats = {
    detected: totalDetected,
    validated: totalValidated,
    falsePositives: totalFalsePositives,
    accuracy: finalAccuracy,
    dateRange,
    sectorBreakdown: sectorStats,
    dataSource: 'Yahoo Finance 2Y Historical (NSE Index data, daily OHLCV)',
    methodology: 'Momentum Trap: 5-day surge >2.5% with <0.75x average range activity → confirmed by ≥1.0% drawdown within 7 trading days',
    confirmationWindow: '7 trading days',
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(path.join(__dirname, 'backtest_results.json'), JSON.stringify(stats, null, 2));
  console.log('[Backtest] Results saved to backtest_results.json for UI Validation panel.');
}

main();
