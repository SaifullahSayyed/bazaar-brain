import React, { useEffect, useState } from 'react';
import { useMarketStore } from '../context/MarketStore';
import '../styles/Footer.css';

export default function Footer({ solveTimeMs = 0 }) {
  const tickCount = useMarketStore(state => state.tickCount);
  const stateNorm = useMarketStore(state => state.stateNorm);
  const lastSignalTime = useMarketStore(state => state.lastSignalTime);
  const aiStatus = useMarketStore(state => state.aiStatus);
  const syncAgeSeconds = useMarketStore(state => state.syncAgeSeconds);

  let aiClass = 'standby';
  if (aiStatus === 'THINKING') aiClass = 'thinking';
  if (aiStatus === 'COMMANDING') aiClass = 'commanding';

  return (
    <footer className="main-footer">
      <div className="footer-left">
        Z3 PROOF: <span className="highlight">{solveTimeMs.toFixed(2)}ms</span> &nbsp;|&nbsp; 
        DEPTH: <span className="highlight">{tickCount}</span> &nbsp;|&nbsp; 
        NORM: <span className="highlight">{stateNorm.toFixed(3)}</span> &nbsp;|&nbsp; 
        TICK: <span className="highlight">{tickCount}</span>
      </div>
      
      <div className="footer-center">
        BAZAAR BRAIN v1.0.0 &nbsp;|&nbsp; PS6 — AI FOR INDIAN INVESTOR
      </div>
      
      <div className="footer-right">
        SECTORS: <span className="highlight">8/8</span> &nbsp;|&nbsp; 
        LAST SIGNAL: <span className="highlight">{lastSignalTime || '--'}</span> &nbsp;|&nbsp; 
        SYNC: <span className="highlight">{syncAgeSeconds}s ago</span> &nbsp;|&nbsp; 
        AI: <span className={`ai-status ${aiClass}`}>{aiStatus}</span>
      </div>
    </footer>
  );
}
