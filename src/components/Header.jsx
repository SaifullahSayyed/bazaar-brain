import React, { useState, useEffect } from 'react';
import '../styles/Header.css';

export default function Header({ connectionStatus, dataFreshness }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-IN', { hour12: false }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  let marketPillContent = "⊘ SIMULATION MODE";
  let marketPillClass = "offline";
  if (dataFreshness === 'LIVE') {
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
        AI MARKET COMMANDER — ZERO HALLUCINATION
      </div>

      <div className="right-section">
        <button className="ai-briefing-btn">
          🧠 AI BRIEFING
        </button>

        <div className="mic-btn" title="Voice Command (Phase 5)">
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </div>

        <div className="status-pill proof-engine">
          ⬡ PROOF ENGINE
        </div>

        <div className={`status-pill market-pill ${marketPillClass}`}>
          {marketPillContent}
        </div>

        <div className="live-clock">
          {time} IST
        </div>
      </div>
    </header>
  );
}
