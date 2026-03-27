/**
 * OfflineFallbacks.js — Bulletproof demo fallbacks for Bazaar Brain
 * 
 * When Gemini API is rate-limited/offline, these generate contextual
 * responses using the ACTUAL live sector data already in the store.
 * This ensures the demo NEVER breaks on stage.
 */

/**
 * Generate a market directive from actual sector data (no API needed)
 */
export function offlineDirective(auditResult, sectors) {
  const s = auditResult;
  const name = s.violatingSectorName || 'Banking';
  const pct = s.violatingMetrics?.priceChangePct ?? 7.2;
  const vol = s.violatingMetrics?.volumeRatio ?? 0.4;
  const rule = s.ruleName || 'MOMENTUM_TRAP';

  const ruleTexts = {
    MOMENTUM_TRAP: `${name} sector is showing ${pct.toFixed(1)}% price surge on only ${(vol * 100).toFixed(0)}% of normal volume — a classic momentum trap. Retail investors must avoid chasing this move.`,
    CIRCUIT_BREAKER: `${name} has triggered a circuit breaker level with ${pct.toFixed(1)}% movement. Trading halt possible. Exit positions immediately.`,
    HIGH_TENSION: `${name} tension index has exceeded safe threshold. High volatility expected. Reduce exposure before market reaction.`,
  };

  const hindiTexts = {
    MOMENTUM_TRAP: `${name} सेक्टर में ${pct.toFixed(1)}% की तेजी, लेकिन वॉल्यूम कम है — मोमेंटम ट्रैप का खतरा। इस मूव का पीछा न करें।`,
    CIRCUIT_BREAKER: `${name} में सर्किट ब्रेकर लगने की संभावना। तुरंत पोजिशन से बाहर निकलें।`,
    HIGH_TENSION: `${name} में उच्च तनाव। वोलेटिलिटी बढ़ सकती है। एक्सपोजर कम करें।`,
  };

  return `${ruleTexts[rule] || ruleTexts.MOMENTUM_TRAP}\nHINDI: ${hindiTexts[rule] || hindiTexts.MOMENTUM_TRAP}`;
}

/**
 * Generate a market briefing from live sector data (no API needed)
 */
export function offlineBriefing(sectors, marketMeta) {
  const niftyPct = (marketMeta?.nifty50?.changePct ?? 0).toFixed(2);
  const niftyDir = niftyPct > 0 ? 'gaining' : 'falling';

  // Sort by tension to find watch/opportunity sectors
  const sorted = [...(sectors || [])].sort((a, b) => (b.tension ?? 0) - (a.tension ?? 0));
  const watchSector = sorted[0];
  const opSector = [...(sectors || [])].sort((a, b) => (b.priceChangePct ?? 0) - (a.priceChangePct ?? 0))[0];

  const watchPct = (watchSector?.priceChangePct ?? 0).toFixed(2);
  const opPct = (opSector?.priceChangePct ?? 0).toFixed(2);

  return [
    `MARKET STATUS: NSE markets are ${niftyDir} ${Math.abs(niftyPct)}% today with NIFTY50 at ₹${(marketMeta?.nifty50?.price ?? 23000).toFixed(0)}.`,
    `WATCH: ${watchSector?.name || 'Banking'} — tension at ${((watchSector?.tension ?? 0) * 100).toFixed(0)}% with ${watchPct}% move. Z3 monitoring active.`,
    `OPPORTUNITY: ${opSector?.name || 'IT'} showing ${opPct}% strength with healthy volume ratio of ${(opSector?.volumeRatio ?? 1).toFixed(2)}x.`,
    `DIRECTIVE: Set stop-losses at 5% below entry in high-tension sectors. Let momentum sectors consolidate before entry.`,
    `HINDI BRIEFING: NSE बाज़ार में आज ${Math.abs(niftyPct)}% की ${niftyPct > 0 ? 'तेजी' : 'गिरावट'} है। ${watchSector?.name || 'बैंकिंग'} सेक्टर पर नज़र रखें। Z3 इंजन सक्रिय है।`,
  ].join('\n');
}

/**
 * Generate a near-miss warning from actual sector metrics
 */
export function offlineNearMiss(sector) {
  const pct = (sector.priceChangePct ?? 0).toFixed(2);
  const tension = ((sector.tension ?? 0) * 100).toFixed(0);
  return `${sector.name} approaching risk threshold: ${pct}% move with ${tension}% tension index. Z3 monitoring elevated.\nHINDI: ${sector.name} जोखिम सीमा के करीब। ${pct}% मूवमेंट और ${tension}% तनाव। सावधानी रखें।`;
}
