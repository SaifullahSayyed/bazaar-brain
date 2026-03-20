import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import MambaBrain from './logic/MambaBrain';
import Dashboard from './components/Dashboard';
import './styles/globals.css';

function App() {
  const runDemoSequence = async () => {
    console.log('🎬 Demo sequence started');
    
    // T+0: Normal state — do nothing
    
    // T+6s: Inject Banking crisis
    setTimeout(() => {
      MambaBrain.injectSignal('S1', {
        priceChangePct: 7.8,
        volumeRatio: 0.42,
        tension: 0.91,
        voltage: 62,
        waterLevel: 0.15,
        signal: 'BULLISH'
      });
      console.log('📈 Signal injected — S1 Banking');
    }, 6000);

    // T+45s: Auto-trigger AI Briefing
    setTimeout(() => {
      const btn = document.querySelector('[data-briefing-btn="true"]');
      if (btn) btn.click();
      console.log('🧠 AI Briefing triggered');
    }, 45000);

    // T+80s: Auto-acknowledge
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('bazaar-acknowledge'));
      console.log('✅ Demo sequence complete');
    }, 80000);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+P for full demo sequence
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        runDemoSequence();
      }

      // Ctrl+Shift+D for quick isolated injection
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
