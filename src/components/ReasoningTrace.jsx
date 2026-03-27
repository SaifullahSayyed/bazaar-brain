import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketStore } from '../context/MarketStore';
import '../styles/ReasoningTrace.css';

function ReasoningTrace() {
  const [expanded, setExpanded] = useState(false);
  const runManualAudit = () => {
    window.dispatchEvent(new CustomEvent('bazaar-trigger-z3-audit'));
  };
  const signalHistory = useMarketStore(state => state.signalHistory);
  const auditResult = useMarketStore(state => state.auditResult);

  // Expanded content — last 10 events in reverse
  const recentEvents = [...signalHistory].reverse().slice(0, 10);

  const getEventIcon = (type) => {
    if (type === 'SIGNAL') return '⚡';
    if (type === 'BRIEFING') return '🧠';
    if (type === 'NEAR_MISS') return '⚠';
    if (type === 'AUDIT') return '✓';
    return '◎';
  };

  const getEventColor = (type) => {
    if (type === 'SIGNAL') return 'evt-bear';
    if (type === 'BRIEFING') return 'evt-ai';
    if (type === 'NEAR_MISS') return 'evt-warn';
    return 'evt-neutral';
  };

  return (
    <div className="trace-container">
      <div className="trace-header" onClick={() => setExpanded(!expanded)}>
        <div className="trace-header-content">
          <span className="trace-label">AI REASONING TRACE</span>
          <span className="trace-count">{signalHistory.length}</span>
          <button 
            className="z3-force-btn"
            onClick={(e) => { e.stopPropagation(); runManualAudit(); }}
            style={{
              marginLeft: 'auto',
              background: 'var(--color-proof)',
              color: 'black',
              border: 'none',
              borderRadius: '2px',
              fontSize: '0.55rem',
              padding: '2px 6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            RUN Z3 AUDIT
          </button>
        </div>
        <motion.div 
          animate={{ rotate: expanded ? 180 : 0 }} 
          className="trace-arrow"
        >
          ▼
        </motion.div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            className="trace-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {/* Show live Z3 math proof if current audit has a result */}
            {auditResult && (
              <div style={{
                background: auditResult.safe ? 'rgba(0,255,136,0.07)' : 'rgba(255,34,34,0.07)',
                border: `1px solid ${auditResult.safe ? 'var(--color-bull)' : 'var(--color-bear)'}`,
                borderRadius: '4px',
                padding: '0.5rem',
                marginBottom: '0.5rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
              }}>
                <div style={{ color: auditResult.safe ? 'var(--color-bull)' : 'var(--color-bear)', fontWeight: 'bold', marginBottom: '0.3rem' }}>
                  {auditResult.safe ? '✓ Z3 PROOF COMPLETE — SAFE' : `⚡ Z3 VIOLATION — ${auditResult.ruleName || 'RISK DETECTED'}`}
                </div>
                {/* Show the actual mathematical proof formula */}
                {auditResult.mathematicalProof && (
                  <div style={{ color: 'var(--color-neutral)', fontFamily: 'monospace', fontSize: '0.58rem', marginBottom: '0.3rem', wordBreak: 'break-all' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>FORMULA: </span>
                    {auditResult.mathematicalProof}
                  </div>
                )}
                {/* Show the metrics that triggered the rule */}
                {auditResult.violatingMetrics && (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.55rem' }}>
                    <span style={{ color: 'var(--color-neutral)' }}>METRICS: </span>
                    {Object.entries(auditResult.violatingMetrics).map(([k, v]) => 
                      `${k}=${typeof v === 'number' ? v.toFixed(2) : v}`
                    ).join(' | ')}
                  </div>
                )}
                {/* Show proof solve time */}
                {auditResult.solveTimeMs !== undefined && (
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.5rem', marginTop: '0.2rem' }}>
                    Solved in {auditResult.solveTimeMs.toFixed(3)}ms
                  </div>
                )}
              </div>
            )}

            {recentEvents.map((evt, idx) => (
              <motion.div 
                key={idx}
                className={`trace-card ${getEventColor(evt.type)}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="tc-row-1">
                  <span className="tc-icon">{getEventIcon(evt.type)}</span>
                  <span className="tc-type">{evt.type}</span>
                  <span className="tc-time">{evt.time}</span>
                </div>
                <div className="tc-row-2">
                  {/* Show full text for AUDIT events, truncate others */}
                  {evt.type === 'AUDIT' ? evt.text : (evt.text.length > 80 ? evt.text.slice(0, 80) + '...' : evt.text)}
                </div>
                {/* Show mathematical proof inline if the event carries it */}
                {evt.proof && (
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: '0.52rem',
                    color: 'var(--color-neutral)',
                    marginTop: '0.2rem',
                    wordBreak: 'break-all',
                    opacity: 0.8
                  }}>
                    {evt.proof}
                  </div>
                )}
                {evt.type === 'SIGNAL' && evt.sector && (
                  <div className="tc-row-3">
                    [ {evt.sector} ]
                  </div>
                )}
              </motion.div>
            ))}
            
            {recentEvents.length === 0 && (
              <div className="trace-empty">Click RUN Z3 AUDIT to begin formal verification.</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default React.memo(ReasoningTrace);
