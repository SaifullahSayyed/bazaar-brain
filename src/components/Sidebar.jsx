import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useMarketStore } from '../context/MarketStore';
import ReasoningTrace from './ReasoningTrace';
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

export default function Sidebar({ sectors }) {
  const marketMeta = useMarketStore(state => state.marketMeta);
  const systemStatus = useMarketStore(state => state.systemStatus);
  const auditResult = useMarketStore(state => state.auditResult);
  
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
      
      <div className="sidebar-middle">
        <div className="section-label px-label">SECTOR STATUS</div>
        <div className="sectors-list">
          {sectors.map((sector, idx) => (
            <SectorCard 
              key={sector.id} 
              sector={sector} 
              index={idx}
              isEmergency={isEmergencyActive && sector.id === violatingSectorId}
              isOtherInEmergency={isEmergencyActive && sector.id !== violatingSectorId}
            />
          ))}
        </div>
      </div>
      
      <div className="sidebar-bottom">
        <div className="section-label radar-label">OPPORTUNITY RADAR</div>
        <div className="radar-placeholder">
          Initializing<span className="anim-dots"></span>
        </div>
      </div>

      <ReasoningTrace />
    </aside>
  );
}
