import React, { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'bazaar_brain_onboarding_v1';

export function getOnboardingProfile() {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

const SECTORS = [
  { id: 'S1', name: 'Banking', icon: '🏦' },
  { id: 'S2', name: 'IT', icon: '💻' },
  { id: 'S3', name: 'FMCG', icon: '🛒' },
  { id: 'S4', name: 'Pharma', icon: '💊' },
  { id: 'S5', name: 'Energy', icon: '⚡' },
  { id: 'S6', name: 'Auto', icon: '🚗' },
  { id: 'S7', name: 'Metal', icon: '⚙️' },
  { id: 'S8', name: 'Realty', icon: '🏗️' },
];

export default function OnboardingModal({ onComplete }) {
  const [step, setStep] = useState(1);
  const [selectedSectors, setSelectedSectors] = useState([]);
  const [risk, setRisk] = useState(null);
  const [lang, setLang] = useState(null);

  const toggleSector = (id) => {
    setSelectedSectors(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const finish = () => {
    const profile = { sectors: selectedSectors, risk, lang, name: 'Investor' };
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(profile));
    onComplete(profile);
  };

  const stepStyle = {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,6,20,0.95)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
  };

  const cardStyle = {
    background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)',
    border: '1px solid rgba(0,255,136,0.3)',
    borderRadius: '12px',
    padding: '2.5rem',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 0 60px rgba(0,255,136,0.1)',
  };

  const btnStyle = (active) => ({
    padding: '0.6rem 1.2rem',
    border: `1px solid ${active ? 'var(--color-bull, #00ff88)' : 'rgba(255,255,255,0.15)'}`,
    borderRadius: '6px',
    background: active ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.03)',
    color: active ? '#00ff88' : '#94a3b8',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.2s',
  });

  return (
    <div style={stepStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ color: '#00ff88', fontSize: '0.7rem', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>
            BAZAAR BRAIN · SETUP {step}/3
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${(step / 3) * 100}%`, background: '#00ff88', borderRadius: '2px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Step 1: Sectors */}
        {step === 1 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.4rem' }}>Which sectors do you invest in?</h2>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.5rem' }}>The AI will personalize signals for your portfolio.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {SECTORS.map(s => (
                <button key={s.id} onClick={() => toggleSector(s.id)} style={btnStyle(selectedSectors.includes(s.id))}>
                  {s.icon} {s.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={selectedSectors.length === 0}
              style={{ width: '100%', padding: '0.8rem', background: selectedSectors.length > 0 ? '#00ff88' : '#1e3a3a', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: selectedSectors.length > 0 ? 'pointer' : 'not-allowed', fontSize: '0.9rem' }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Risk Appetite */}
        {step === 2 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.4rem' }}>What is your risk appetite?</h2>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Z3 thresholds will tighten or loosen based on this.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {[
                { val: 'conservative', label: '🛡️ Conservative', desc: 'Alert on early tension signals (Tension > 0.6)' },
                { val: 'moderate', label: '⚖️ Moderate', desc: 'Alert on confirmed patterns (Tension > 0.75)' },
                { val: 'aggressive', label: '🚀 Aggressive', desc: 'Alert only on critical violations (Tension > 0.9)' },
              ].map(r => (
                <button key={r.val} onClick={() => setRisk(r.val)} style={{ ...btnStyle(risk === r.val), textAlign: 'left', padding: '0.8rem 1rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{r.label}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>{r.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: '0.8rem', background: 'transparent', color: '#64748b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep(3)} disabled={!risk} style={{ flex: 2, padding: '0.8rem', background: risk ? '#00ff88' : '#1e3a3a', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: risk ? 'pointer' : 'not-allowed' }}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3: Language */}
        {step === 3 && (
          <div>
            <h2 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.4rem' }}>Preferred language?</h2>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.5rem' }}>The AI Commander will speak accordingly.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
              {[
                { val: 'english', label: 'English', icon: '🇬🇧' },
                { val: 'hindi', label: 'हिंदी (Hindi)', icon: '🇮🇳' },
                { val: 'both', label: 'Both — English + हिंदी', icon: '🌐' },
              ].map(l => (
                <button key={l.val} onClick={() => setLang(l.val)} style={btnStyle(lang === l.val)}>
                  {l.icon} {l.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: '0.8rem', background: 'transparent', color: '#64748b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', cursor: 'pointer' }}>← Back</button>
              <button onClick={finish} disabled={!lang} style={{ flex: 2, padding: '0.8rem', background: lang ? '#00ff88' : '#1e3a3a', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: lang ? 'pointer' : 'not-allowed', fontSize: '0.9rem' }}>
                🚀 Launch Command Center
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
