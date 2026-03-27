import React from 'react';
import { motion } from 'framer-motion';
import { X, Activity, BrainCircuit } from 'lucide-react';
import '../styles/SectorPopup.css';

export default function StockDetailPopup({ stock, sectorName, stockAnalysis, analysisLoading, onClose, onAIAnalysis }) {
  if (!stock) return null;

  const { currentPrice, previousClose, priceChangePct, dayHigh, dayLow, pivot, support1, support2, resistance1, resistance2, zoneStatus, volumeRatio, volumeConfirmed } = stock;
  
  // Visual zones calculations
  // Total mapping area: R2 down to S2.
  const top = resistance2;
  const bottom = support2;
  const range = top - bottom;
  
  const getPos = (val) => {
    if (range === 0) return 50;
    const p = ((top - val) / range) * 100;
    return Math.max(0, Math.min(100, p));
  };

  const posTop = 0;
  const posR1 = getPos(resistance1);
  const posP = getPos(pivot);
  const posS1 = getPos(support1);
  const posBot = 100;
  const posCur = getPos(currentPrice);

  let arrow = '';
  let color = 'var(--color-text-bright)';
  if (priceChangePct > 0) { arrow = '↑'; color = 'var(--color-bull)'; }
  else if (priceChangePct < 0) { arrow = '↓'; color = 'var(--color-bear)'; }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', pointerEvents: 'auto' }} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{
          position: 'relative',
          background: 'rgba(6,13,26,0.95)',
          border: '1px solid var(--color-border-bright)',
          borderTopWidth: '3px',
          borderTopColor: 'var(--color-neon-blue)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          maxHeight: '75vh',
          overflowY: 'auto',
          maxWidth: '520px',
          width: '90vw',
          pointerEvents: 'auto',
          boxShadow: '0 16px 48px rgba(0,0,0,0.8), 0 0 20px rgba(0,102,255,0.2)',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--color-text-bright)'
        }}
      >
        {/* HEADER - STICKY */}
        <div className="popup-header">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
              {stock.shortName} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>— {stock.name}</span>
            </h2>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
              NSE: {stock.symbol}
            </div>
          </div>
          <button onClick={onClose} className="popup-close">
            <X size={24} />
          </button>
        </div>

        {/* PRICE */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.8rem' }}>
            ₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', color, marginLeft: '0.75rem', fontWeight: 'bold' }}>
            {arrow} {Math.abs(priceChangePct).toFixed(2)}%
          </span>
        </div>

        {/* VISUAL ZONE */}
        <div style={{ position: 'relative', height: '180px', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '1rem' }}>
          
          <div style={{ position: 'absolute', top: `${posTop}%`, left: '1rem', right: '1rem', borderTop: '1px dashed var(--color-text-muted)', opacity: 0.5 }} />
          <div style={{ position: 'absolute', top: `${posTop}%`, left: '1rem', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-muted)', background: '#000', padding: '0 4px' }}>R2 ₹{resistance2.toFixed(2)}</div>
          
          <div style={{ position: 'absolute', top: `${posR1}%`, left: '1rem', right: '1rem', borderTop: '2px solid var(--color-warning)', opacity: 0.8 }} />
          <div style={{ position: 'absolute', top: `${posR1}%`, left: '1rem', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-warning)', background: '#000', padding: '0 4px', fontWeight: 'bold' }}>R1 ₹{resistance1.toFixed(2)}</div>
          
          <div style={{ position: 'absolute', top: `${posP}%`, left: '1rem', right: '1rem', borderTop: '1px solid var(--color-text-muted)', opacity: 0.6 }} />
          <div style={{ position: 'absolute', top: `${posP}%`, left: '1rem', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-bright)', background: '#000', padding: '0 4px' }}>PIV ₹{pivot.toFixed(2)}</div>
          
          <div style={{ position: 'absolute', top: `${posS1}%`, left: '1rem', right: '1rem', borderTop: '2px solid var(--color-bear)', opacity: 0.8 }} />
          <div style={{ position: 'absolute', top: `${posS1}%`, left: '1rem', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-bear)', background: '#000', padding: '0 4px', fontWeight: 'bold' }}>S1 ₹{support1.toFixed(2)}</div>

          <div style={{ position: 'absolute', bottom: '0', left: '1rem', right: '1rem', borderTop: '1px dashed var(--color-text-muted)', opacity: 0.5 }} />
          <div style={{ position: 'absolute', bottom: '0', left: '1rem', transform: 'translateY(50%)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-text-muted)', background: '#000', padding: '0 4px' }}>S2 ₹{support2.toFixed(2)}</div>

          {/* CURRENT PRICE MARKER */}
          <div style={{ position: 'absolute', top: `${posCur}%`, left: '60px', right: '1rem', borderTop: '1px solid var(--color-cyan)', opacity: 1, zIndex: 10 }} />
          <div style={{ position: 'absolute', top: `${posCur}%`, right: '1rem', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--color-cyan)', background: '#000', padding: '0 4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-cyan)', boxShadow: '0 0 8px var(--color-cyan)' }} />
            ► ₹{currentPrice.toFixed(2)} ◄ YOU ARE HERE
          </div>

          <div style={{ position: 'absolute', top: `${(posR1 + posP) / 2}%`, right: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', transform: 'translateY(-50%)' }}>↑ RESISTANCE ZONE</div>
          <div style={{ position: 'absolute', top: `${(posS1 + posP) / 2}%`, right: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', transform: 'translateY(-50%)' }}>↓ SUPPORT ZONE</div>
        </div>

        {/* MATH CALCS */}
        <div style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '0.4rem', padding: '0.75rem', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-proof)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.6rem', letterSpacing: '0.1em', marginBottom: '0.5rem', fontWeight: 700 }}>Z3 PIVOT POINT CALCULATION</div>
          <div>Pivot = (H + L + C) / 3</div>
          <div>&nbsp;&nbsp;= (₹{dayHigh.toFixed(2)} + ₹{dayLow.toFixed(2)} + ₹{previousClose.toFixed(2)}) / 3</div>
          <div style={{ marginBottom: '0.5rem' }}>&nbsp;&nbsp;= ₹{pivot.toFixed(2)}</div>
          
          <div>Support₁ = 2×Pivot − High</div>
          <div>&nbsp;&nbsp;= 2×₹{pivot.toFixed(2)} − ₹{dayHigh.toFixed(2)}</div>
          <div style={{ marginBottom: '0.5rem' }}>&nbsp;&nbsp;= ₹{support1.toFixed(2)}</div>
          
          <div>Resistance₁ = 2×Pivot − Low</div>
          <div>&nbsp;&nbsp;= 2×₹{pivot.toFixed(2)} − ₹{dayLow.toFixed(2)}</div>
          <div>&nbsp;&nbsp;= ₹{resistance1.toFixed(2)}</div>
        </div>

        {/* Z3 VERDICT */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', borderLeft: `3px solid ${zoneStatus === 'SAFE' ? 'var(--color-bull)' : zoneStatus === 'BREAKOUT' ? 'var(--color-warning)' : 'var(--color-bear)'}` }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text-bright)', marginBottom: '0.5rem' }}>
            Z3 VERDICT: {zoneStatus === 'SAFE' ? 'PRICE IN SAFE ZONE' : zoneStatus === 'BREAKOUT' ? 'BREAKOUT ABOVE RESISTANCE' : 'BREAKDOWN BELOW SUPPORT'}
          </div>
          <div style={{ fontSize: '0.75rem', lineHeight: 1.4, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
            {zoneStatus === 'SAFE' && `Current price ₹${currentPrice.toFixed(2)} is between Support ₹${support1.toFixed(2)} and Resistance ₹${resistance1.toFixed(2)}. Volume ${volumeRatio.toFixed(1)}x average ${volumeConfirmed ? 'CONFIRMS' : 'does NOT confirm'} the move.`}
            {zoneStatus === 'BREAKOUT' && `Price has broken above R1 ₹${resistance1.toFixed(2)}. ${volumeConfirmed ? 'Volume confirms breakout — momentum play.' : 'Low volume — false breakout risk high.'}`}
            {zoneStatus === 'BREAKDOWN' && `Price has broken below S1 ₹${support1.toFixed(2)}. Risk of further downside elevated.`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            {zoneStatus === 'SAFE' && 'हिंदी: कीमत सुरक्षित क्षेत्र में है।'}
            {zoneStatus === 'BREAKOUT' && 'हिंदी: प्रतिरोध टूट गया। सावधानी बरतें।'}
            {zoneStatus === 'BREAKDOWN' && 'हिंदी: समर्थन टूट गया। जोखिम बढ़ा है।'}
          </div>
        </div>

        {/* AI ANALYSIS BUTTON */}
        {!stockAnalysis && !analysisLoading && (
          <button 
            onClick={() => onAIAnalysis(stock)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(139,0,255,0.15)', border: '1px solid var(--color-ai)', color: 'var(--color-ai)', padding: '0.75rem', borderRadius: '0.5rem', fontFamily: 'var(--font-display)', fontSize: '0.72rem', cursor: 'pointer', outline: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,0,255,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,0,255,0.15)'}
          >
            <BrainCircuit size={16} /> Get AI Analysis
          </button>
        )}

        {analysisLoading && (
          <div style={{ padding: '1rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-ai)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Activity className="animate-spin" size={16} /> Generating Technical Analysis...
          </div>
        )}

        {stockAnalysis && !analysisLoading && (
          <div style={{ padding: '1rem', background: 'rgba(139,0,255,0.05)', borderLeft: '2px solid var(--color-ai)', borderRadius: '0.25rem', fontSize: '0.75rem', lineHeight: 1.5 }}>
            <div style={{ color: 'var(--color-text-bright)', marginBottom: '0.5rem', whiteSpace: 'pre-line' }}>
              {stockAnalysis.split('HINDI:')[0].trim()}
            </div>
            {stockAnalysis.includes('HINDI:') && (
              <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                HINDI: {stockAnalysis.split('HINDI:')[1].trim()}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
