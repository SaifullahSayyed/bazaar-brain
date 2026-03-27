/**
 * PortfolioOverlay.jsx — MOD 5 (Phase 6)
 *
 * Chip-select UI for common NSE holdings.
 * Maps each holding to a sector ID in MarketStore.
 * Shows ⚠️ EXPOSED badge if that sector's auditResult is violated.
 * Shows ✅ SAFE confirmation when selected but sector is clean.
 */

import React, { useState } from 'react';
import { useMarketStore } from '../context/MarketStore';

/** Map common NSE holdings to their sector IDs */
const HOLDINGS = [
  { symbol: 'HDFCBANK',   label: 'HDFC Bank',       sectorId: 'S1', emoji: '🏦' },
  { symbol: 'ICICIBANK',  label: 'ICICI Bank',       sectorId: 'S1', emoji: '🏦' },
  { symbol: 'SBIN',       label: 'SBI',              sectorId: 'S1', emoji: '🏦' },
  { symbol: 'BANKBEES',   label: 'Banking ETF',      sectorId: 'S1', emoji: '📊' },
  { symbol: 'INFY',       label: 'Infosys',          sectorId: 'S2', emoji: '💻' },
  { symbol: 'TCS',        label: 'TCS',              sectorId: 'S2', emoji: '💻' },
  { symbol: 'WIPRO',      label: 'Wipro',            sectorId: 'S2', emoji: '💻' },
  { symbol: 'ITBEES',     label: 'IT ETF',           sectorId: 'S2', emoji: '📊' },
  { symbol: 'HINDUNILVR', label: 'HUL',              sectorId: 'S3', emoji: '🛒' },
  { symbol: 'ITC',        label: 'ITC',              sectorId: 'S3', emoji: '🛒' },
  { symbol: 'SUNPHARMA',  label: 'Sun Pharma',       sectorId: 'S4', emoji: '💊' },
  { symbol: 'DRREDDY',    label: "Dr Reddy's",       sectorId: 'S4', emoji: '💊' },
  { symbol: 'RELIANCE',   label: 'Reliance',         sectorId: 'S5', emoji: '⚡' },
  { symbol: 'ONGC',       label: 'ONGC',             sectorId: 'S5', emoji: '⚡' },
  { symbol: 'MARUTI',     label: 'Maruti',           sectorId: 'S6', emoji: '🚗' },
  { symbol: 'TATAMOTORS', label: 'Tata Motors',      sectorId: 'S6', emoji: '🚗' },
  { symbol: 'TATASTEEL',  label: 'Tata Steel',       sectorId: 'S7', emoji: '⚙️' },
  { symbol: 'JSWSTEEL',   label: 'JSW Steel',        sectorId: 'S7', emoji: '⚙️' },
  { symbol: 'DLF',        label: 'DLF',              sectorId: 'S8', emoji: '🏗️' },
];

