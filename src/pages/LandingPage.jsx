import React, { useState, useEffect, useRef } from 'react';

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '⬡',
    title: 'Z3 Formal Proof Engine',
    desc: 'Every signal is verified by an SMT solver before the AI speaks. Mathematical certainty, not probability.',
    color: '#00ff88',
    glow: 'rgba(0,255,136,0.15)',
  },
  {
    icon: '🧠',
    title: 'Gemini AI Briefing',
    desc: 'Real-time NSE intelligence across 5 pillars: Status · Watch · Opportunity · Directive · Hindi briefing.',
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.15)',
  },
  {
    icon: '🎙️',
    title: 'Hindi Voice Commander',
    desc: '"Banking sector ka status batao" — speak in Hindi, get a Z3-verified risk proof in seconds.',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.15)',
  },
  {
    icon: '🌡️',
    title: 'Contagion Heatmap',
    desc: 'Cross-sector risk propagation visualized in real-time. See how a Bank shock ripples into Realty and Auto.',
    color: '#ef4444',
    glow: 'rgba(239,68,68,0.15)',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'NSE Live Data Ingested',
    desc: 'Sector prices, volume ratios, and order flow bias pulled every 700ms via our data waterfall.',
    color: '#00ff88',
  },
  {
    step: '02',
    title: 'Z3 Runs Formal Verification',
    desc: 'The SMT solver checks every sector against 3 mathematical rules: momentum trap, circuit breaker, high tension.',
    color: '#8b5cf6',
  },
  {
    step: '03',
    title: 'Gemini Issues the Directive',
    desc: 'Only after Z3 signs off does the AI Commander speak. The proof is shown — not just the conclusion.',
    color: '#f59e0b',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Caught a momentum trap in Auto sector before the crash. Saved my ₹1.4L position.',
    name: 'Rahul Sharma',
    role: 'Retail Investor · Mumbai',
    initials: 'RS',
    color: '#00ff88',
  },
  {
    quote: 'The Hindi voice feature is a game-changer. I just ask and the proof appears. Finally AI for us.',
    name: 'Priya Nair',
    role: 'SIP Investor · Bangalore',
    initials: 'PN',
    color: '#8b5cf6',
  },
  {
    quote: 'Z3 proof summaries give my clients something concrete. Not tips — math. Compliance loves it.',
    name: 'Amit Desai',
    role: 'SEBI-Registered Advisor · Ahmedabad',
    initials: 'AD',
    color: '#f59e0b',
  },
];

const Z3_LINES = [
  '> SECTOR: Banking & Finance (NIFTY BANK)',
  '> priceChangePct: 7.82, volumeRatio: 0.41',
  '> RULE CHECK: momentum_trap(s) ≡',
  '>   priceChangePct > 6% ∧ volumeRatio < 0.5',
  '> SMT SOLVER: Running Z3 v4.13.0...',
  '> RESULT: ✓ SAT — Momentum trap DETECTED',
  '> PROOF: ∃s ∈ Sectors: momentum_trap(s)',
  '> STATUS: SIGNAL DETECTED — Gemini notified',
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCounter(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      setCount(c => {
        if (c + step >= target) { clearInterval(timer); return target; }
        return c + step;
      });
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return Math.floor(count);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Z3Terminal() {
  const [lines, setLines] = useState([]);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    let isMounted = true;
    let timerId = null;

    const addLine = () => {
      if (!isMounted) return;
      if (i < Z3_LINES.length) {
        setLines(prev => [...prev, Z3_LINES[i]]);
        i++;
        timerId = setTimeout(addLine, 380 + Math.random() * 200);
      } else {
        // loop after a pause
        timerId = setTimeout(() => { 
          if (!isMounted) return;
          setLines([]); 
          i = 0; 
          addLine(); 
        }, 4000);
      }
    };

    timerId = setTimeout(addLine, 600);
    const cursorT = setInterval(() => setCursor(c => !c), 530);

    return () => { 
      isMounted = false;
      if (timerId) clearTimeout(timerId); 
      clearInterval(cursorT); 
    };
  }, []);

  return (
    <div style={{
      background: 'rgba(0,0,0,0.6)',
      border: '1px solid rgba(0,255,136,0.25)',
      borderRadius: '10px',
      padding: '1.2rem 1.5rem',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      fontSize: '0.72rem',
      lineHeight: 1.8,
      maxWidth: '520px',
      width: '100%',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 0 40px rgba(0,255,136,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
      minHeight: '200px',
    }}>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.8rem' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ff88' }} />
        <span style={{ color: '#64748b', marginLeft: '0.5rem', fontSize: '0.6rem' }}>z3-risk-auditor — live</span>
      </div>
      {lines.map((line, idx) => {
        const isResult = line?.includes?.('RESULT') || line?.includes?.('STATUS');
        const isProof = line?.includes?.('PROOF');
        return (
          <div key={idx} style={{
            color: isResult ? '#ef4444' : isProof ? '#8b5cf6' : '#00ff88',
            opacity: lines.length > 0 && idx === lines.length - 1 ? 1 : 0.75,
          }}>
            {line}
          </div>
        );
      })}
      {lines.length > 0 && lines.length < Z3_LINES.length && (
        <span style={{ color: '#00ff88', opacity: cursor ? 1 : 0 }}>█</span>
      )}
    </div>
  );
}

