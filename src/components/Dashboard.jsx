import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import SceneBackground from './3d/SceneBackground';
import MarketNerveCenter from './3d/MarketNerveCenter';
import SectorPopup from './SectorPopup';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import useLiveGrid from '../hooks/useLiveGrid';
import MambaBrain from '../logic/MambaBrain';
import { useMarketStore } from '../context/MarketStore';
import { useRiskAuditor } from '../hooks/useRiskAuditor';
import { generateMarketDirective, generateMarketBriefing, generateNearMissWarning } from '../logic/GeminiService';
import AICommanderPanel from './AICommanderPanel';
import AIBriefingPanel from './AIBriefingPanel';
import '../styles/Dashboard.css';
import Sidebar from './Sidebar';
import Footer from './Footer';
import useLiveGrid from '../hooks/useLiveGrid';
import MambaBrain from '../logic/MambaBrain';
import { useMarketStore } from '../context/MarketStore';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const { sectors, marketMeta, serverMeta, connectionStatus, dataFreshness } = useLiveGrid();
  
  const setSectors = useMarketStore(state => state.setSectors);
  const setMarketMeta = useMarketStore(state => state.setMarketMeta);
  const setConnectionStatus = useMarketStore(state => state.setConnectionStatus);
  const incrementTick = useMarketStore(state => state.incrementTick);
  
  const systemStatus = useMarketStore(state => state.systemStatus);
  const setSystemStatus = useMarketStore(state => state.setSystemStatus);
  const aiStatus = useMarketStore(state => state.aiStatus);
  const setAiStatus = useMarketStore(state => state.setAiStatus);
  const pushSignalEvent = useMarketStore(state => state.pushSignalEvent);
  const acknowledgeSignal = useMarketStore(state => state.acknowledgeSignal);

  const { auditResult, solveTimeMs, auditSectors } = useRiskAuditor();
  const [directive, setDirective] = useState('');
  const [showBriefing, setShowBriefing] = useState(false);
  const [aiBriefing, setAiBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [isGeneratingDirective, setIsGeneratingDirective] = useState(false);

  const [selectedSector, setSelectedSector] = useState(null);
  const handleSectorClick = (sector) => setSelectedSector(sector);

  const lastNearMissRef = useRef({});

  // Handlers required by App Demo and Buttons
  const handleAIBriefing = async () => {
    setShowBriefing(true);
    setBriefingLoading(true);
    const start = performance.now();
    try {
      const text = await generateMarketBriefing(sectors, marketMeta);
      setAiBriefing({ 
        text, 
        generatedInMs: Math.round(performance.now() - start) 
      });
      pushSignalEvent({
        type: 'BRIEFING',
        text: text.slice(0, 80) + '...',
        time: new Date().toLocaleTimeString('en-IN', { hour12: false })
      });
    } finally {
      setBriefingLoading(false);
    }
  };

  const handleAcknowledge = useCallback(() => {
    acknowledgeSignal();
    setDirective('');
    setSystemStatus('MONITORING');
    setAiStatus('STANDBY');
    pushSignalEvent({
      type: 'SAFE',
      text: 'Signal acknowledged. Resuming monitoring.',
      time: new Date().toLocaleTimeString('en-IN', { hour12: false })
    });
  }, [acknowledgeSignal, setSystemStatus, setAiStatus, pushSignalEvent]);

  useEffect(() => {
    const handler = () => handleAcknowledge();
    window.addEventListener('bazaar-acknowledge', handler);
    return () => window.removeEventListener('bazaar-acknowledge', handler);
  }, [handleAcknowledge]);

  useEffect(() => {
    // Sync useLiveGrid data to global Zustand store every time it updates (700ms)
    setSectors(sectors);
    setMarketMeta(marketMeta);
    setConnectionStatus(connectionStatus);
    incrementTick();
    useMarketStore.setState({ 
      stateNorm: MambaBrain.getStateNorm(),
      syncAgeSeconds: marketMeta?.syncAgeSeconds || 0 
    });

    const result = auditSectors(sectors);

    if (result && !result.safe && systemStatus !== 'SIGNAL_DETECTED' && !isGeneratingDirective) {
      setSystemStatus('SIGNAL_DETECTED');
      setAiStatus('THINKING');
      setIsGeneratingDirective(true);
      generateMarketDirective(result)
        .then(text => {
          setDirective(text);
          setAiStatus('COMMANDING');
          setIsGeneratingDirective(false);
          pushSignalEvent({
            type: 'SIGNAL',
            text: text.split('HINDI:')[0].trim().slice(0, 80),
            sector: result.violatingSectorName,
            metrics: result.violatingMetrics,
            time: new Date().toLocaleTimeString('en-IN', { hour12: false })
          });
        })
        .catch(() => {
          setIsGeneratingDirective(false);
        });
    }

    if (result?.safe && systemStatus !== 'SIGNAL_DETECTED') {
      const nearMiss = sectors.find(s => (s.tension ?? 0) > 0.82);
      if (nearMiss) {
        const lastT = lastNearMissRef.current[nearMiss.name] || 0;
        if (Date.now() - lastT > 20000) { // Throttle GM warning spam to every 20s per sector
          lastNearMissRef.current[nearMiss.name] = Date.now();
          generateNearMissWarning(nearMiss)
            .then(text => {
              pushSignalEvent({
                type: 'NEAR_MISS',
                text: text.split('HINDI:')[0].trim().slice(0, 80),
                sector: nearMiss.name,
                time: new Date().toLocaleTimeString('en-IN', { hour12: false })
              });
            });
        }
      }
    }
  }, [sectors, marketMeta, connectionStatus, setSectors, setMarketMeta, setConnectionStatus, incrementTick]);

  return (
    <>
      <SceneBackground sectors={sectors} systemStatus={systemStatus} />
      
      <div className="dashboard-container">
        <Header connectionStatus={connectionStatus} dataFreshness={dataFreshness} onBriefingClick={handleAIBriefing} />
        
        <div style={{
          gridArea: 'canvas',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          minHeight: '400px',
          borderRadius: '1rem',
          border: '1px solid var(--color-border)',
          margin: '1rem',
          background: 'rgba(6, 13, 26, 0.4)',
          backdropFilter: 'blur(8px)'
        }}>
          <MarketNerveCenter
            sectors={sectors}
            auditResult={auditResult}
            onSectorClick={handleSectorClick}
          />
          <AnimatePresence>
            {selectedSector && (
              <SectorPopup
                sector={selectedSector}
                onClose={() => setSelectedSector(null)}
              />
            )}
          </AnimatePresence>
        </div>
        
        <Sidebar sectors={sectors} />
        <Footer solveTimeMs={solveTimeMs} />

        <AnimatePresence>
          {showBriefing && (
            <AIBriefingPanel
              briefing={aiBriefing}
              isLoading={briefingLoading}
              onClose={() => {
                setShowBriefing(false)
                setAiBriefing(null)
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {systemStatus === 'SIGNAL_DETECTED' && (
            <AICommanderPanel
              auditResult={auditResult}
              directive={directive}
              onAcknowledge={handleAcknowledge}
            />
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
