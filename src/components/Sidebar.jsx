import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMarketStore } from '../context/MarketStore';
import ReasoningTrace from './ReasoningTrace';
import OpportunityRadar from './OpportunityRadar';
import MyAlerts from './MyAlerts';
import SentinelPanel from './SentinelPanel';
import '../styles/Sidebar.css';

const SectorCard = ({ sector, index, isEmergency, isOtherInEmergency }) => {
  // Briefly flash background when price changes
  const [flash, setFlash] = useState(false);
  
  useEffect(() => {
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 300);
    return () => clearTimeout(t);
  }, [sector.priceChangePct, sector.tension]);

  const tensionPct = Math.min((sector.tension || 0) * 100, 100);
  const humidityPct = ((sector.humidity || 0) * 100).toFixed(0);
  const volPct = (sector.volumeRatio || 0).toFixed(2);
  const priceChange = sector.priceChangePct || 0;
  
  const isBull = sector.signal === 'BULLISH';
  const isBear = sector.signal === 'BEARISH';
  const signalClass = isBull ? 'bullish' : isBear ? 'bearish' : 'neutral';

  const cardVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { delay: index * 0.06, duration: 0.4 } },
    emergency: { x: [0, -4, 4, -4, 4, -2, 2, 0], transition: { duration: 0.5, repeat: Infinity } }
  };

  return (
    <motion.div 
      className={`sector-card-side ${signalClass} ${isEmergency ? 'emergency-state' : ''} ${isOtherInEmergency ? 'emergency-dimmed' : ''}`}
      variants={cardVariants}
      initial="hidden"
      animate={isEmergency ? 'emergency' : 'visible'}
      whileHover={{ scale: 1.02 }}
      style={{
        backgroundColor: flash && !isEmergency ? 'rgba(0,255,136,0.08)' : 'rgba(10,22,40,0.6)',
        transition: 'background-color 0.3s ease'
      }}
    >
      <div className="sc-row-1">
        <span className="sc-id">{sector.id}</span>
        <span className="sc-name">{sector.name}</span>
        <span className="sc-nifty">{sector.nifty}</span>
      </div>
      
      <div className="sc-row-2">
        <span className="sc-price">{sector.currentPrice?.toFixed(2) || '0.00'}</span>
        <span className={`sc-change ${priceChange >= 0 ? 'bullText' : 'bearText'}`}>
          {priceChange >= 0 ? '↑ ' : '↓ '}{Math.abs(priceChange).toFixed(2)}%
        </span>
      </div>
      
      <div className="sc-row-3">
        <div className="tension-track">
          <div className="tension-bar" style={{ width: `${tensionPct}%` }}></div>
        </div>
      </div>
      
      <div className="sc-row-4">
        <div>Vol: {volPct}x</div>
        <div>Humidity: {humidityPct}%</div>
        <div>Tension: {tensionPct.toFixed(0)}%</div>
        <div className={`sc-badge ${signalClass}-badge`}>{sector.signal}</div>
      </div>
    </motion.div>
  );
};

import ContagionHeatmap from './ContagionHeatmap';
import BacktestBadge from './BacktestBadge';
import PortfolioOverlay from './PortfolioOverlay';

