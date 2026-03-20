import React, { useEffect } from 'react';
import SceneBackground from './3d/SceneBackground';
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
        
        <div className="canvas-area">
          <div>
            3D MARKET NERVE CENTER — INITIALIZING<span className="anim-dots"></span>
          </div>
        </div>
        
        <Sidebar sectors={sectors} />
        <Footer />
      </div>
    </>
  );
}
