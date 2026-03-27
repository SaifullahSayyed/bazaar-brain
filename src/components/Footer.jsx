import React, { useEffect, useState } from 'react';
import { useMarketStore } from '../context/MarketStore';
import '../styles/Footer.css';

export default function Footer({ solveTimeMs = 0 }) {
  const tickCount = useMarketStore(state => state.tickCount);
  const stateNorm = useMarketStore(state => state.stateNorm);
  const lastSignalTime = useMarketStore(state => state.lastSignalTime);
  const aiStatus = useMarketStore(state => state.aiStatus);
  const syncAgeSeconds = useMarketStore(state => state.syncAgeSeconds);
  const dataFreshness = useMarketStore(state => state.dataFreshness);
  const [demoPanel, setDemoPanel] = useState(false);

  let aiClass = 'standby';
  if (aiStatus === 'THINKING') aiClass = 'thinking';
  if (aiStatus === 'COMMANDING') aiClass = 'commanding';

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setDemoPanel(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const fire = (event) => window.dispatchEvent(new CustomEvent(event));

  const freshnessColor = dataFreshness === 'LIVE' ? '#00ff88'
    : dataFreshness === 'SIMULATION' ? '#f59e0b' : '#64748b';

  return (
    <>
      {/* Stage Demo Control Panel — hidden until Ctrl+D */}
      {demoPanel && (
        <div style={{
          position: 'fixed', bottom: '3rem', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(6,13,26,0.97)', border: '1px solid rgba(255,184,0,0.4)',
          borderRadius: '10px', padding: '1rem 1.5rem', zIndex: 9999,
          display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)', fontFamily: 'var(--font-mono)',
        }}>
          <span style={{ color: '#f59e0b', fontSize: '0.6rem', letterSpacing: '0.15em' }}>⚙ DEMO CONTROLS</span>
          {[
            { label: '⚡ INJECT SIGNAL', event: 'bazaar-demo-signal', color: '#ef4444' },
            { label: '🧠 AI BRIEFING', event: 'bazaar-trigger-briefing', color: '#8b5cf6' },
            { label: '✓ RUN Z3 AUDIT', event: 'bazaar-trigger-z3-audit', color: '#00ff88' },
          ].map(btn => (
            <button
              key={btn.event}
              onClick={() => {
                if (btn.event === 'bazaar-demo-signal') {
                  // Inject a demo-worthy signal directly into MambaBrain
                  import('../logic/MambaBrain').then(m => m.default.injectSignal('S1', {
                    priceChangePct: 7.8, volumeRatio: 0.42, tension: 0.91,
                    voltage: 62, waterLevel: 0.15, signal: 'BULLISH'
                  }));
                } else {
                  fire(btn.event);
                }
                setDemoPanel(false);
              }}
              style={{
                background: `${btn.color}18`, border: `1px solid ${btn.color}60`,
                color: btn.color, borderRadius: '6px', padding: '0.4rem 0.8rem',
                cursor: 'pointer', fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
              }}
            >{btn.label}</button>
          ))}
          <button onClick={() => setDemoPanel(false)}
            style={{ background: 'transparent', border: '1px solid #334155', color: '#475569',
              borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.55rem' }}>
            ✕ CLOSE
          </button>
        </div>
      )}

      <footer className="main-footer">
        <div className="sebi-disclaimer">
          ⚠️ Investment in securities market are subject to market risks. Read all the related documents carefully before investing. BAZAAR BRAIN provides algorithmic risk analysis, not financial advice.
        </div>
        <div className="footer-content-row">
          <div className="footer-left">
            Z3 PROOF: <span className="highlight">{solveTimeMs.toFixed(2)}ms</span> &nbsp;|&nbsp; 
            DEPTH: <span className="highlight">{tickCount}</span> &nbsp;|&nbsp; 
            NORM: <span className="highlight">{stateNorm.toFixed(3)}</span> &nbsp;|&nbsp;
            DATA: <span style={{ color: freshnessColor, fontFamily: 'var(--font-mono)', fontSize: '0.6rem' }}>
              {dataFreshness === 'LIVE' ? '● YAHOO FINANCE LIVE' 
                : dataFreshness === 'SIMULATION' ? '◑ SIMULATION' 
                : '○ MARKET CLOSED'}
            </span>
          </div>
          
          <div className="footer-center">
            BAZAAR BRAIN v1.0.0 &nbsp;|&nbsp; PS6 — AI FOR INDIAN INVESTOR
            {!demoPanel && <span style={{ color: '#334155', marginLeft: '1rem', fontSize: '0.5rem' }}>Ctrl+D</span>}
          </div>
          
          <div className="footer-right">
            SECTORS: <span className="highlight">8/8</span> &nbsp;|&nbsp; 
            LAST SIGNAL: <span className="highlight">{lastSignalTime || '--'}</span> &nbsp;|&nbsp; 
            SYNC: <span className="highlight">{syncAgeSeconds}s ago</span> &nbsp;|&nbsp; 
            AI: <span className={`ai-status ${aiClass}`}>{aiStatus}</span>
          </div>
        </div>
      </footer>
    </>
  );
}