export default function Sidebar({ sectors, sentinelAlerts = [] }) {
  const marketMeta = useMarketStore(state => state.marketMeta);
  const systemStatus = useMarketStore(state => state.systemStatus);
  const auditResult = useMarketStore(state => state.auditResult);
  const [sidebarTab, setSidebarTab] = useState('SECTORS');
  
  // Assuming auditResult has violatingSectorId if SIGNAL_DETECTED
  const isEmergencyActive = systemStatus === 'SIGNAL_DETECTED';
  const violatingSectorId = auditResult?.violatingSectorId || 'S1'; // fallback

  const renderMarketRow = (label, data) => {
    if (!data) return null;
    const isBull = data.changePct >= 0;
    return (
      <div className="market-row">
        <span className="mkt-label">{label}</span>
        <span className="mkt-price">{data.price.toFixed(2)}</span>
        <span className={`mkt-change ${isBull ? 'bullText' : 'bearText'}`}>
          {isBull ? '↑' : '↓'} {Math.abs(data.changePct).toFixed(2)}%
        </span>
      </div>
    );
  };

  return (
    <aside className="main-sidebar">
      <div className="sidebar-top">
        <div className="section-label">MARKET OVERVIEW</div>
        {renderMarketRow('NIFTY 50', marketMeta?.nifty50)}
        {renderMarketRow('SENSEX', marketMeta?.sensex)}
        <div className="verify-nudge">Verify on NSE India app →</div>
      </div>
      
      <PortfolioOverlay />

      <div className="sidebar-middle">
        {/* Tab Bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '0.3rem', position: 'relative', zIndex: 10 }}>
          {['SECTORS', 'HEATMAP', 'MY ALERTS'].map(tab => {
            const isActive = (sidebarTab || 'SECTORS') === tab;
            return (
              <button
                key={tab}
                onClick={(e) => { e.stopPropagation(); setSidebarTab(tab); }}
                style={{
                  flex: 1, padding: '0.5rem', border: 'none',
                  background: isActive ? 'rgba(0,255,136,0.12)' : 'rgba(0,0,0,0.3)',
                  color: isActive ? '#00ff88' : '#475569',
                  borderBottom: isActive ? '2px solid #00ff88' : '2px solid transparent',
                  cursor: 'pointer', fontSize: '0.58rem', letterSpacing: '0.12em',
                  fontFamily: 'var(--font-mono)', transition: 'all 0.2s',
                  pointerEvents: 'all', position: 'relative', zIndex: 11,
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
        {/* Conditional rendering based on active tab */}
        {sidebarTab === 'MY ALERTS' ? (
          <MyAlerts />
        ) : sidebarTab === 'HEATMAP' ? (
          <ContagionHeatmap />
        ) : (
          <div className="sectors-list">
          {sectors.map((sector, idx) => {
            const isViolating = isEmergencyActive && sector.id === violatingSectorId;
            return (
              <div 
                key={sector.id} 
                className={`sector-status-card ${isViolating ? 'violating' : ''}`}
                onClick={() => window.dispatchEvent(new CustomEvent('bazaar-trigger-z3-audit', { detail: { sectorId: sector.id } }))}
                style={{ cursor: 'pointer' }}
              >
                <SectorCard 
                  sector={sector} 
                  index={idx}
                  isEmergency={isViolating}
                  isOtherInEmergency={isEmergencyActive && sector.id !== violatingSectorId}
                />
              </div>
            );
          })}
        </div>
        )}
      </div>
      
      <div className="sidebar-bottom">
        <SentinelPanel alerts={sentinelAlerts} />
        <OpportunityRadar />
      </div>

      <ReasoningTrace />

      {/* HISTORICAL VALIDATION PANEL */}
      <BacktestBadge />

      {/* DATA ARCHITECTURE TRANSPARENCY PANEL */}
      <div style={{
        borderTop: '1px solid rgba(139,0,255,0.3)',
        padding: '0.4rem 0.5rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.5rem',
      }}>
        <div style={{ color: 'var(--color-ai)', letterSpacing: '0.15em', marginBottom: '0.3rem' }}>DATA ARCHITECTURE</div>
        {[
          { label: 'L1', val: 'Node.js Sim Server → ws://3001', status: 'ACTIVE', color: 'var(--color-bull)' },
          { label: 'L2', val: 'WebSocket Adapter (swap for NSE feed)', status: 'PLUGGABLE', color: 'var(--color-warning)' },
          { label: 'L3', val: 'Zustand MarketStore (state bus)', status: 'LIVE', color: 'var(--color-bull)' },
          { label: 'L4', val: 'Z3 RiskAuditor (formal logic engine)', status: 'RUNNING', color: 'var(--color-proof)' },
          { label: 'L5', val: 'Gemini 2.5 Flash (AI Commander)', status: 'ONLINE', color: 'var(--color-bull)' },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.12rem' }}>
            <span style={{ color: 'var(--color-text-muted)', minWidth: '1.2rem' }}>{row.label}</span>
            <span style={{ color: 'var(--color-text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.val}</span>
            <span style={{ color: row.color, minWidth: '3.8rem', textAlign: 'right' }}>{row.status}</span>
          </div>
        ))}
        <div style={{ color: 'rgba(139,0,255,0.5)', marginTop: '0.3rem', fontSize: '0.45rem' }}>
          Swap L2 for Angel One / NSE WebSocket to deploy to production.
        </div>
      </div>
    </aside>
  );
}
