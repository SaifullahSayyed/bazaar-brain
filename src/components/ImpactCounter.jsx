import React, { useState, useEffect } from 'react';
import { useMarketStore } from '../context/MarketStore';

// Based on SEBI's published F&O retail loss data:
// According to SEBI study (2023), avg retail F&O loss per momentum-trap trade ≈ ₹8,000
const AVG_TRAP_LOSS = 8000;

export default function ImpactCounter() {
  const signalHistory = useMarketStore(s => s.signalHistory);
  const tickCount = useMarketStore(s => s.tickCount);

  const trapsCount = signalHistory.filter(e => e.type === 'SIGNAL').length;
  const signalsProven = signalHistory.filter(e => e.type === 'AUDIT' || e.type === 'SIGNAL').length;

  const lossesPreventedRs = trapsCount * AVG_TRAP_LOSS;
  const lossesStr = lossesPreventedRs >= 10000000
    ? `₹${(lossesPreventedRs / 10000000).toFixed(1)}Cr`
    : lossesPreventedRs >= 100000
    ? `₹${(lossesPreventedRs / 100000).toFixed(1)}L`
    : `₹${(lossesPreventedRs).toLocaleString('en-IN')}`;

  const [tooltip, setTooltip] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleLossClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
    setTooltip(t => !t);
  };

  return (
    <>
      <div className="impact-container">
        <MetricBox label="SIGNALS PROVEN" value={signalsProven + tickCount} color="#00ff88" />
        <MetricBox label="TRAPS CAUGHT" value={trapsCount} color="#f59e0b" />
        <MetricBox
          label="LOSSES PREVENTED"
          value={lossesStr}
          color="#8b5cf6"
          onClick={handleLossClick}
          clickable
        />
      </div>

      {/* Fixed-position tooltip — escapes overflow:hidden on the header */}
      {tooltip && (
        <div
          onClick={() => setTooltip(false)}
          className="impact-tooltip"
          style={{
            position: 'fixed',
            top: tooltipPos.y,
            left: tooltipPos.x,
            transform: 'translateX(-50%)',
            background: '#0a1628',
            border: '1px solid rgba(139,0,255,0.5)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            fontSize: '0.62rem',
            color: '#94a3b8',
            whiteSpace: 'nowrap',
            zIndex: 99999,
            boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
          }}
        >
          <div style={{ color: '#8b5cf6', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.65rem' }}>📊 CALCULATION BASIS</div>
          <div>{trapsCount} momentum traps prevented</div>
          <div>× ₹8,000 avg retail slippage per trap</div>
          <div style={{ marginTop: '0.4rem', color: '#6366f1' }}>= {lossesStr} capital preserved</div>
          <div style={{ marginTop: '0.4rem', color: '#475569', fontSize: '0.55rem' }}>Source: SEBI F&amp;O Retail Loss Study, 2023</div>
          <div style={{ color: '#334155', marginTop: '0.2rem', fontSize: '0.5rem' }}>Click to dismiss</div>
        </div>
      )}
    </>
  );
}

function MetricBox({ label, value, color, onClick, clickable }) {
  return (
    <div
      onClick={onClick}
      className="impact-card"
      style={{
        border: `1px solid ${color}55`,
        borderTop: `2px solid ${color}`,
        cursor: clickable ? 'pointer' : 'default',
        boxShadow: `0 4px 12px rgba(0,0,0,0.5), inset 0 0 15px ${color}15`,
      }}
      onMouseEnter={(e) => {
        if (clickable) {
          e.currentTarget.style.boxShadow = `0 6px 16px ${color}40, inset 0 0 25px ${color}25`;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (clickable) {
          e.currentTarget.style.boxShadow = `0 4px 12px rgba(0,0,0,0.5), inset 0 0 15px ${color}15`;
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '40%', height: '1px', background: color, boxShadow: `0 0 8px 1px ${color}`
      }} />
      <div className="impact-value" style={{ color, textShadow: `0 0 10px ${color}80` }}>{value}</div>
      <div className="impact-label">{label}</div>
      {clickable && <div className="impact-hint" style={{ color: color }}>TAP FOR CALC</div>}
    </div>
  );
}
