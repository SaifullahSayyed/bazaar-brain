import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketStore } from '../context/MarketStore';
import { callGemini } from '../logic/GeminiService';

const OpportunityRadar = () => {
  const { sectors, marketMeta } = useMarketStore();
  const [signal, setSignal] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [nextScanIn, setNextScanIn] = useState(300); // 5 minutes
  const [lastScanned, setLastScanned] = useState(null);

  const parseRadarResponse = (text) => {
    // Strip markdown asterisks, then parse each line
    const clean = text.replace(/\*/g, '');
    const lines = clean.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const get = (key) => {
      // Use a case-insensitive regex so SIGNAL, Signal, etc. all work
      const line = lines.find(l => new RegExp(`^${key}\\s*:`, 'i').test(l));
      if (!line) return '';
      return line.substring(line.indexOf(':') + 1).trim();
    };
    
    return {
      signal: get('SIGNAL'),
      sector: get('SECTOR'),
      nifty: get('NIFTY'),
      reason: get('REASON'),
      confidence: get('CONFIDENCE'),
      horizon: get('HORIZON'),
      risk: get('RISK'),
      hindi: get('HINDI'),
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false })
    };
  };

  const scanOpportunity = useCallback(async () => {
    if (!sectors || sectors.length === 0) return;
    setIsScanning(true);

    // ── Step 1: Show local heuristic signal immediately (always guaranteed) ─
    const bestBull = [...sectors].sort((a, b) => b.priceChangePct - a.priceChangePct)[0];
    const bestBear = [...sectors].sort((a, b) => a.priceChangePct - b.priceChangePct)[0];
    const highTension = [...sectors].sort((a, b) => b.tension - a.tension)[0];
    const localSig = bestBull?.priceChangePct > 1.5 ? 'BUY' : highTension?.tension > 0.7 ? 'SELL' : 'WATCH';
    const candidate = localSig === 'BUY' ? bestBull : localSig === 'SELL' ? bestBear : highTension;
    const vol = candidate?.volumeRatio;
    const volStr = (vol !== undefined && vol !== null && !isNaN(vol) && vol > 0) ? `, Vol:${Number(vol).toFixed(2)}x` : '';
    setSignal({
      signal: localSig,
      sector: candidate?.name || 'Market',
      nifty: candidate?.nifty || '',
      reason: `${candidate?.name} ${localSig === 'BUY' ? 'showing strong momentum' : localSig === 'SELL' ? 'showing high tension' : 'at key level'} at ${(candidate?.priceChangePct || 0) >= 0 ? '+' : ''}${Number(candidate?.priceChangePct || 0).toFixed(2)}%${volStr}`,
      confidence: (candidate?.priceChangePct ?? 0) > 2 ? 'HIGH' : 'MEDIUM',
      horizon: 'INTRADAY',
      risk: (candidate?.tension ?? 0) > 0.7 ? 'HIGH' : 'MEDIUM',
      hindi: `${candidate?.name} में ${localSig === 'BUY' ? 'तेज़ी' : localSig === 'SELL' ? 'गिरावट' : 'निगरानी'} का संकेत।`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false })
    });
    setLastScanned(new Date());

    // ── Step 2: Try to upgrade with Gemini (best-effort, overwrites if good) ─
    const sectorData = sectors.map(s =>
      `${s.name}: ${(s.priceChangePct || 0) > 0 ? '+' : ''}${Number(s.priceChangePct || 0).toFixed(2)}%, Vol:${Number(s.volumeRatio || 0).toFixed(2)}x, Tension:${Number(s.tension || 0).toFixed(2)}, Signal:${s.signal}`
    ).join('\n');
    const prompt =
      `You are Bazaar Brain Opportunity Radar.\n` +
      `Scan NSE sectors and surface ONE signal.\n` +
      `Format EXACTLY — NO MARKDOWN, NO ASTERISKS:\n` +
      `SIGNAL: BUY|SELL|WATCH\nSECTOR: [sector name]\nNIFTY: [index name]\n` +
      `REASON: [one sentence]\nCONFIDENCE: HIGH|MEDIUM|LOW\n` +
      `HORIZON: INTRADAY|SWING|POSITIONAL\nRISK: LOW|MEDIUM|HIGH\n` +
      `HINDI: [Hindi translation of REASON]\n\n` +
      `NSE data:\n${sectorData}\nNIFTY50: ${Number(marketMeta?.nifty50?.changePct || 0).toFixed(2)}%`;
    try {
      const response = await callGemini(prompt, 8000);
      const parsed = parseRadarResponse(response);
      if (parsed.signal && parsed.sector) {
        setSignal({ ...parsed, timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) });
      }
    } catch (error) {
      console.warn('[Radar] Gemini unavailable, keeping local signal:', error.message);
    } finally {
      setIsScanning(false);
      setNextScanIn(300);
    }
  }, [sectors, marketMeta]);

  // Keep a stable ref to scanOpportunity so timers aren't cancelled every 700ms tick
  const scanOpportunityRef = React.useRef(scanOpportunity);
  useEffect(() => { scanOpportunityRef.current = scanOpportunity; }, [scanOpportunity]);

  // Fire initial scan ONCE after sectors first load — stable empty dep array avoids
  // the timer being reset every 700ms when scanOpportunity gets a new reference
  const hasScannedOnce = React.useRef(false);
  useEffect(() => {
    if (sectors && sectors.length > 0 && !hasScannedOnce.current) {
      hasScannedOnce.current = true;
      const t = setTimeout(() => scanOpportunityRef.current(), 1500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectors.length > 0]);  // only re-evaluate when data goes from empty → populated

  useEffect(() => {
    const timer = setInterval(() => {
      setNextScanIn((prev) => {
        if (prev <= 1) {
          scanOpportunity();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [scanOpportunity]);



  const getSignalColor  = (sig) => sig === 'BUY' ? 'var(--color-bull)' : sig === 'SELL' ? 'var(--color-bear)' : 'var(--color-warning)';
  const getSignalRgb    = (sig) => sig === 'BUY' ? '0,255,136' : sig === 'SELL' ? '255,34,34' : '255,184,0';
  const getConfColor    = (c)   => c === 'HIGH' ? 'var(--color-bull)' : c === 'LOW' ? 'var(--color-bear)' : 'var(--color-warning)';
  const getRiskColor    = (r)   => r === 'LOW'  ? 'var(--color-bull)' : r === 'HIGH' ? 'var(--color-bear)' : 'var(--color-warning)';
  const confStrength    = (c)   => c === 'HIGH' ? 85 : c === 'MEDIUM' ? 55 : 25;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${String(s).padStart(2,'0')}s`;
  };

  return (
    <div style={{ padding: '0.5rem 0.4rem 0.4rem', borderTop: '1px solid var(--color-border)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.52rem', color: 'var(--color-ai)', letterSpacing: '0.22em', textShadow: '0 0 8px rgba(139,0,255,0.6)' }}>
          ⬡ OPPORTUNITY RADAR
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
          {isScanning ? '⟳ SCANNING' : `Next: ${formatTime(nextScanIn)}`}
        </span>
      </div>

      {/* ── Scanning state ── */}
      {isScanning && (
        <div style={{ marginBottom: '0.5rem', overflow: 'hidden', borderRadius: '0.3rem', position: 'relative', height: '3px', background: 'rgba(139,0,255,0.08)' }}>
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', background: 'linear-gradient(90deg, transparent, var(--color-ai), transparent)', boxShadow: '0 0 12px var(--color-ai)' }}
          />
        </div>
      )}

      {/* ── Signal card ── */}
      <AnimatePresence mode="wait">
        {signal && (
          <motion.div
            key={`${signal.sector}-${signal.signal}`}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            style={{
              borderRadius: '0.6rem',
              overflow: 'hidden',
              border: `1px solid rgba(${getSignalRgb(signal.signal)}, 0.5)`,
              boxShadow: `0 0 18px rgba(${getSignalRgb(signal.signal)}, 0.15), inset 0 0 30px rgba(${getSignalRgb(signal.signal)}, 0.03)`,
              background: `linear-gradient(160deg, rgba(${getSignalRgb(signal.signal)},0.06) 0%, rgba(6,13,26,0.95) 50%)`,
            }}
          >
            {/* Gradient accent bar at top */}
            <div style={{
              height: '2px',
              background: `linear-gradient(90deg, transparent, ${getSignalColor(signal.signal)}, transparent)`,
              boxShadow: `0 0 8px ${getSignalColor(signal.signal)}`,
            }} />

            <div style={{ padding: '0.65rem 0.75rem' }}>
              {/* Row 1: Badge + Sector name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.35rem' }}>
                <motion.span
                  animate={{ opacity: [1, 0.75, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    background: `rgba(${getSignalRgb(signal.signal)}, 0.18)`,
                    border: `1px solid rgba(${getSignalRgb(signal.signal)}, 0.6)`,
                    color: getSignalColor(signal.signal),
                    fontSize: '0.62rem',
                    fontWeight: 'bold',
                    padding: '0.12rem 0.45rem',
                    borderRadius: '0.25rem',
                    letterSpacing: '0.08em',
                    boxShadow: `0 0 8px rgba(${getSignalRgb(signal.signal)}, 0.3)`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {signal.signal === 'BUY' ? '▲ BUY' : signal.signal === 'SELL' ? '▼ SELL' : '◆ WATCH'}
                </motion.span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-text-bright)', letterSpacing: '0.03em' }}>
                  {signal.sector}
                </span>
              </div>

              {/* NIFTY sub-label */}
              {signal.nifty && (
                <div style={{ fontSize: '0.58rem', color: 'var(--color-neutral)', marginBottom: '0.45rem', letterSpacing: '0.12em', opacity: 0.85 }}>
                  {signal.nifty}
                </div>
              )}

              {/* Divider */}
              <div style={{ height: '1px', background: `linear-gradient(90deg, rgba(${getSignalRgb(signal.signal)},0.3), transparent)`, marginBottom: '0.45rem' }} />

              {/* Reason text */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--color-text-primary)', lineHeight: 1.6, marginBottom: '0.4rem' }}>
                {(signal.reason || '').replace(/,?\s*Vol:0\.00x/g, '')}
              </div>

              {/* Hindi text */}
              {signal.hindi && (
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
                  color: 'var(--color-warning)', lineHeight: 1.5, marginBottom: '0.55rem',
                  paddingLeft: '0.5rem',
                  borderLeft: '2px solid rgba(255,184,0,0.4)',
                }}>
                  {signal.hindi.replace(/,?\s*वॉल्यूम:\s*0\.00x[।.]?/g, '।')}
                </div>
              )}

              {/* Confidence strength bar */}
              <div style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.52rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>CONFIDENCE</span>
                  <span style={{ fontSize: '0.52rem', color: getConfColor(signal.confidence || 'MEDIUM'), letterSpacing: '0.1em' }}>{signal.confidence || 'MEDIUM'}</span>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confStrength(signal.confidence || 'MEDIUM')}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      borderRadius: '2px',
                      background: `linear-gradient(90deg, ${getConfColor(signal.confidence || 'MEDIUM')}, rgba(255,255,255,0.4))`,
                      boxShadow: `0 0 6px ${getConfColor(signal.confidence || 'MEDIUM')}`,
                    }}
                  />
                </div>
              </div>

              {/* Badges row */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                {/* Horizon — cyan, always visible */}
                <div style={{
                  fontSize: '0.58rem', borderRadius: '1rem', padding: '0.12rem 0.5rem',
                  border: '1px solid var(--color-neutral)',
                  color: 'var(--color-neutral)',
                  background: 'rgba(0,255,255,0.07)',
                  letterSpacing: '0.07em',
                }}>
                  ◷ {signal.horizon || 'INTRADAY'}
                </div>
                {/* Risk */}
                <div style={{
                  fontSize: '0.58rem', borderRadius: '1rem', padding: '0.12rem 0.5rem',
                  border: '1px solid',
                  borderColor: getRiskColor(signal.risk || 'MEDIUM'),
                  color: getRiskColor(signal.risk || 'MEDIUM'),
                  background: `rgba(${getSignalRgb(signal.signal)},0.06)`,
                  letterSpacing: '0.07em',
                }}>
                  ⚠ {signal.risk || 'MEDIUM'} RISK
                </div>
              </div>

              {/* Timestamp */}
              <div style={{ marginTop: '0.5rem', fontSize: '0.55rem', color: 'var(--color-text-muted)', textAlign: 'right', letterSpacing: '0.06em' }}>
                ⏱ {signal.timestamp}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(OpportunityRadar);