export default function PortfolioOverlay() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const auditResult = useMarketStore(state => state.auditResult);
  const sectors     = useMarketStore(state => state.sectors);

  // Build a map of sectorId → safe status from live auditResult
  const sectorRiskMap = {};
  if (auditResult?.results) {
    for (const r of auditResult.results) {
      sectorRiskMap[r.sectorId] = r.safe;
    }
  } else {
    // If no audit yet, all sectors safe
    for (const h of HOLDINGS) { sectorRiskMap[h.sectorId] = true; }
  }

  // Count exposures among selected holdings
  const exposedHoldings = HOLDINGS.filter(h => selected.has(h.symbol) && !sectorRiskMap[h.sectorId]);
  const safeHoldings    = HOLDINGS.filter(h => selected.has(h.symbol) && sectorRiskMap[h.sectorId]);
  const exposedCount    = exposedHoldings.length;

  const toggleHolding = (symbol) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(symbol) ? next.delete(symbol) : next.add(symbol);
      return next;
    });
  };

  const headerBg = exposedCount > 0
    ? 'linear-gradient(90deg, rgba(255,68,68,0.08), rgba(10,22,40,0.6))'
    : selected.size > 0
    ? 'linear-gradient(90deg, rgba(0,255,136,0.05), rgba(10,22,40,0.6))'
    : 'rgba(10,22,40,0.5)';

  const containerStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.55rem',
    borderTop: '1px solid rgba(139,0,255,0.25)',
    borderBottom: '1px solid rgba(139,0,255,0.1)',
    marginBottom: '0.2rem',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0.5rem',
    cursor: 'pointer',
    background: headerBg,
    transition: 'background 0.3s ease',
    userSelect: 'none',
  };

  return (
    <div style={containerStyle}>
      {/* Collapsible Header */}
      <div style={headerStyle} onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.65rem' }}>💼</span>
          <span style={{ color: 'var(--color-ai)', letterSpacing: '0.12em' }}>MY PORTFOLIO</span>
          {selected.size > 0 && (
            <span style={{
              fontSize: '0.45rem',
              padding: '0.1rem 0.25rem',
              borderRadius: '2px',
              background: 'rgba(139,0,255,0.15)',
              color: 'rgba(139,0,255,0.9)',
            }}>
              {selected.size} held
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {selected.size > 0 && exposedCount > 0 && (
            <span style={{
              padding: '0.12rem 0.35rem',
              background: 'rgba(255,68,68,0.15)',
              border: '1px solid rgba(255,68,68,0.4)',
              color: '#ff4444',
              borderRadius: '3px',
              fontSize: '0.5rem',
              fontWeight: 'bold',
              animation: 'pulse 1.5s infinite',
            }}>
              ⚠️ {exposedCount} EXPOSED
            </span>
          )}
          {selected.size > 0 && exposedCount === 0 && (
            <span style={{
              padding: '0.12rem 0.35rem',
              background: 'rgba(0,255,136,0.1)',
              border: '1px solid rgba(0,255,136,0.3)',
              color: 'var(--color-bull)',
              borderRadius: '3px',
              fontSize: '0.5rem',
            }}>
              ✅ SAFE
            </span>
          )}
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
            {open ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Expanded Panel */}
      {open && (
        <div style={{ padding: '0.4rem 0.5rem', backgroundColor: 'rgba(5,15,30,0.6)' }}>
          {/* Exposure Summary */}
          {exposedCount > 0 && (
            <div style={{
              marginBottom: '0.4rem',
              padding: '0.3rem 0.4rem',
              background: 'rgba(255,68,68,0.08)',
              border: '1px solid rgba(255,68,68,0.25)',
              borderRadius: '3px',
              color: '#ff6666',
            }}>
              {exposedHoldings.map(h => h.label).join(', ')} — at risk. Z3 detected vulnerability in {' '}
              {[...new Set(exposedHoldings.map(h => h.sectorId))].join(', ')}.
            </div>
          )}
          {selected.size > 0 && exposedCount === 0 && (
            <div style={{
              marginBottom: '0.4rem',
              padding: '0.3rem 0.4rem',
              background: 'rgba(0,255,136,0.05)',
              border: '1px solid rgba(0,255,136,0.2)',
              borderRadius: '3px',
              color: 'var(--color-bull)',
            }}>
              All held positions in Z3-verified safe sectors.
            </div>
          )}

          {/* Holding Chips by Sector */}
          {['S1','S2','S3','S4','S5','S6','S7','S8'].map(sectorId => {
            const sectorHoldings = HOLDINGS.filter(h => h.sectorId === sectorId);
            const sectorData = sectors?.find(s => s.id === sectorId);
            const isRisky = !sectorRiskMap[sectorId];
            const sectorName = sectorData?.name?.split(' ')[0] || sectorId;

            return (
              <div key={sectorId} style={{ marginBottom: '0.4rem' }}>
                <div style={{
                  color: isRisky ? '#ff6666' : 'rgba(255,255,255,0.3)',
                  marginBottom: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}>
                  <span>{sectorId}</span>
                  <span style={{ opacity: 0.8 }}>{sectorName}</span>
                  {isRisky && <span style={{ color: '#ff4444' }}>⚠</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {sectorHoldings.map(h => {
                    const isSelected = selected.has(h.symbol);
                    const isExposed  = isSelected && isRisky;

                    return (
                      <button
                        key={h.symbol}
                        onClick={() => toggleHolding(h.symbol)}
                        style={{
                          padding: '0.18rem 0.35rem',
                          border: isExposed
                            ? '1px solid rgba(255,68,68,0.6)'
                            : isSelected
                            ? '1px solid rgba(0,255,136,0.5)'
                            : '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '3px',
                          background: isExposed
                            ? 'rgba(255,68,68,0.12)'
                            : isSelected
                            ? 'rgba(0,255,136,0.08)'
                            : 'rgba(255,255,255,0.04)',
                          color: isExposed
                            ? '#ff6666'
                            : isSelected
                            ? 'var(--color-bull)'
                            : 'rgba(255,255,255,0.5)',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.5rem',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        <span>{h.emoji}</span>
                        <span>{h.label}</span>
                        {isExposed && <span>⚠</span>}
                        {isSelected && !isExposed && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.44rem', marginTop: '0.3rem' }}>
            Exposure updates in real-time with Z3 audit results.
          </div>
        </div>
      )}
    </div>
  );
}
