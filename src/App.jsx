import { useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import useLiveGrid from './hooks/useLiveGrid';
import MambaBrain from './logic/MambaBrain';
import { APP_NAME, APP_TAGLINE } from './logic/constants';
import './styles/index.css';

function App() {
  const { sectors, marketMeta, serverMeta, connectionStatus, dataFreshness } = useLiveGrid();

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
    <div className="app-container">
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      
      <header className="app-header">
        <div className="branding">
          <h1>{APP_NAME}</h1>
          <p className="tagline">{APP_TAGLINE}</p>
        </div>
        
        <div className="status-panel">
          <div className="status-item">
            <span className="label">SYS</span>
            <span className={`value status-${connectionStatus.toLowerCase()}`}>{connectionStatus}</span>
          </div>
          <div className="status-item">
            <span className="label">FEED</span>
            <span className={`value status-${dataFreshness.toLowerCase()}`}>{dataFreshness}</span>
          </div>
          {marketMeta?.nifty50 && (
            <div className="status-item">
              <span className="label">NIFTY</span>
              <span className={`value ${marketMeta.nifty50.changePct >= 0 ? 'bullish' : 'bearish'}`}>
                {marketMeta.nifty50.price.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </header>
      
      <main className="grid-container">
        {sectors.map((sector) => (
          <div key={sector.id} className={`sector-card ${sector.signal.toLowerCase()}`}>
            <div className="sector-header">
              <h2>{sector.name}</h2>
              <span className="symbol">{sector.nifty}</span>
            </div>
            
            <div className="metrics-grid">
              <div className="metric">
                <span className="label">Tension</span>
                <span className="value">{sector.tension?.toFixed(3)}</span>
              </div>
              <div className="metric">
                <span className="label">Voltage</span>
                <span className="value">{sector.voltage?.toFixed(1)}</span>
              </div>
              <div className="metric">
                <span className="label">Water</span>
                <span className="value">{sector.waterLevel?.toFixed(2)}</span>
              </div>
              <div className="metric">
                <span className="label">Pressure</span>
                <span className="value">{sector.pressure?.toFixed(1)}</span>
              </div>
            </div>
            
            <div className="sector-footer">
              <div className="price-change">
                {sector.priceChangePct >= 0 ? '+' : ''}{sector.priceChangePct?.toFixed(2)}%
              </div>
              <div className="signal-badge">
                {sector.signal}
              </div>
            </div>
          </div>
        ))}
      </main>
      
      <div className="cyber-overlay"></div>
    </div>
  );
}

export default App;