function StatCard({ value, label, suffix = '' }) {
  return (
    <div style={{ textAlign: 'center', padding: '0 1.5rem' }}>
      <div style={{
        fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
        fontWeight: 900,
        background: 'linear-gradient(135deg, #00ff88, #8b5cf6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
      }}>
        {value.toLocaleString('en-IN')}{suffix}
      </div>
      <div style={{ color: '#94a3b8', fontSize: '0.72rem', letterSpacing: '0.12em', marginTop: '0.3rem' }}>{label}</div>
    </div>
  );
}

function FeatureCard({ f }) {
  const [hovered, setHovered] = useState(false);
  if (!f || !f.title) return null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? (f.glow || 'rgba(255,255,255,0.05)') : 'rgba(255,255,255,0.025)',
        border: `1px solid ${hovered ? (f.color || '#00ff88') : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '14px',
        padding: '2rem',
        transition: 'all 0.35s ease',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? `0 16px 40px ${f.glow || 'rgba(0,255,136,0.15)'}, 0 0 0 1px ${f.color || '#00ff88'}30` : 'none',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: '12px',
        background: `${f.color || '#00ff88'}18`, border: `1px solid ${f.color || '#00ff88'}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', marginBottom: '1.2rem',
        transition: 'all 0.35s',
        boxShadow: hovered ? `0 0 20px ${f.color || '#00ff88'}40` : 'none',
      }}>
        {f.icon || '⬡'}
      </div>
      <h3 style={{ color: f.color || '#00ff88', fontSize: '0.85rem', letterSpacing: '0.08em', marginBottom: '0.7rem', fontWeight: 700 }}>
        {f.title || 'Feature'}
      </h3>
      <p style={{ color: '#64748b', fontSize: '0.83rem', lineHeight: 1.7, margin: 0 }}>
        {f.desc || 'Descripting coming soon.'}
      </p>
    </div>
  );
}

