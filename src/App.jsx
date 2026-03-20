import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import MambaBrain from './logic/MambaBrain';
import Dashboard from './components/Dashboard';
import './styles/globals.css';

function App() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+D
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        
        MambaBrain.injectSignal('S1', {
          priceChangePct: 7.8,
          volumeRatio: 0.42,
          tension: 0.91,
          voltage: 62,
          waterLevel: 0.15,
          signal: 'BULLISH'
        });
        
        // Zero visual indicator. Silent. Only presenter knows.
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: '#0a1628', color: '#cbd5e1', border: '1px solid #1a3a6b' } }} />
      <Dashboard />
    </>
  );
}

export default App;
