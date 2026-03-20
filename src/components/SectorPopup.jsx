import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { useMarketStore } from '../context/MarketStore';
import '../styles/SectorPopup.css';

const formatNum = (num) => num ? num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

export default function SectorPopup({ sector, onClose }) {
  const [history, setHistory] = useState([]);
  const historyRef = useRef([]);

  const systemStatus = useMarketStore(state => state.systemStatus);
  const auditResult = useMarketStore(state => state.auditResult);
  
  const isViolating = systemStatus === 'SIGNAL_DETECTED' && auditResult?.violatingSectorId === sector?.id;

  useEffect(() => {
    if (!sector) return;
    
    // Add current priceChangePct to history
    const newEntry = {
      timestamp: Date.now(),
      value: sector.priceChangePct || 0
    };
    
    historyRef.current = [...historyRef.current, newEntry].slice(-20);
    setHistory(historyRef.current);
    
  }, [sector?.priceChangePct, sector?.id]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!sector) return null;

  const arrow = sector.priceChangePct >= 0 ? '↑' : '↓';
  const signal = sector.signal || 'NEUTRAL';
  let themeColor = '#00FFFF';
  if (signal === 'BULLISH') themeColor = '#00FF88';
  if (signal === 'BEARISH') themeColor = '#FF2222';
  if (isViolating) themeColor = '#FF2222';

  // D3 Sparkline
  const width = 240;
  const height = 48;
  const margin = { top: 4, right: 0, bottom: 4, left: 0 };
  
  let dPath = '';
  let dArea = '';
  if (history.length > 1) {
    const minX = d3.min(history, d => d.timestamp);
    const maxX = d3.max(history, d => d.timestamp);
    const domainY = d3.extent(history, d => d.value);
    
    // add small padding to Y domain to avoid clipping
    const diff = domainY[1] - domainY[0] === 0 ? 1 : domainY[1] - domainY[0];
    const minY = domainY[0] - diff * 0.1;
    const maxY = domainY[1] + diff * 0.1;

    const xScale = d3.scaleLinear()
      .domain([minX, maxX])
      .range([margin.left, width - margin.right]);
      
    const yScale = d3.scaleLinear()
      .domain([minY, maxY])
      .range([height - margin.bottom, margin.top]);

    const line = d3.line()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
      
    const area = d3.area()
      .x(d => xScale(d.timestamp))
      .y0(height)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    dPath = line(history);
    dArea = area(history);
  }

  const tensionPct = Math.min((sector.tension || 0) * 100, 100);
  const humidityPct = ((sector.humidity || 0) * 100).toFixed(0);
  const volPct = (sector.volumeRatio || 0).toFixed(2);
  const pressure = sector.pressure || 0;

  return (
    <>
      <div className="popup-backdrop" onClick={onClose} />
      <motion.div 
        className="sector-popup-container"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{ borderLeftColor: themeColor }}
      >
        <div className="popup-header">
          <div className="popup-title">{sector.name}</div>
          <button className="popup-close" onClick={onClose}>×</button>
        </div>
        
        <div className="popup-signal-row">
          <span className="sc-nifty">{sector.nifty}</span>
          <div className="popup-badge" style={{ color: themeColor, backgroundColor: `${themeColor}22` }}>
            {signal}
          </div>
        </div>

        <div className="popup-metrics-grid">
          <div className="metric">
            <div className="m-label">Current Price</div>
            <div className="m-value">₹{formatNum(sector.currentPrice)}</div>
          </div>
          <div className="metric">
            <div className="m-label">Change</div>
            <div className="m-value" style={{ color: themeColor }}>
              {arrow} {Math.abs(sector.priceChangePct || 0).toFixed(2)}%
            </div>
          </div>
          <div className="metric">
            <div className="m-label">Tension</div>
            <div className="m-value">{tensionPct.toFixed(0)}%</div>
          </div>
          <div className="metric">
            <div className="m-label">Volume</div>
            <div className="m-value">{volPct}x</div>
          </div>
          <div className="metric">
            <div className="m-label">Humidity</div>
            <div className="m-value">{humidityPct}%</div>
          </div>
          <div className="metric">
            <div className="m-label">Pressure</div>
            <div className="m-value">{pressure.toFixed(1)}</div>
          </div>
        </div>

        <div className="sparkline-wrapper">
          <svg width={width} height={height}>
            <defs>
              <linearGradient id={`${sector.id}-grad`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={themeColor} stopOpacity="0.4" />
                <stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {dArea && <path d={dArea} fill={`url(#${sector.id}-grad)`} />}
            {dPath && <path d={dPath} fill="none" stroke={themeColor} strokeWidth="2" />}
          </svg>
        </div>

        <div className="z3-status-row">
          {isViolating ? (
            <span style={{ color: 'var(--color-bear)' }}>Z3 STATUS: SIGNAL DETECTED</span>
          ) : (
            <span style={{ color: 'var(--color-proof)' }}>Z3 STATUS: SAFE</span>
          )}
        </div>
      </motion.div>
    </>
  );
}
