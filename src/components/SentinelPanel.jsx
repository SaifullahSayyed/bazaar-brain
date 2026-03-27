/**
 * SentinelPanel.jsx — Bazaar Brain Sentinel Cross-Sector Contagion Alert
 *
 * Displays real-time predictions from SentinelEngine: when Sector A's stress
 * is about to propagate to Sector B, before Sector B itself triggers Z3.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const getConfColor = (conf) =>
  conf === 'HIGH' ? '#ff2222' : conf === 'MEDIUM' ? '#ff8800' : '#ffb800';

const getConfRgb = (conf) =>
  conf === 'HIGH' ? '255,34,34' : conf === 'MEDIUM' ? '255,136,0' : '255,184,0';

export default function SentinelPanel({ alerts = [] }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Auto-expand the latest alert
  useEffect(() => {
    if (alerts.length > 0) setExpandedIndex(0);
  }, [alerts.length]);

  const hasAlerts = alerts.length > 0;

  return (
    <div style={{ padding: '0.5rem 0.4rem 0.4rem', borderTop: '1px solid rgba(255,136,0,0.25)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '0.52rem',
          color: hasAlerts ? '#ff8800' : 'var(--color-text-muted)',
          letterSpacing: '0.2em',
          textShadow: hasAlerts ? '0 0 8px rgba(255,136,0,0.7)' : 'none',
          transition: 'color 0.5s',
        }}>
          {hasAlerts ? '⚡' : '○'} SENTINEL
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.5rem', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
          {hasAlerts ? `${alerts.length} PROPAGATION${alerts.length > 1 ? 'S' : ''} DETECTED` : 'MONITORING'}
        </span>
      </div>

      {/* No-alert quiet state */}
      {!hasAlerts && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.58rem',
          color: 'rgba(255,255,255,0.22)',
          textAlign: 'center',
          padding: '0.5rem 0',
          letterSpacing: '0.08em',
        }}>
          ∀ pairs: corr &lt; 0.80 — no contagion detected
        </div>
      )}

      {/* Alert cards */}
      <AnimatePresence>
        {alerts.slice(0, 2).map((alert, idx) => {
          const rgb = getConfRgb(alert.confidence);
          const col = getConfColor(alert.confidence);
          const isExpanded = expandedIndex === idx;

          return (
            <motion.div
              key={`${alert.leadingSectorId}-${alert.laggingSectorId}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              style={{
                marginBottom: '0.35rem',
                borderRadius: '0.5rem',
                overflow: 'hidden',
                border: `1px solid rgba(${rgb}, 0.5)`,
                background: `linear-gradient(160deg, rgba(${rgb},0.07) 0%, rgba(6,13,26,0.95) 55%)`,
                boxShadow: `0 0 14px rgba(${rgb}, 0.12)`,
                cursor: 'pointer',
              }}
              onClick={() => setExpandedIndex(isExpanded ? null : idx)}
            >
              {/* Accent bar */}
              <div style={{
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${col}, transparent)`,
                boxShadow: `0 0 6px ${col}`,
              }} />

              <div style={{ padding: '0.5rem 0.65rem' }}>
                {/* Row 1: Confidence badge + sector labels */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <motion.span
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    style={{
                      fontSize: '0.55rem', fontWeight: 'bold', letterSpacing: '0.08em',
                      color: col,
                      background: `rgba(${rgb},0.15)`,
                      border: `1px solid rgba(${rgb},0.55)`,
                      borderRadius: '0.2rem',
                      padding: '0.08rem 0.35rem',
                      whiteSpace: 'nowrap',
                      boxShadow: `0 0 6px rgba(${rgb},0.25)`,
                    }}
                  >
                    {alert.confidence} RISK
                  </motion.span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 'bold',
                    color: 'var(--color-text-bright)', letterSpacing: '0.02em',
                  }}>
                    {alert.leadingSector.split(' ')[0]}
                  </span>
                  <span style={{ color: col, fontSize: '0.7rem' }}>→</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 'bold',
                    color: 'var(--color-text-bright)',
                  }}>
                    {alert.laggingSector.split(' ')[0]}
                  </span>
                </div>

                {/* Row 2: Correlation bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.18rem' }}>
                  <span style={{ fontSize: '0.5rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>CORRELATION</span>
                  <span style={{ fontSize: '0.5rem', color: col, letterSpacing: '0.05em' }}>{(alert.correlation * 100).toFixed(0)}%</span>
                </div>
                <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginBottom: '0.3rem' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${alert.correlation * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: '2px', background: `linear-gradient(90deg, ${col}, rgba(255,255,255,0.4))`, boxShadow: `0 0 5px ${col}` }}
                  />
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.6rem',
                        color: 'var(--color-text-primary)', lineHeight: 1.6, marginBottom: '0.3rem',
                      }}>
                        {alert.leadingSector} stress (Δ{alert.tensionDelta > 0 ? '+' : ''}{(alert.tensionDelta * 100).toFixed(1)}%) is propagating to {alert.laggingSector}.
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <div style={{
                          fontSize: '0.55rem', borderRadius: '1rem', padding: '0.1rem 0.4rem',
                          border: '1px solid var(--color-neutral)', color: 'var(--color-neutral)',
                          background: 'rgba(0,255,255,0.06)', letterSpacing: '0.07em',
                        }}>
                          ◷ ETA {alert.estimatedEta}
                        </div>
                        <div style={{
                          fontSize: '0.55rem', borderRadius: '1rem', padding: '0.1rem 0.4rem',
                          border: `1px solid rgba(${rgb},0.4)`, color: col,
                          background: `rgba(${rgb},0.06)`, letterSpacing: '0.07em',
                        }}>
                          r = {alert.correlation.toFixed(3)}
                        </div>
                      </div>
                      <div style={{ marginTop: '0.3rem', fontSize: '0.52rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                        ⏱ {alert.timestamp}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
