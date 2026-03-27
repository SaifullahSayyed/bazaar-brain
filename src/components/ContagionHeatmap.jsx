import React from 'react';
import { motion } from 'framer-motion';
import { useMarketStore } from '../context/MarketStore';
import '../styles/ContagionHeatmap.css';

const SECTORS = [
  { id: 'S1', name: 'Bank' },
  { id: 'S2', name: 'IT' },
  { id: 'S3', name: 'FMCG' },
  { id: 'S4', name: 'Pharma' },
  { id: 'S5', name: 'Energy' },
  { id: 'S6', name: 'Auto' },
  { id: 'S7', name: 'Metal' },
  { id: 'S8', name: 'Realty' }
];

// Heuristic Correlation Matrix (0 to 1)
// Rows affect Columns
const CORRELATIONS = {
  'S1': { 'S8': 0.85, 'S6': 0.70, 'S5': 0.40, 'S3': 0.30, 'S1': 1.0 }, // Bank affects Realty, Auto
  'S2': { 'S2': 1.0, 'S1': 0.20 }, // IT is relatively isolated
  'S5': { 'S7': 0.75, 'S6': 0.50, 'S4': 0.20, 'S5': 1.0 }, // Energy affects Metal, Auto
  'S7': { 'S8': 0.65, 'S6': 0.60, 'S7': 1.0 }, // Metal affects Realty, Auto
  'S8': { 'S1': 0.80, 'S8': 1.0 } // Realty affects Bank
};

export default function ContagionHeatmap() {
  const sectors = useMarketStore(state => state.sectors);
  
  // Calculate contagion risk for each target sector based on ALL source sectors
  const getContagionRisk = (targetId) => {
    let risk = 0;
    sectors.forEach(s => {
      const tension = Math.abs(s.tension || 0);
      const corr = CORRELATIONS[s.id]?.[targetId] || (s.id === targetId ? 1 : 0.1);
      risk = Math.max(risk, tension * corr);
    });
    return Math.min(risk, 1);
  };

  return (
    <div className="heatmap-container">
      <div className="heatmap-grid">
        {SECTORS.map(s => {
          const risk = getContagionRisk(s.id);
          const color = risk > 0.8 ? 'var(--color-bear)' : risk > 0.5 ? 'var(--color-warning)' : 'var(--color-bull)';
          const opacity = 0.2 + (risk * 0.8);

          return (
            <motion.div 
              key={s.id}
              className="heatmap-cell"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: `rgba(${risk > 0.8 ? '255,34,34' : risk > 0.5 ? '255,184,0' : '0,255,136'}, ${opacity})`,
                borderColor: color
              }}
              title={`${s.name} Contagion Risk: ${(risk * 100).toFixed(1)}%`}
            >
              <div className="cell-id">{s.id}</div>
              <div className="cell-risk">{(risk * 100).toFixed(0)}%</div>
            </motion.div>
          );
        })}
      </div>
      <div className="heatmap-legend">
        <span>SAFE</span>
        <div className="legend-gradient" />
        <span>CONTAGION</span>
      </div>
    </div>
  );
}
