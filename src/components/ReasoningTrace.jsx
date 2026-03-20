import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketStore } from '../context/MarketStore';
import '../styles/ReasoningTrace.css';

export default function ReasoningTrace() {
  const [expanded, setExpanded] = useState(false);
  const signalHistory = useMarketStore(state => state.signalHistory);

  // Expanded content — last 10 events in reverse
  const recentEvents = [...signalHistory].reverse().slice(0, 10);

  return (
    <div className="trace-container">
      <div className="trace-header" onClick={() => setExpanded(!expanded)}>
        <div className="trace-title">
          AI REASONING TRACE
          <span className="trace-badge">{signalHistory.length}</span>
        </div>
        <motion.div 
          animate={{ rotate: expanded ? 180 : 0 }} 
          className="trace-arrow"
        >
          ▼
        </motion.div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            className="trace-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {recentEvents.map((evt, idx) => {
              let colorClass = 'evt-neutral';
              let icon = '✓';
              
              if (evt.type === 'SIGNAL') { colorClass = 'evt-bear'; icon = '⚡'; }
              if (evt.type === 'BRIEFING') { colorClass = 'evt-ai'; icon = '🧠'; }
              if (evt.type === 'NEAR_MISS') { colorClass = 'evt-warn'; icon = '⚠'; }

              return (
                <motion.div 
                  key={idx}
                  className={`trace-card ${colorClass}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="tc-row-1">
                    <span className="tc-icon">{icon}</span>
                    <span className="tc-type">{evt.type}</span>
                    <span className="tc-time">{evt.time}</span>
                  </div>
                  <div className="tc-row-2">
                    {evt.text.length > 60 ? evt.text.slice(0, 60) + '...' : evt.text}
                  </div>
                  {evt.type === 'SIGNAL' && evt.sector && (
                    <div className="tc-row-3">
                      [ {evt.sector} ]
                    </div>
                  )}
                </motion.div>
              );
            })}
            
            {recentEvents.length === 0 && (
              <div className="trace-empty">No trace events found.</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