function TestimonialCard({ t }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '12px',
      padding: '1.8rem',
      flex: '1 1 260px',
      maxWidth: '340px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.2rem',
    }}>
      <div style={{ color: t.color, fontSize: '1.5rem', lineHeight: 1, opacity: 0.6 }}>"</div>
      <p style={{ color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.7, margin: 0, fontStyle: 'italic', flex: 1 }}>
        {t.quote}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `linear-gradient(135deg, ${t.color}80, ${t.color}30)`,
          border: `1px solid ${t.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.65rem', fontWeight: 700, color: t.color,
          flexShrink: 0,
        }}>
          {t.initials}
        </div>
        <div>
          <div style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 600 }}>{t.name}</div>
          <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{t.role}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [waitlist, setWaitlist] = useState(47);
  const signalsProven = useCounter(1247);
  const investorsProtected = useCounter(890);

  useEffect(() => {
    const t1 = setInterval(() => {
      if (Math.random() > 0.85) setWaitlist(p => p + 1);
    }, 14000);
    return () => clearInterval(t1);
  }, []);

  const navStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(0,6,20,0.88)',
    backdropFilter: 'blur(16px)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000614',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      color: '#fff',
      overflowX: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)' }} />
      </div>

      {/* ── NAV ── */}
      <nav style={navStyle}>
        <div style={{ color: '#00ff88', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="20" height="20" viewBox="0 0 100 100" style={{ fill: 'none', stroke: '#00ff88', strokeWidth: 8 }}>
            <polygon points="50 3 93 25 93 75 50 97 7 75 7 25" />
          </svg>
          BAZAAR BRAIN
        </div>
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
          <a href="/pricing" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#e2e8f0'}
            onMouseLeave={e => e.target.style.color = '#64748b'}
          >Pricing</a>
          <div style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{
            color: '#00ff88', fontSize: '0.68rem', letterSpacing: '0.08em',
            background: 'rgba(0,255,136,0.08)', padding: '0.25rem 0.65rem',
            borderRadius: '20px', border: '1px solid rgba(0,255,136,0.2)',
          }}>
            ● {waitlist} on waitlist
          </span>
          <a href="/app" style={{
            background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
            color: '#000', padding: '0.5rem 1.4rem', borderRadius: '6px',
            textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem',
            letterSpacing: '0.05em', transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.target.style.opacity = '0.85'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >Launch App →</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: 'clamp(4rem, 10vw, 8rem) 2rem 5rem', display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Left text */}
        <div style={{ flex: '1 1 400px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.2)',
            borderRadius: '20px', padding: '0.35rem 0.9rem', marginBottom: '2rem',
            fontSize: '0.68rem', color: '#00ff88', letterSpacing: '0.08em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff88', display: 'inline-block', animation: 'hero-pulse 1.5s ease-in-out infinite' }} />
            {signalsProven.toLocaleString('en-IN')}+ signals proven mathematically
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', fontWeight: 900, lineHeight: 1.12, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            India's retail investors deserve{' '}
            <span style={{ color: '#ef4444' }}>proof,</span>
            <br />not{' '}
            <span style={{ background: 'linear-gradient(90deg, #00ff88, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>guesses.</span>
          </h1>

          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.75, maxWidth: '440px', marginBottom: '2.5rem' }}>
            The Z3 SMT solver runs formal logic verification on all 8 NSE sectors every 700ms.
            When Gemini speaks — the math is already done.
          </p>

          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <a href="/app" style={{
              background: 'linear-gradient(135deg, #00ff88, #00b860)',
              color: '#000', padding: '0.85rem 2rem', borderRadius: '8px',
              textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem',
              boxShadow: '0 0 30px rgba(0,255,136,0.3)', transition: 'all 0.25s ease',
            }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 40px rgba(0,255,136,0.45)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 0 30px rgba(0,255,136,0.3)'; }}
            >
              Launch Command Center →
            </a>
            <a href="/pricing" style={{
              background: 'transparent', color: '#94a3b8', padding: '0.85rem 1.5rem',
              borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem',
              border: '1px solid rgba(255,255,255,0.12)', transition: 'all 0.25s',
            }}
              onMouseEnter={e => { e.target.style.borderColor = 'rgba(255,255,255,0.3)'; e.target.style.color = '#e2e8f0'; }}
              onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.color = '#94a3b8'; }}
            >
              View Pricing
            </a>
          </div>
        </div>

        {/* Right Z3 terminal */}
        <div style={{ flex: '1 1 360px', display: 'flex', justifyContent: 'center' }}>
          <Z3Terminal />
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '2rem', background: 'rgba(255,255,255,0.015)', backdropFilter: 'blur(4px)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1.5rem' }}>
          <StatCard value={signalsProven} suffix="+" label="SIGNALS PROVEN TODAY" />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
          <StatCard value={8} label="NSE SECTORS MONITORED" />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
          <StatCard value={investorsProtected} suffix="+" label="INVESTORS BETA TESTING" />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
          <StatCard value={700} suffix="ms" label="AUDIT CYCLE SPEED" />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ color: '#00ff88', fontSize: '0.65rem', letterSpacing: '0.35em', marginBottom: '0.8rem' }}>CAPABILITIES</div>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', fontWeight: 800, margin: 0 }}>
            Four pillars of <span style={{ color: '#8b5cf6' }}>zero-hallucination</span> intelligence.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.2rem' }}>
          {FEATURES.map(f => <FeatureCard key={f.title} f={f} />)}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ color: '#8b5cf6', fontSize: '0.65rem', letterSpacing: '0.35em', marginBottom: '0.8rem' }}>THE PROCESS</div>
            <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', fontWeight: 800, margin: 0 }}>How Bazaar Brain works.</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {HOW_IT_WORKS.map((step, idx) => (
              <div key={step.step} style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', position: 'relative' }}>
                {/* Step number + line */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 52, height: 52,
                    borderRadius: '50%', border: `2px solid ${step.color}`,
                    background: `${step.color}12`, color: step.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em',
                    boxShadow: `0 0 20px ${step.color}25`,
                  }}>
                    {step.step}
                  </div>
                  {idx < HOW_IT_WORKS.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 40, background: `linear-gradient(to bottom, ${step.color}40, ${HOW_IT_WORKS[idx + 1].color}20)`, margin: '0.5rem 0' }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ paddingTop: '0.8rem', paddingBottom: idx < HOW_IT_WORKS.length - 1 ? '2.5rem' : 0 }}>
                  <h3 style={{ color: step.color, fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{step.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.7, margin: 0, maxWidth: '560px' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ color: '#f59e0b', fontSize: '0.65rem', letterSpacing: '0.35em', marginBottom: '0.8rem' }}>BETA INVESTORS</div>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2.2rem)', fontWeight: 800, margin: 0 }}>Math saved their money. Hear it from them.</h2>
        </div>
        <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {TESTIMONIALS.map(t => <TestimonialCard key={t.name} t={t} />)}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 2rem 6rem' }}>
        <div style={{
          maxWidth: '680px', margin: '0 auto', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(139,92,246,0.06) 100%)',
          border: '1px solid rgba(0,255,136,0.2)',
          borderRadius: '16px', padding: 'clamp(2.5rem, 5vw, 4rem) 2rem',
          boxShadow: '0 0 60px rgba(0,255,136,0.05)',
        }}>
          <div style={{ color: '#00ff88', fontSize: '0.65rem', letterSpacing: '0.35em', marginBottom: '1rem' }}>BETA ACCESS — FREE</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800, marginBottom: '0.8rem', lineHeight: 1.2 }}>
            Join {waitlist} investors already<br />on the waitlist.
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
            Launching at bazaarbrain.in — PRO users get 3 months free, forever.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://forms.gle/bazaarbrain" style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #00ff88, #00b860)',
              color: '#000', padding: '0.9rem 2.5rem', borderRadius: '8px',
              textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem',
              boxShadow: '0 0 30px rgba(0,255,136,0.3)', transition: 'all 0.25s',
            }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; }}
            >
              Join Waitlist →
            </a>
            <a href="/app" style={{
              display: 'inline-block', color: '#00ff88', padding: '0.9rem 1.8rem',
              borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem',
              border: '1px solid rgba(0,255,136,0.3)', transition: 'all 0.25s',
            }}
              onMouseEnter={e => { e.target.style.background = 'rgba(0,255,136,0.08)'; }}
              onMouseLeave={e => { e.target.style.background = 'transparent'; }}
            >
              Try Live App
            </a>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['No credit card', 'Free Z3 engine', 'SEBI-aware framing'].map(tag => (
              <span key={tag} style={{ color: '#64748b', fontSize: '0.7rem' }}>✓ {tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position: 'relative', zIndex: 1, textAlign: 'center', padding: '2rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        color: '#64748b', fontSize: '0.7rem', lineHeight: 2,
      }}>
        <div style={{ marginBottom: '0.5rem', color: '#475569', fontSize: '0.65rem' }}>
          ⚠️ Investment in securities market are subject to market risks. Read all related documents carefully before investing. Bazaar Brain provides algorithmic risk analysis, not financial advice.
        </div>
        © 2026 Bazaar Brain · Built for ET GenAI Hackathon · Made with ❤️ for India's 14 crore retail investors
      </footer>

      <style>{`
        @keyframes hero-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
