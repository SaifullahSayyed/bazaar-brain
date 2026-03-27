import React from 'react';
import { motion } from 'framer-motion';
import { X, Activity } from 'lucide-react';
import '../styles/SectorPopup.css'; // We'll rely on some existing generic CSS or write inline styles

export default function SectorBreakdownPanel({ sector, stocks, isLoading, onClose, onStockClick }) {
  if (!sector) return null;

  const bullishCount = stocks.filter(s => s.signal === 'BULLISH').length;
  const safeCount = stocks.filter(s => s.zoneStatus === 'SAFE').length;
  const volConfirmed = stocks.filter(s => s.volumeConfirmed).length;
  
  const healthScore = Math.round(
    (bullishCount / 3 * 40) +
    (safeCount / 3 * 40) +
    (volConfirmed / 3 * 20)
  );

  let scoreColor = 'var(--color-bear)';
  let scoreText = 'Sector under stress — exercise caution';
  if (healthScore >= 70) {
    if (healthScore >= 85) scoreText = 'Strong sector — broad participation';
    else scoreText = 'Healthy sector with momentum';
    scoreColor = 'var(--color-bull)';
  } else if (healthScore >= 40) {
    scoreColor = 'var(--color-warning)';
    scoreText = 'Mixed signals — selective approach';
  }

  // gradient fill to healthScore%: linear-gradient(90deg, #FF2222 0%, #FFB800 40%, #00FF88 70%, #00FFFF 100%)
  const gradientFill = `linear-gradient(90deg, #FF2222 0%, #FFB800 40%, #00FF88 70%, #00FFFF 100%)`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.97 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        right: '24rem',
        bottom: '1rem',
        zIndex: 60,
        width: '420px',
        maxHeight: '80vh',
        overflowY: 'auto',
        background: 'rgba(4,8,20,0.97)',
        border: '1px solid var(--color-border-bright)',
        borderRadius: '0.75rem',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 15px rgba(0,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'var(--font-sans)',
        color: 'var(--color-text)'
      }}
    >
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <span style={{
            background: 'rgba(0,102,255,0.2)',
            border: '1px solid var(--color-neon-blue)',
            borderRadius: '0.3rem',
            padding: '0.2rem 0.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--color-neon-blue)',
            marginRight: '0.5rem'
          }}>
            {sector.id}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-bright)' }}>
            {sector.name.toUpperCase()}
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            {sector.nifty}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', outline: 'none' }}>
          <X size={20} />
        </button>
      </div>

      {/* SECTOR SUMMARY ROW */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', background: 'rgba(10,22,40,0.6)',
        borderRadius: '0.5rem', padding: '0.6rem 1rem', margin: '1rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>SECTOR CHANGE</span>
          <span style={{ color: sector.priceChangePct >= 0 ? 'var(--color-bull)' : 'var(--color-bear)', fontWeight: 'bold', fontSize: '0.85rem' }}>
            {sector.priceChangePct > 0 ? '+' : ''}{(sector.priceChangePct || 0).toFixed(2)}%
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>BREADTH</span>
          <span style={{ color: bullishCount >= 2 ? 'var(--color-bull)' : 'var(--color-bear)', fontWeight: 'bold', fontSize: '0.85rem' }}>
            {bullishCount}/3 Bullish
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>Z3 STATUS</span>
          <span style={{ color: sector.auditResult?.safe ? 'var(--color-bull)' : 'var(--color-bear)', fontWeight: 'bold', fontSize: '0.85rem' }}>
            {sector.auditResult?.safe ? 'SAFE ✓' : 'SIGNAL ⚡'}
          </span>
        </div>
      </div>

      {/* STOCK LIST */}
      <div style={{ padding: '0.5rem 1rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--color-text-muted)', letterSpacing: '0.4em', marginBottom: '0.5rem' }}>
          CONSTITUENT STOCKS
        </div>
        
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-ai)' }}>
            <Activity className="animate-spin" size={24} style={{ margin: '0 auto 1rem' }} />
            Fetching live stock data...
          </div>
        ) : stocks.length === 0 ? (
          <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            No constituent data available.
          </div>
        ) : (
          stocks.map((stock) => {
            let borderColor = 'var(--color-border)';
            if (stock.signal === 'BULLISH') borderColor = 'var(--color-bull)';
            if (stock.signal === 'BEARISH') borderColor = 'var(--color-bear)';
            if (stock.zoneStatus === 'BREAKOUT') borderColor = 'var(--color-warning)';
            if (stock.zoneStatus === 'BREAKDOWN') borderColor = '#ff4444'; // brighter bear

            const range = stock.resistance1 - stock.support1;
            const pos = range === 0 ? 0.5 : (stock.currentPrice - stock.support1) / range;
            const clampedPos = Math.max(0, Math.min(1, pos)) * 100;

            let zoneColor = 'var(--color-bull)';
            if (stock.zoneStatus === 'BREAKOUT') zoneColor = 'var(--color-warning)';
            if (stock.zoneStatus === 'BREAKDOWN') zoneColor = 'var(--color-bear)';

            return (
              <div 
                key={stock.symbol}
                onClick={() => onStockClick(stock)}
                style={{
                  background: 'rgba(10,22,40,0.6)',
                  border: '1px solid var(--color-border)',
                  borderLeft: `3px solid ${borderColor}`,
                  borderRadius: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  margin: '0.3rem 0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(15,32,64,0.8)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(10,22,40,0.6)';
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* ROW 1 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--color-text-bright)' }}>
                      {stock.shortName}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                      {stock.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-text-bright)' }}>
                      ₹{stock.currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: stock.priceChangePct >= 0 ? 'var(--color-bull)' : 'var(--color-bear)' }}>
                      {stock.priceChangePct > 0 ? '↑' : stock.priceChangePct < 0 ? '↓' : ''} {Math.abs(stock.priceChangePct).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* ROW 2 - Zone indicator bar */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', position: 'relative', marginBottom: '0.2rem' }}>
                  <div style={{ position: 'absolute', left: '0%', width: '50%', height: '100%', background: 'rgba(255,34,34,0.2)', borderRadius: '3px 0 0 3px' }} />
                  <div style={{ position: 'absolute', left: '50%', width: '50%', height: '100%', background: 'rgba(0,255,136,0.2)', borderRadius: '0 3px 3px 0' }} />
                  <div style={{ 
                    position: 'absolute', left: `${clampedPos}%`, width: '3px', height: '10px', top: '-2px', 
                    background: borderColor, borderRadius: '1px', transform: 'translateX(-50%)' 
                  }} />
                </div>

                {/* ROW 3 - Key levels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--color-text-muted)' }}>
                  <span>S1: ₹{stock.support1.toFixed(2)}</span>
                  <span>PIV: ₹{stock.pivot.toFixed(2)}</span>
                  <span>R1: ₹{stock.resistance1.toFixed(2)}</span>
                </div>

                {/* ROW 4 & 5 container */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: zoneColor }}>
                    {stock.zoneStatus} — {stock.zoneLabel}
                  </span>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.6rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Vol: {stock.volumeRatio.toFixed(2)}x
                    {stock.volumeConfirmed ? (
                      <span style={{ color: 'var(--color-bull)', fontWeight: 'bold' }}>✓</span>
                    ) : (
                      <span style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>⚠</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SECTOR HEALTH SCORE */}
      {!isLoading && stocks.length > 0 && (
        <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', color: 'var(--color-text-muted)', letterSpacing: '0.4em', marginBottom: '0.5rem' }}>
            SECTOR HEALTH SCORE
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2rem', color: scoreColor }}>
              {healthScore}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', maxWidth: '140px', textAlign: 'right', lineHeight: 1.2 }}>
              {scoreText}
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${healthScore}%`, height: '100%', background: gradientFill, transition: 'width 0.5s ease-out' }} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
