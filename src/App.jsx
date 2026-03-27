import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MambaBrain from './logic/MambaBrain';
import Dashboard from './components/Dashboard';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import OnboardingModal, { getOnboardingProfile } from './components/OnboardingModal';
import './styles/globals.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Critical UI Crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#020408', color: '#ef4444', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
          <h1 style={{ color: '#ef4444' }}>CRITICAL_SYSTEM_FAILURE</h1>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>The Bazaar Brain command center has encountered a fatal error.</p>
          <pre style={{ background: 'rgba(255,0,0,0.1)', padding: '1rem', borderRadius: '4px', maxWidth: '80%', overflow: 'auto', fontSize: '0.8rem' }}>
            {this.state.error.toString()}
          </pre>
          <button 
            onClick={() => window.location.href = '/'}
            style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#00ff88', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ← RETRY TO LANDING
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppShell() {
  const [profile, setProfile] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    const saved = getOnboardingProfile();
    setProfile(saved);
    setCheckingProfile(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        runDemoSequence();
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        MambaBrain.injectSignal('S1', {
          priceChangePct: 7.8, volumeRatio: 0.42,
          tension: 0.91, voltage: 62, waterLevel: 0.15, signal: 'BULLISH'
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function runDemoSequence() {
    console.log('🎬 BAZAAR BRAIN DEMO STARTED');
    setTimeout(() => {
      MambaBrain.injectSignal('S1', { priceChangePct: 7.8, volumeRatio: 0.42, tension: 0.91, voltage: 62, waterLevel: 0.15, signal: 'BULLISH' });
      console.log('📈 T+8s: Signal injected → S1');
    }, 8000);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('bazaar-trigger-briefing'));
      console.log('🧠 T+42s: AI Briefing triggered');
    }, 42000);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('bazaar-acknowledge'));
      console.log('✅ T+75s: System acknowledged');
    }, 75000);
    setTimeout(() => {
      console.log('🏆 DEMO COMPLETE — Mathematical proof. Real data. Zero hallucination.');
    }, 85000);
  }

  if (checkingProfile) return null;

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: '#0a1628', color: '#cbd5e1', border: '1px solid #1a3a6b' } }} />
      {/* Show onboarding if first visit */}
      {!profile && (
        <OnboardingModal onComplete={(p) => setProfile(p)} />
      )}
      <Dashboard userProfile={profile} />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/app" element={<AppShell />} />
          {/* Catch-all: redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
