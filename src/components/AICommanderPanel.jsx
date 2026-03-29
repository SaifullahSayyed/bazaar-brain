import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMarketStore } from '../context/MarketStore';
import '../styles/AICommanderPanel.css';

function useTypewriter(text, speed=22) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  
  useEffect(() => {
    if (!text) return;
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  
  return { displayed, done };
}

import ThinkingTrace from './ThinkingTrace';

const COMMANDER_SYNC_TRACE = [
  "> SYNCING: Connecting to Z3 WASM Cluster...",
  "> LOADING: Market Heuristics (Rule set v4.2)...",
  "> AUDITING: Multi-sector sat check in-progress...",
  "> STATUS: [SAT] — Violation detected.",
  "> CONTEXT: Mapping user portfolio exposure...",
  "> READY: Commander Directive Locked."
];

export default function AICommanderPanel({ auditResult, directive, onAcknowledge }) {
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsSyncing(false), 2400); // Simulated Z3 sync
    return () => clearTimeout(timer);
  }, [auditResult?.violatingSectorId]);

  if (!auditResult) return null;

  const parts = (directive || '').split('HINDI:');
  const englishText = parts[0]?.trim() || '';
  const hindiText = parts[1]?.trim() || '';

  const { displayed: engDisplayed, done: engDone } = useTypewriter(!isSyncing ? englishText : '', 22);
  const { displayed: hindiDisplayed } = useTypewriter(engDone ? hindiText : '', 18);

  const { ruleName, mathematicalProof, violatingSectorName, violatingSectorId, violatingMetrics, severity } = auditResult;
  
  // MOD 5: Portfolio Integration
  const userPortfolio = useMarketStore(state => state.userPortfolio);
  const educationMode = useMarketStore(state => state.educationMode);
  
  const portfolioSector = userPortfolio?.[violatingSectorId];
  let riskAmount = 0;
  if (portfolioSector && violatingMetrics) {
    const dropPct = Math.abs(violatingMetrics.priceChangePct || 10) / 100;
    riskAmount = (portfolioSector.invested * dropPct).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('aic-overlay')) {
      onAcknowledge();
    }
  };

  return (
    <div className="aic-overlay" onClick={handleOverlayClick}>
      <div className="aic-animated-border" />
      
      <motion.div 
        className="aic-card"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="aic-header">
          {isSyncing ? '⚡ Z3 ENGINE — SYNCHRONIZING...' : '⚡ AI MARKET COMMANDER — ACTIVE'}
          {!isSyncing && (
            <button className="aic-close-x" onClick={onAcknowledge}>×</button>
          )}
        </div>

        {isSyncing ? (
          <div className="aic-sync-container" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ThinkingTrace isOpen={true} lines={COMMANDER_SYNC_TRACE} className="tt-inline" />
          </div>
        ) : (
          <>
            {educationMode && (
              <div className="aic-edu-banner">
                🎓 <strong>EDUCATION MODE:</strong> Z3 Engine uses formal verification to prove that current market conditions (Price/Volume) violate stability rules.
              </div>
            )}
            {portfolioSector && (
              <motion.div 
                className="aic-portfolio-alert"
// ... (rest of the code remains similar but with edu tooltips)
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{
                  background: 'linear-gradient(90deg, rgba(255,215,0,0.15), rgba(255,34,34,0.15))',
                  border: '1px solid #FFD700',
                  borderLeft: '4px solid #FFD700',
                  padding: '1rem',
                  marginBottom: '1rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <div style={{ fontSize: '1.4rem' }}>⚠️</div>
                <div>
                  <div style={{ color: '#FFD700', fontWeight: 'bold', fontFamily: "'Orbitron', sans-serif", letterSpacing: '0.05em', marginBottom: '0.15rem' }}>
                    YOUR PORTFOLIO EXPOSED: -₹{riskAmount}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                    Detected cascading risk in your <strong>{portfolioSector.name}</strong> holdings (Invested: ₹{portfolioSector.invested.toLocaleString('en-IN')}).
                  </div>
                </div>
              </motion.div>
            )}
            <div className="aic-proof-box">
              <span className="aic-proof-label">
                MATHEMATICAL PROOF
                {educationMode && <span className="edu-info-tag" title="SMT-LIB2 code used by Z3 to prove this market state is unsafe.">?</span>}
              </span>
              <div className="aic-proof-rule">{ruleName}</div>
              <div className="aic-proof-math">{mathematicalProof}</div>
            </div>

            <div className="aic-directive-box">
              <span className="aic-directive-label">AI MARKET DIRECTIVE</span>
              <div className="aic-eng-text">{engDisplayed}</div>
              
              {engDone && hindiText && (
                <motion.div 
                  className="aic-hindi-section"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="aic-hindi-divider" />
                  <span className="aic-hindi-label">REGIONAL LANGUAGE — HINDI</span>
                  <div className="aic-hindi-text" style={{ fontSize: '1.4rem', color: 'var(--color-bull)', textShadow: '0 0 10px rgba(0,255,136,0.3)' }}>
                    {hindiDisplayed}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="aic-telemetry-row">
              <div className="aic-tel-col">
                <div className="aic-tel-label">SECTOR</div>
                <div className="aic-tel-value">{violatingSectorName}</div>
              </div>
              <div className="aic-tel-col">
                <div className="aic-tel-label">
                  PRICE MOVE
                  {educationMode && <span className="edu-info-tag" title="Percentage change in price over the last 700ms tick.">?</span>}
                </div>
                <div className="aic-tel-value">{violatingMetrics?.priceChangePct?.toFixed(2) || '0.00'}%</div>
              </div>
              <div className="aic-tel-col">
                <div className="aic-tel-label">
                  VOLUME
                  {educationMode && <span className="edu-info-tag" title="Current volume vs 5-day moving average.">?</span>}
                </div>
                <div className="aic-tel-value">{violatingMetrics?.volumeRatio?.toFixed(2) || '1.00'}x</div>
              </div>
            </div>

            <div className="aic-metadata-row">
              Z3 Engine: {auditResult.solveTimeMs?.toFixed(2) || 'N/A'}ms · Severity: {severity} · Rule: {ruleName}
            </div>

            <motion.button 
              className="aic-ack-btn"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,255,136,0.15)', boxShadow: 'var(--glow-bull)' }}
              onClick={onAcknowledge}
            >
              [ ACKNOWLEDGE & RESUME MONITORING ]
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}
