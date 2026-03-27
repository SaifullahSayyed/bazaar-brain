import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/ThinkingTrace.css';

const DEFAULT_TRACE_LINES = [
  "> VERIFIED: Z3 Mathematical Proof [SAT]",
  "> ISOLATING: Causal sector anomalies...",
  "> FETCHING: NSE Historical Volume Ratios...",
  "> ANALYSIS: Computing Institutional Distribution...",
  "> SYNTHESIS: Generating bilingual retail vector...",
  "> READY: Disseminating Market Directive."
];

export default function ThinkingTrace({ isOpen, lines: customLines, className = "" }) {
  const [lines, setLines] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const traceLines = customLines || DEFAULT_TRACE_LINES;

  useEffect(() => {
    if (!isOpen) {
      setLines([]);
      setCurrentIndex(0);
      return;
    }

    if (currentIndex < traceLines.length) {
      const timer = setTimeout(() => {
        setLines(prev => [...prev, traceLines[currentIndex]]);
        setCurrentIndex(prev => prev + 1);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentIndex, traceLines]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={`tt-container ${className}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <div className="tt-header">
            <span className="tt-pulse" />
            <span>BRAIN: CHAIN OF THOUGHT</span>
          </div>
          <div className="tt-terminal">
            {lines.map((line, idx) => (
              <motion.div 
                key={idx} 
                className="tt-line"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                {line}
              </motion.div>
            ))}
            {currentIndex < traceLines.length && (
              <motion.div 
                className="tt-cursor"
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              >
                _
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
