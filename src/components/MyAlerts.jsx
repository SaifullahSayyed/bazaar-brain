import React, { useState } from 'react';
import { useMarketStore } from '../context/MarketStore';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_COLORS = {
  SIGNAL: '#ef4444',
  AUDIT: '#00ff88',
  NEAR_MISS: '#f59e0b',
  BRIEFING: '#8b5cf6',
  STATUS_CHECK: '#64748b',
};

const TYPE_ICONS = {
  SIGNAL: '⚡',
  AUDIT: '✓',
  NEAR_MISS: '⚠',
  BRIEFING: '🧠',
  STATUS_CHECK: '◎',
};

export default function MyAlerts() {
  const signalHistory = useMarketStore(s => s.signalHistory);
  const [filter, setFilter] = useState('ALL');

  const filters = ['ALL', 'SIGNAL', 'AUDIT', 'NEAR_MISS', 'BRIEFING'];

  const filtered = filter === 'ALL'
    ? signalHistory
    : signalHistory.filter(e => e.type === filter);

  const clearAll = () => useMarketStore.getState().pushSignalEvent && window.location.reload();

  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.62rem',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '0.5rem 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#00ff88', letterSpacing: '0.15em', fontSize: '0.55rem' }}>MY ALERTS</span>
        <span style={{ color: '#334155' }}>{signalHistory.length} events</span>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.3rem', padding: '0.4rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? 'rgba(0,255,136,0.15)' : 'transparent',
              color: filter === f ? '#00ff88' : '#475569',
              border: `1px solid ${filter === f ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '3px',
              padding: '0.15rem 0.4rem',
              cursor: 'pointer',
              fontSize: '0.5rem',
              letterSpacing: '0.08em',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.3rem 0' }}>
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div style={{ color: '#334155', textAlign: 'center', padding: '2rem 1rem', fontSize: '0.6rem' }}>
              No alerts yet. Market is being monitored.
            </div>
          ) : (
            filtered.map((evt, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                style={{
                  padding: '0.5rem 0.6rem',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  borderLeft: `3px solid ${TYPE_COLORS[evt.type] || '#334155'}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                  <span style={{ color: TYPE_COLORS[evt.type] || '#64748b', fontWeight: 'bold' }}>
                    {TYPE_ICONS[evt.type] || '◎'} {evt.type}
                  </span>
                  <span style={{ color: '#334155' }}>{evt.time}</span>
                </div>
                <div style={{ color: '#94a3b8', lineHeight: 1.4 }}>
                  {evt.text}
                </div>
                {evt.sector && (
                  <div style={{ color: '#475569', marginTop: '0.2rem', fontSize: '0.5rem' }}>
                    Sector: {evt.sector}
                  </div>
                )}
                {evt.proof && (
                  <div style={{ color: '#334155', marginTop: '0.2rem', fontSize: '0.5rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {evt.proof.slice(0, 100)}...
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
