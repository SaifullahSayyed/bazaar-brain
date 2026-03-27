import React, { useState, useEffect } from 'react';
import ImpactCounter from './ImpactCounter';
import EducationToggle from './EducationToggle';
import '../styles/Header.css';

export default function Header({ connectionStatus, dataFreshness, onBriefingClick, onStatus, onAcknowledge }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-IN', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  let marketPillContent = "⊘ SIMULATION MODE";
  let marketPillClass = "offline";
  if (dataFreshness === 'LIVE' || dataFreshness === 'TIER_1_NSE_OFFICIAL' || dataFreshness === 'TIER_2_YAHOO' || dataFreshness === 'TIER_1_BREEZE') {
    marketPillContent = "● NSE LIVE";
    marketPillClass = "live";
  } else if (dataFreshness === 'MARKET_CLOSED') {
    marketPillContent = "● MARKET CLOSED";
    marketPillClass = "market-closed";
  } else if (connectionStatus === 'RECONNECTING') {
    marketPillContent = "◌ RECONNECTING...";
    marketPillClass = "reconnecting";
  }

  return (
    <header className="main-header">
      <div className="left-section">
        <svg className="hexagon-logo" viewBox="0 0 100 100">
          <polygon points="50 3 93 25 93 75 50 97 7 75 7 25" />
        </svg>
        <div className="brand-text">BAZAAR BRAIN</div>
      </div>

      <div className="center-section">
        <div className="brand-tagline">AI MARKET COMMANDER — ZERO HALLUCINATION</div>
        <ImpactCounter />
      </div>

      <div className="right-section">
        <EducationToggle />

        <button 
          className="ai-briefing-btn"
          onClick={onBriefingClick}
          data-briefing-btn="true"
        >
          🧠 AI BRIEFING
        </button>

        <button 
          className="status-pill proof-engine"
          onClick={() => window.dispatchEvent(new CustomEvent('bazaar-trigger-z3-audit'))}
          style={{ cursor: 'pointer' }}
        >
          ⬡ PROOF ENGINE
        </button>

        <div 
          className={`status-pill market-pill ${marketPillClass}`}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            fetch('http://localhost:8080/toggle-live', { method: 'POST' }).catch(console.error);
          }}
          title="Click to toggle Live / Simulation Mode"
        >
          {marketPillContent}
        </div>

        <div className="live-clock">
          {time} IST
        </div>
      </div>
    </header>
  );
}
