import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import MambaBrain from '../logic/MambaBrain';
import { WS_PORT, TICK_MS } from '../logic/constants';

export function useLiveGrid() {
  const [sectors, setSectors] = useState([]);
  const [marketMeta, setMarketMeta] = useState(null);
  const [serverMeta, setServerMeta] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('OFFLINE');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dataFreshness, setDataFreshness] = useState('STALE');

  const socketRef = useRef(null);
  const reconnectDelayRef = useRef(500);
  const autonomousIntervalRef = useRef(null);

  useEffect(() => {
    let isSubscribed = true;

    const connect = () => {
      if (!isSubscribed) return;
      setConnectionStatus('RECONNECTING');

      const socketUrl = `http://${window.location.hostname}:${WS_PORT}`;
      const socket = io(socketUrl, {
        reconnection: false, // We'll handle manual reconnect with backoff
        timeout: 2000
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        if (!isSubscribed) return;
        setConnectionStatus('CONNECTED');
        reconnectDelayRef.current = 500; // Reset backoff
        
        // Clear autonomous interval when connected
        if (autonomousIntervalRef.current) {
          clearInterval(autonomousIntervalRef.current);
          autonomousIntervalRef.current = null;
        }
      });

      socket.on('tick', (payload) => {
        if (!isSubscribed) return;
        
        // Pass live sectors to MambaBrain
        const mambaOutput = MambaBrain.tick(payload.sectors);
        
        setSectors(mambaOutput);
        setMarketMeta(payload.marketMeta);
        setServerMeta(payload.serverMeta);
        setLastUpdate(payload.timestamp);
        setDataFreshness(payload.dataFreshness);
      });

      socket.on('disconnect', () => {
        if (!isSubscribed) return;
        setConnectionStatus('OFFLINE');
        startAutonomousMode();
        handleReconnect();
      });

      socket.on('connect_error', () => {
        if (!isSubscribed) return;
        setConnectionStatus('OFFLINE');
        startAutonomousMode();
        handleReconnect();
      });
    };

    const handleReconnect = () => {
      if (!isSubscribed) return;
      if (socketRef.current) {
        socketRef.current.close();
      }
      setTimeout(() => {
        if (isSubscribed) {
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000);
          connect();
        }
      }, reconnectDelayRef.current);
    };

    const startAutonomousMode = () => {
      if (autonomousIntervalRef.current) return;
      
      // Immediately run once to prevent UI blank
      const mambaOutput = MambaBrain.tick();
      setSectors(mambaOutput);
      setMarketMeta(MambaBrain.getMarketMeta());
      setDataFreshness('OFFLINE_MAMBA');
      
      autonomousIntervalRef.current = setInterval(() => {
        if (isSubscribed) {
          const mambaOutput = MambaBrain.tick();
          setSectors([...mambaOutput]); 
          setMarketMeta(MambaBrain.getMarketMeta());
          setDataFreshness('OFFLINE_MAMBA');
        }
      }, TICK_MS);
    };

    // Initial autonomous run until connection settles
    startAutonomousMode();
    connect();

    return () => {
      isSubscribed = false;
      if (autonomousIntervalRef.current) {
        clearInterval(autonomousIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    sectors,
    marketMeta,
    serverMeta,
    connectionStatus,
    lastUpdate,
    dataFreshness
  };
}

export default useLiveGrid;
