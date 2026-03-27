import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { analyzeStockTechnicals } from '../logic/GeminiService';
import '../styles/StockZonePopup.css';

function StockZonePopup({ stock, onClose }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stock) return;
    let active = true;
    setLoading(true);
    analyzeStockTechnicals(stock).then(res => {
      if (active) {
        setAnalysis(res);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [stock]);

  if (!stock) return null;

  const { z3, stats } = stock;
  const volRatio = (stats.volumeRatio || 1).toFixed(2);

  let engText = analysis || "Analyzing market conditions...";
  let hinText = "";
  if (analysis && analysis.includes("HINDI:")) {
    const parts = analysis.split("HINDI:");
    engText = parts[0].trim();
    hinText = "HINDI: " + parts[1].trim();
  } else if (analysis && analysis.includes("हिंदी:")) {
    const parts = analysis.split("हिंदी:");
    engText = parts[0].trim();
    hinText = "हिंदी: " + parts[1].trim();
  }

  return (
    <div className="sz-popup-overlay">
      <div className="sz-popup-backdrop" onClick={onClose} />
      <motion.div 
        className="sz-popup-container"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="sz-header">
          <div className="sz-title">
            {stock.name.toUpperCase()} ({stock.symbol})
          </div>
          <button className="sz-close" onClick={onClose}>×</button>
        </div>
        <div className="sz-subtitle">
          ₹{stock.price.toFixed(2)} &nbsp;&nbsp; 
          <span style={{color: stock.changePct >= 0 ? "var(--color-bull)" : "var(--color-bear)"}}>
            {stock.changePct >= 0 ? '↑+' : '↓'}{Math.abs(stock.changePct).toFixed(2)}%
          </span> &nbsp;&nbsp; 
          Vol: {volRatio}x avg
        </div>

        <div className="sz-section-title">Z3 MATHEMATICAL ZONE ANALYSIS</div>
        <div className="sz-zone-diagram">
          <div className="sz-row">
            <span className="sz-lbl">RESISTANCE</span>
            <span className="sz-val">₹{z3.RESISTANCE.toFixed(2)}</span>
            <div className="sz-line sz-line-res" />
            <span className="sz-lbl-right">UPPER</span>
          </div>
          <div className="sz-row sz-fill">░░░░░░░░░░░░</div>
          <div className="sz-row">
            <span className="sz-lbl">PIVOT</span>
            <span className="sz-val">₹{z3.PIVOT.toFixed(2)}</span>
            <div className="sz-line sz-line-piv" />
          </div>
          <div className="sz-row">
            <span className={`sz-lbl sz-highlight pulse-${stock.verdict}`}>CURRENT</span>
            <span className={`sz-val sz-highlight pulse-${stock.verdict}`}>₹{stock.price.toFixed(2)}</span>
            <div className="sz-line sz-line-cur" />
            <span className={`sz-lbl-right sz-highlight pulse-${stock.verdict}`}>← HERE</span>
          </div>
          <div className="sz-row sz-fill">░░░░░░░░░░░░</div>
          <div className="sz-row">
            <span className="sz-lbl">SUPPORT</span>
            <span className="sz-val">₹{z3.SUPPORT.toFixed(2)}</span>
            <div className="sz-line sz-line-sup" />
            <span className="sz-lbl-right">LOWER</span>
          </div>
        </div>

        <div className="sz-verdict">
          <div className="sz-verdict-title">Z3 VERDICT:</div>
          <div className="sz-verdict-text">
            {stock.verdict === 'SAFE' && `Price in SAFE zone. Between support ₹${z3.SUPPORT.toFixed(2)} and resistance ₹${z3.RESISTANCE.toFixed(2)}. ${volRatio > 1 ? 'Volume confirms move.' : ''}`}
            {stock.verdict === 'WARNING' && `WARNING. Breakout above resistance ₹${z3.RESISTANCE.toFixed(2)}. May reverse.`}
            {stock.verdict === 'RISK' && `RISK. Breakdown below support ₹${z3.SUPPORT.toFixed(2)}. May continue falling.`}
          </div>
        </div>

        {loading ? (
           <div className="sz-ai-box sz-loading">Bazaar Brain analyzing technicals...</div>
        ) : (
           <div className="sz-ai-box">
             <div className="sz-ai-eng">{engText}</div>
             {hinText && <div className="sz-ai-hin">{hinText}</div>}
           </div>
        )}

        <div className="sz-footer">
          <div className="sz-footer-title">TECHNICAL BASIS:</div>
          <div>Pivot = (H+L+C)/3 = ₹{z3.PIVOT.toFixed(2)}</div>
          <div>Support = 2×Pivot - High = ₹{z3.SUPPORT.toFixed(2)}</div>
          <div>Resistance = 2×Pivot - Low = ₹{z3.RESISTANCE.toFixed(2)}</div>
        </div>
      </motion.div>
    </div>
  );
}

export default StockZonePopup;
