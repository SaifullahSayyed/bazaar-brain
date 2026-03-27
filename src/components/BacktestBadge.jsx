/**
 * BacktestBadge.jsx — MOD 3 (Phase 6)
 *
 * Fetches live backtest data from the server's /backtest-stats endpoint
 * and renders a glassmorphism historical validation card in the sidebar.
 */

import React, { useEffect, useState } from 'react';

const SERVER_URL = 'http://localhost:8080';

export default function BacktestBadge() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchStats() {
      try {
        const res = await fetch(`${SERVER_URL}/backtest-stats`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error(`Server ${res.status}`);
        const data = await res.json();
        if (mounted) {
          setStats(data);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setError(true);
          setLoading(false);
        }
      }
    }
    fetchStats();
    return () => { mounted = false; };
  }, []);

  // Compute accuracy bar width
  const accuracy = stats ? parseFloat(stats.accuracy) : 0;
  const falsePosRate = stats ? (100 - accuracy).toFixed(1) : 0;

  const containerStyle = {
    backgroundColor: 'rgba(0, 255, 136, 0.03)',
    borderTop: '1px solid rgba(0, 255, 136, 0.2)',
    borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
    padding: '0.6rem 0.5rem',
    margin: '0.2rem 0',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.55rem',
    lineHeight: '1.4',
    color: 'var(--color-text-secondary)',
    backdropFilter: 'blur(4px)',
  };

  const headerStyle = {
    color: 'var(--color-bull)',
    fontWeight: 'bold',
    letterSpacing: '0.1em',
    marginBottom: '0.4rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const badgeStyle = {
    fontSize: '0.45rem',
    padding: '0.1rem 0.3rem',
    background: loading
      ? 'rgba(255,165,0,0.15)'
      : error
      ? 'rgba(255,68,68,0.15)'
      : 'rgba(0,255,136,0.1)',
    color: loading
      ? 'var(--color-warning)'
      : error
      ? 'var(--color-bear)'
      : 'var(--color-bull)',
    borderRadius: '2px',
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span>HISTORICAL BACKTEST (2YR)</span>
          <span style={badgeStyle}>LOADING…</span>
        </div>
        <div style={{ opacity: 0.5 }}>Fetching backtest data from server…</div>
      </div>
    );
  }

  if (error || !stats) {
    // Graceful fallback to hardcoded data if server unreachable
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span>HISTORICAL BACKTEST (2YR · 7-DAY WINDOW)</span>
          <span style={badgeStyle}>OFFLINE</span>
        </div>
        <div style={{ marginBottom: '0.3rem' }}>
          <span style={{ color: 'var(--color-text-primary)' }}>Bazaar Brain detected 180 momentum traps</span>
          {' '}across Mar 2024 – Mar 2026 on real NSE index data.
        </div>
        <div style={{ marginBottom: '0.3rem' }}>
          <span style={{ color: 'var(--color-warning)' }}>68 traps (37.8%)</span>
          {' '}confirmed by ≥1% drawdown within{' '}
          <span style={{ color: 'var(--color-text-primary)' }}>7 trading days</span>.
          {' '}NIFTY ENERGY: <span style={{ color: 'var(--color-bull)' }}>50%</span>.
        </div>
        <div style={{ marginBottom: '0.2rem', fontSize: '0.48rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          Source: Yahoo Finance · Method: 5d surge &gt;2.5% + &lt;0.75x vol → 7d drawdown
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
          <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '2px', marginRight: '0.5rem', borderRadius: '1px' }}>
            <div style={{ width: '37.8%', backgroundColor: 'var(--color-bull)', height: '100%', borderRadius: '1px', boxShadow: '0 0 5px var(--color-bull)' }} />
          </div>
          <span style={{ color: 'var(--color-bear)', fontSize: '0.5rem' }}>Unconfirmed: 62.2%</span>
        </div>
      </div>
    );
  }

  const validConfirmed = stats.validated ?? Math.round((accuracy / 100) * stats.detected);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span>HISTORICAL BACKTEST (2YR · 7-DAY WINDOW)</span>
        <span style={badgeStyle}>LIVE DATA</span>
      </div>
      <div style={{ marginBottom: '0.3rem' }}>
        <span style={{ color: 'var(--color-text-primary)' }}>
          Detected{' '}
          <span style={{ color: 'var(--color-bull)', fontWeight: 'bold' }}>{stats.detected}</span> momentum traps
        </span>
        {' '}across {stats.dateRange} on real NSE index data.
      </div>
      <div style={{ marginBottom: '0.3rem' }}>
        <span style={{ color: 'var(--color-warning)' }}>
          {validConfirmed} ({accuracy}%)
        </span>
        {' '}confirmed by ≥1% drawdown within{' '}
        <span style={{ color: 'var(--color-text-primary)' }}>7 trading days</span>.
      </div>
      <div style={{ marginBottom: '0.32rem', fontSize: '0.48rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
        Source: Yahoo Finance · Method: 5d surge &gt;2.5% + &lt;0.75x vol → 7d drawdown
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
        <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '2px', marginRight: '0.5rem', borderRadius: '1px' }}>
          <div
            style={{
              width: `${Math.min(accuracy, 100)}%`,
              backgroundColor: accuracy >= 35 ? 'var(--color-bull)' : 'var(--color-warning)',
              height: '100%',
              borderRadius: '1px',
              boxShadow: `0 0 5px ${accuracy >= 35 ? 'var(--color-bull)' : 'var(--color-warning)'}`,
              transition: 'width 0.8s ease',
            }}
          />
        </div>
        <span style={{ color: 'var(--color-bear)', fontSize: '0.5rem' }}>Unconfirmed: {falsePosRate}%</span>
      </div>
    </div>
  );
}
