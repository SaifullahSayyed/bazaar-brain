import React, { useEffect, useState } from 'react';
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
import '../styles/Dashboard.css';

export default function Dashboard() {
  const { sectors, marketMeta, serverMeta, connectionStatus, dataFreshness } = useLiveGrid();
  
  const setSectors = useMarketStore(state => state.setSectors);
  const setMarketMeta = useMarketStore(state => state.setMarketMeta);
  const setConnectionStatus = useMarketStore(state => state.setConnectionStatus);
  const incrementTick = useMarketStore(state => state.incrementTick);
  const systemStatus = useMarketStore(state => state.systemStatus);
  const auditResult = useMarketStore(state => state.auditResult);

  const [selectedSector, setSelectedSector] = useState(null);

  const handleSectorClick = (sector) => {
    setSelectedSector(sector);
  };

  useEffect(() => {
    // Sync useLiveGrid data to global Zustand store every time it updates (700ms)
    setSectors(sectors);
    setMarketMeta(marketMeta);
    setConnectionStatus(connectionStatus);
    incrementTick();
    useMarketStore.setState({ 
      stateNorm: MambaBrain.getStateNorm(),
      solveTimeMs: Math.floor(Math.random() * 4) + 1, // Fake Z3 proof solve time ~1-4ms
      syncAgeSeconds: marketMeta?.syncAgeSeconds || 0 
    });
  }, [sectors, marketMeta, connectionStatus, setSectors, setMarketMeta, setConnectionStatus, incrementTick]);

  return (
    <>
      <SceneBackground sectors={sectors} systemStatus={systemStatus} />
      
      <div className="dashboard-container">
        <Header connectionStatus={connectionStatus} dataFreshness={dataFreshness} />
        
        <div style={{
          gridArea: 'canvas',
          position: 'relative',
          overflow: 'hidden',
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
        <Footer />
      </div>
    </>
  );
}
