import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../styles/AIBriefingPanel.css';

function useSequentialTypewriter(text, speed = 14) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) {
      setDone(true);
      return;
    }
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, done };
}

const BriefingSection = ({ title, text, isActive, isHindi }) => {
  // Only type if active. If not active yet, show nothing.
  const { displayed, done } = useSequentialTypewriter(isActive ? text : '', 14);

  let titleColorClass = 'sect-neutral';
  if (title === 'WATCH') titleColorClass = 'sect-bear';
  if (title === 'OPPORTUNITY') titleColorClass = 'sect-bull';
  if (title === 'DIRECTIVE') titleColorClass = 'sect-ai';
  if (title === 'HINDI BRIEFING') titleColorClass = 'sect-warn';

  return (
    <div className={`brf-section ${isHindi ? 'brf-flex-hindi' : ''}`}>
      <div className={`brf-sect-title ${titleColorClass}`}>{title}</div>
      <div className={`brf-sect-text ${isHindi ? 'text-warn' : 'text-primary'}`}>
        {displayed}
      </div>
    </div>
  );
};

export default function AIBriefingPanel({ briefing, isLoading, onClose }) {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);

  // Auto-dismiss after 45s
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 45000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Parse sections
  let sections = [];
  if (briefing && !isLoading) {
    const raw = briefing.text || '';
    const extract = (key, nextKey) => {
      const idx = raw.indexOf(key + ':');
      if (idx === -1) return '';
      const start = idx + key.length + 1;
      const end = nextKey ? raw.indexOf(nextKey + ':') : raw.length;
      return raw.substring(start, end !== -1 ? end : raw.length).trim();
    };

    sections = [
      { title: 'MARKET STATUS', text: extract('MARKET STATUS', 'WATCH') },
      { title: 'WATCH', text: extract('WATCH', 'OPPORTUNITY') },
      { title: 'OPPORTUNITY', text: extract('OPPORTUNITY', 'DIRECTIVE') },
      { title: 'DIRECTIVE', text: extract('DIRECTIVE', 'HINDI BRIEFING') },
      { title: 'HINDI BRIEFING', text: extract('HINDI BRIEFING', null), isHindi: true }
    ];
  }

  // Handle sequential typing flow
  useEffect(() => {
    if (isLoading || !sections.length) return;
    
    // We need a way to know when section N is done typing to activate N+1
    // This is a naive but effective timer approach based on text length
    let currentIdx = 0;
    
    const timeouts = [];
    let cumulativeDelay = 0;
    
    sections.forEach((sec, idx) => {
      if (idx === 0) return; // index 0 is active immediately
      cumulativeDelay += (sections[idx - 1].text.length * 14) + 300; // wait for previous to finish + pause
      
      const t = setTimeout(() => {
        setActiveSegmentIndex(idx);
      }, cumulativeDelay);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [isLoading, briefing]);

  return (
    <motion.div 
      className="brf-panel"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isLoading ? (
        <div className="brf-loading-state">
          <svg className="brf-spin-ring" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--color-ai)" strokeLinecap="round" />
          </svg>
          <div className="brf-loading-text">
            🧠 AI Commander analyzing live NSE data<span className="anim-dots"></span>
          </div>
        </div>
      ) : (
        <>
          <div className="brf-sections-row">
            {sections.map((sec, idx) => (
              <BriefingSection 
                key={sec.title}
                title={sec.title}
                text={sec.text}
                isHindi={sec.isHindi}
                isActive={activeSegmentIndex >= idx}
              />
            ))}
          </div>

          <div className="brf-bottom-row">
            <div className="brf-meta">
              Generated in {briefing?.generatedInMs || 0}ms · Powered by gemini-1.5-flash
            </div>
            <button className="brf-close-btn" onClick={onClose}>✕ CLOSE</button>
          </div>
        </>
      )}
    </motion.div>
  );
}
