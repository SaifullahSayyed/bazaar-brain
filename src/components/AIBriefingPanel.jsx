import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMarketStore } from '../context/MarketStore';
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

const SECTION_TOOLTIPS = {
  'MARKET STATUS': 'Overall market health index derived from Nifty50, volume patterns, and sector correlation signals.',
  'WATCH': 'Sectors or stocks exhibiting anomalous tension or bearish divergence — monitor for potential short entry or exit.',
  'OPPORTUNITY': 'Sectors showing oversold Z3 signals or bullish institutional accumulation — potential long setups.',
  'DIRECTIVE': 'AI-generated action recommendation based on current market proof state and risk mandate.',
  'HINDI BRIEFING': 'उपरोक्त विश्लेषण का हिन्दी सारांश — खुदरा निवेशकों के लिए।',
};

const BriefingSection = ({ title, text, isActive, isHindi, educationMode }) => {
  // Only type if active. If not active yet, show nothing.
  const { displayed, done } = useSequentialTypewriter(isActive ? text : '', 14);

  let titleColorClass = 'sect-neutral';
  if (title === 'WATCH') titleColorClass = 'sect-bear';
  if (title === 'OPPORTUNITY') titleColorClass = 'sect-bull';
  if (title === 'DIRECTIVE') titleColorClass = 'sect-ai';
  if (title === 'HINDI BRIEFING') titleColorClass = 'sect-warn';

  return (
    <div className={`brf-section ${isHindi ? 'brf-flex-hindi' : ''}`}>
      <div className={`brf-sect-title ${titleColorClass}`}>
        {title}
        {educationMode && SECTION_TOOLTIPS[title] && (
          <span className="edu-info-tag" title={SECTION_TOOLTIPS[title]}>?</span>
        )}
      </div>
      <div className={`brf-sect-text ${isHindi ? 'text-warn' : 'text-primary'}`}>
        {displayed}
      </div>
    </div>
  );
};

import ThinkingTrace from './ThinkingTrace';

const BRIEFING_TRACE = [
  "> INITIALIZING: Gemini 1.5 Flash Context...",
  "> SNAPSHOT: Aggregating 8 sector vectors...",
  "> CONTEXT: NIFTY 50 @ Live NSE Feed...",
  "> HEURISTIC: Applying risk correlation matrix...",
  "> SYNTHESIS: Formatting multi-modal briefing...",
  "> READY: Disseminating Intelligence."
];

export default function AIBriefingPanel({ briefing, isLoading, onClose }) {
  const educationMode = useMarketStore(state => state.educationMode);
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
    const lines = raw.split('\n').map(l => l.replace(/\*/g, '').trim()).filter(l => l.length > 0);
    
    // Robust Extraction: Try to find by label, but fallback to line index if Gemini ignores the prompt formatting
    const extract = (key, lineIndex) => {
      // 1. Try to find the exact label in the raw text
      const keyRegex = new RegExp(`(?:\\*\\*)?${key}(?:\\*\\*)?\\s*(?:[:\\-])?\\s*`, 'i');
      const matchKey = raw.match(keyRegex);
      
      if (matchKey) {
        const start = matchKey.index + matchKey[0].length;
        // Find next ALL CAPS label or end of string
        const nextLabelRegex = /\n\s*(?:[A-Z\s]+)(?:[:\-])/i;
        const remainder = raw.substring(start);
        const matchNext = remainder.match(nextLabelRegex);
        
        const extracted = matchNext 
          ? remainder.substring(0, matchNext.index).replace(/\*/g, '').trim()
          : remainder.replace(/\*/g, '').trim();
          
        if (extracted.length > 0) return extracted;
      }
      
      // 2. Fallback: If no label found, just take the Nth line of the response!
      // Gemini often just returns 5 lines without labels.
      if (lineIndex < lines.length) {
        let line = lines[lineIndex];
        // Strip out any prefix it might have added anyway (like "1. ", "- ")
        line = line.replace(/^(?:MARKET STATUS|WATCH|OPPORTUNITY|DIRECTIVE|HINDI BRIEFING)?[\s:.-]*/i, '');
        return line.trim();
      }
      
      return 'Data unavailable'; // Failsafe
    };

    sections = [
      { title: 'MARKET STATUS', text: extract('MARKET STATUS', 0) },
      { title: 'WATCH', text: extract('WATCH', 1) },
      { title: 'OPPORTUNITY', text: extract('OPPORTUNITY', 2) },
      { title: 'DIRECTIVE', text: extract('DIRECTIVE', 3) },
      { title: 'HINDI BRIEFING', text: extract('HINDI BRIEFING', 4), isHindi: true }
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
  }, [isLoading, briefing, sections.length]);

  return (
    <motion.div 
      className="brf-panel"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isLoading ? (
        <div className="brf-loading-state" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ThinkingTrace isOpen={true} lines={BRIEFING_TRACE} className="tt-inline" />
        </div>
      ) : (
        <>
          {educationMode && (
            <div className="brf-edu-banner">
              🎓 <strong>EDUCATION MODE:</strong> This briefing is generated by Gemini AI using live NSE sector data. Each section reflects a distinct market intelligence layer — hover the <strong>?</strong> tags for explanations.
            </div>
          )}
          <div className="brf-sections-row">
            {sections.map((sec, idx) => (
              <BriefingSection 
                key={sec.title}
                title={sec.title}
                text={sec.text}
                isHindi={sec.isHindi}
                isActive={activeSegmentIndex >= idx}
                educationMode={educationMode}
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
