import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

export default function AICommanderPanel({ auditResult, directive, onAcknowledge }) {
  if (!auditResult) return null;

  const parts = (directive || '').split('HINDI:');
  const englishText = parts[0]?.trim() || '';
  const hindiText = parts[1]?.trim() || '';

  const { displayed: engDisplayed, done: engDone } = useTypewriter(englishText, 22);
  const { displayed: hindiDisplayed } = useTypewriter(engDone ? hindiText : '', 18);

  const { ruleName, mathematicalProof, violatingSectorName, violatingMetrics, severity } = auditResult;

  return (
    <div className="aic-overlay">
      <div className="aic-animated-border" />
      
      <motion.div 
        className="aic-card"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className="aic-header">
          ⚡ AI MARKET COMMANDER — ACTIVE
        </div>

        <div className="aic-proof-box">
          <span className="aic-proof-label">MATHEMATICAL PROOF</span>
          <div className="aic-proof-rule">{ruleName}</div>
          <div className="aic-proof-math">{mathematicalProof}</div>
        </div>

        <div className="aic-directive-box">
          <span className="aic-directive-label">AI MARKET DIRECTIVE</span>
          <div className="aic-eng-text">{engDisplayed}</div>
          
          {engDone && hindiText && (
            <>
              <div className="aic-hindi-divider" />
              <div className="aic-hindi-text">{hindiDisplayed}</div>
            </>
          )}
        </div>

        <div className="aic-telemetry-row">
          <div className="aic-tel-col">
            <div className="aic-tel-label">SECTOR</div>
            <div className="aic-tel-value">{violatingSectorName}</div>
          </div>
          <div className="aic-tel-col">
            <div className="aic-tel-label">PRICE MOVE</div>
            <div className="aic-tel-value">{violatingMetrics?.priceChangePct?.toFixed(2) || '0.00'}%</div>
          </div>
          <div className="aic-tel-col">
            <div className="aic-tel-label">VOLUME</div>
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
      </motion.div>
    </div>
  );
}
