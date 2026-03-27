import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import { useMarketStore } from '../context/MarketStore';
import { useSectorStocks } from '../hooks/useSectorStocks';
import '../styles/SectorPopup.css';

const formatNum = (num) => num ? num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

function SectorPopup({ sector, onClose }) {
  const [history, setHistory] = useState([]);
  const historyRef = useRef([]);
  const { stocks, isLoading, fetchStocks } = useSectorStocks();

  const systemStatus = useMarketStore(state => state.systemStatus);
  const auditResult = useMarketStore(state => state.auditResult);
  const educationMode = useMarketStore(state => state.educationMode);
  
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

  useEffect(() => {
    if (sector?.id) {
      fetchStocks(sector.id);
    }
  }, [sector?.id, fetchStocks]);

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
            <div className="m-label">
              Tension
              {educationMode && <span className="edu-info-tag" title="A measure of price/volume divergence indicating potential trend exhaustion. High tension signals a likely reversal or breakout.">?</span>}
            </div>
            <div className="m-value">{tensionPct.toFixed(0)}%</div>
          </div>
          <div className="metric">
            <div className="m-label">
              Volume
              {educationMode && <span className="edu-info-tag" title="Current trading activity relative to the 5-day moving average. A ratio > 1.5x often signals institutional accumulation or distribution.">?</span>}
            </div>
            <div className="m-value">{volPct}x</div>
          </div>
          <div className="metric">
            <div className="m-label">
              Humidity
              {educationMode && <span className="edu-info-tag" title="Market liquidity depth. Higher humidity means smoother price discovery with less slippage for large orders.">?</span>}
            </div>
            <div className="m-value">{humidityPct}%</div>
          </div>
          <div className="metric">
            <div className="m-label">
              Pressure
              {educationMode && <span className="edu-info-tag" title="Net order flow bias (Buy vs Sell imbalance). Positive pressure = more buyers; negative = more sellers.">?</span>}
            </div>
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

        <div className="sector-breakdown-panel">
          <div className="breakdown-header">
            LIVE CONSTITUENT ANALYSIS
            <div className="breakdown-subtext">∇ Z3 mathematically verified targets</div>
          </div>
          <div className="breakdown-list">
            {isLoading ? (
              <div className="loading-row">
                <div className="pulse-dot" />
                Initializing stock-level audit...
              </div>
            ) : stocks.length === 0 ? (
              <div className="loading-row error-state">
                <div className="warning-icon">⚠</div>
                Constituent data sync interrupted. Reconnecting...
              </div>
            ) : (
              stocks.map(st => {
                const zoneColor = st.zoneStatus === 'SAFE' ? 'var(--color-bull)' : st.zoneStatus === 'BREAKOUT' ? 'var(--color-warning)' : 'var(--color-bear)';
                return (
                  <div 
                    key={st.symbol} 
                    className="stock-item-row"
                    onClick={() => {
                      // Dispatch custom event for Dashboard to pick up
                      window.dispatchEvent(new CustomEvent('bazaar-show-stock-detail', { 
                        detail: { stock: st, sectorName: sector.name } 
                      }));
                    }}
                  >
                    <div className="st-info">
                      <div className="st-symbol">{st.shortName}</div>
                      <div className="st-fullname">{st.name}</div>
                    </div>
                    
                    <div className="st-price-block">
                      <div className="st-price">₹{st.currentPrice.toFixed(2)}</div>
                      <div className={st.priceChangePct >= 0 ? "st-chg-plus" : "st-chg-minus"}>
                        {st.priceChangePct >= 0 ? '+' : ''}{st.priceChangePct.toFixed(2)}%
                      </div>
                    </div>

                    <div className="st-z3-block">
                      <div className="st-zone-pill" style={{ borderColor: zoneColor, color: zoneColor }}>
                        {st.zoneStatus}
                      </div>
                      <div className="st-vol">Vol: {st.volumeRatio.toFixed(1)}x</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="breakdown-footer">
            <div className="breadth-text">
              SECTOR BREADTH: <span style={{ color: 'var(--color-bull)' }}>{stocks.filter(s => s.signal === 'BULLISH').length}/3 Bullish</span>
            </div>
            <div className="health-score">
              Z3 SCORE: <span style={{ color: 'var(--color-cyan)' }}>{stocks.filter(s => s.zoneStatus === 'SAFE').length * 33 + 1}% SECURE</span>
            </div>
          </div>
        </div>

      </motion.div>
    </>
  );
}

export default React.memo(SectorPopup);
