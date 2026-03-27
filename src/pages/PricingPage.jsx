import React, { useState } from 'react';

const PLANS = [
  {
    id: 'free',
    name: 'FREE TIER',
    monthlyPrice: 0,
    color: '#64748b',
    highlight: false,
    features: [
      { text: '3 sector alerts / day', included: true },
      { text: 'Daily AI briefing', included: true },
      { text: 'Hindi voice (basic)', included: true },
      { text: '15-min delayed data', included: true },
      { text: 'Z3 proof summaries', included: true },
      { text: 'Real-time briefings', included: false },
      { text: 'Portfolio tracking', included: false },
      { text: 'WhatsApp signals', included: false },
      { text: 'REST API access', included: false },
    ],
    cta: 'Start Free',
    ctaLink: '/app',
  },
  {
    id: 'pro',
    name: 'PRO INVESTOR',
    monthlyPrice: 499,
    yearlyPrice: 399,
    color: '#00ff88',
    highlight: true,
    badge: 'MOST POPULAR',
    features: [
      { text: 'Unlimited sector alerts', included: true },
      { text: 'Real-time AI briefings', included: true },
      { text: 'Full Hindi voice commander', included: true },
      { text: 'Live NSE data', included: true },
      { text: 'Full Z3 proof traces', included: true },
      { text: 'Real-time briefings', included: true },
      { text: 'Portfolio tracking (90d)', included: true },
      { text: 'WhatsApp signals', included: true },
      { text: 'REST API access', included: false },
    ],
    cta: 'Join Beta Waitlist',
    ctaLink: 'https://forms.gle/bazaarbrain',
  },
  {
    id: 'institutional',
    name: 'INSTITUTIONAL',
    monthlyPrice: 4999,
    yearlyPrice: 3999,
    color: '#8b5cf6',
    highlight: false,
    features: [
      { text: 'All 50 NSE sectors', included: true },
      { text: 'Angel One / Bloomberg feed', included: true },
      { text: 'Custom Z3 rule engine', included: true },
      { text: 'Live NSE data', included: true },
      { text: 'Full Z3 proof traces', included: true },
      { text: 'Real-time briefings', included: true },
      { text: 'Multi-user dashboard', included: true },
      { text: 'Compliance reporting', included: true },
      { text: 'REST API access', included: true },
    ],
    cta: 'Contact Us',
    ctaLink: 'mailto:hello@bazaarbrain.in',
  },
];

const FAQ = [
  {
    q: 'What is the Z3 proof engine?',
    a: 'Z3 is a formal SMT (Satisfiability Modulo Theories) solver from Microsoft Research. We use it to run mathematical logic checks on sector data — so every Bazaar Brain alert is backed by a formal proof, not a guess.',
  },
  {
    q: 'Is the data real NSE data?',
    a: 'Yes. We pull live sector prices and volume from Yahoo Finance / our simulation layer as a fallback. Swap the data adapter for Angel One or NSE WebSocket to go fully live.',
  },
  {
    q: 'Is Bazaar Brain SEBI-compliant?',
    a: 'Bazaar Brain provides algorithmic risk analysis and market intelligence, not financial advice. All outputs include the mandated SEBI disclaimer. Users are encouraged to verify before investing.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. No lock-in, no minimum term. Cancel from your account settings in one click — your data is exported automatically.',
  },
  {
    q: 'What does the annual discount include?',
    a: 'Annual billing gives you 2 months free on PRO (₹399/mo vs ₹499/mo) and saves ₹12,000/yr on Institutional. Plus early access to all new features.',
  },
];

function PlanCard({ plan, isYearly }) {
  const [hovered, setHovered] = useState(false);
  const price = isYearly && plan.yearlyPrice ? plan.yearlyPrice : plan.monthlyPrice;
  const savings = plan.yearlyPrice ? plan.monthlyPrice - plan.yearlyPrice : 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: '1 1 280px',
        maxWidth: '340px',
        background: plan.highlight
          ? 'linear-gradient(160deg, rgba(0,255,136,0.07) 0%, rgba(0,40,25,0.6) 100%)'
          : 'rgba(255,255,255,0.025)',
        border: `1px solid ${hovered || plan.highlight ? plan.color : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '14px',
        padding: '2rem',
        position: 'relative',
        transform: hovered ? 'translateY(-6px)' : plan.highlight ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
        boxShadow: plan.highlight
          ? `0 0 50px ${plan.color}18, 0 8px 40px rgba(0,0,0,0.4)`
          : hovered ? `0 8px 30px rgba(0,0,0,0.3)` : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {plan.badge && (
        <div style={{
          position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)',
          background: plan.color, color: '#000', fontSize: '0.58rem',
          fontWeight: 800, padding: '0.3rem 1rem', borderRadius: '20px',
          letterSpacing: '0.12em', whiteSpace: 'nowrap',
          boxShadow: `0 0 20px ${plan.color}60`,
        }}>
          {plan.badge}
        </div>
      )}

      <div style={{ color: plan.color, fontSize: '0.6rem', letterSpacing: '0.25em', marginBottom: '1rem' }}>{plan.name}</div>

      <div style={{ marginBottom: '0.3rem', display: 'flex', alignItems: 'flex-end', gap: '0.3rem' }}>
        <span style={{ fontSize: '2.6rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
          ₹{price.toLocaleString('en-IN')}
        </span>
        <span style={{ color: '#94a3b8', fontSize: '0.8rem', paddingBottom: '0.4rem' }}>/mo</span>
      </div>

      {isYearly && savings > 0 && (
        <div style={{ fontSize: '0.65rem', color: plan.color, marginBottom: '1rem', letterSpacing: '0.05em' }}>
          ↓ Save ₹{(savings * 12).toLocaleString('en-IN')} per year
        </div>
      )}
      {(!isYearly || !savings) && <div style={{ marginBottom: '1rem' }} />}

      <div style={{ height: 1, background: `${plan.color}20`, marginBottom: '1.5rem' }} />

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1 }}>
        {plan.features.map(f => (
          <li key={f.text} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: f.included ? '#94a3b8' : '#475569' }}>
            <span style={{ color: f.included ? plan.color : '#475569', flexShrink: 0, fontSize: '0.75rem' }}>
              {f.included ? '✓' : '–'}
            </span>
            {f.text}
          </li>
        ))}
      </ul>

      <a
        href={plan.ctaLink}
        style={{
          display: 'block', textAlign: 'center', padding: '0.85rem',
          background: plan.highlight ? plan.color : 'transparent',
          color: plan.highlight ? '#000' : plan.color,
          border: `1px solid ${plan.color}`,
          borderRadius: '8px', textDecoration: 'none',
          fontWeight: 800, fontSize: '0.82rem',
          letterSpacing: '0.05em',
          transition: 'all 0.2s',
          boxShadow: plan.highlight ? `0 0 20px ${plan.color}30` : 'none',
        }}
        onMouseEnter={e => {
          if (!plan.highlight) {
            e.target.style.background = `${plan.color}12`;
          } else {
            e.target.style.opacity = '0.88';
          }
        }}
        onMouseLeave={e => {
          e.target.style.background = plan.highlight ? plan.color : 'transparent';
          e.target.style.opacity = '1';
        }}
      >
        {plan.cta}
      </a>
    </div>
  );
}

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '10px',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
      borderColor: open ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.06)',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.2rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer',
          color: '#e2e8f0', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem',
          textAlign: 'left',
        }}
      >
        <span>{item.q}</span>
        <span style={{ color: '#00ff88', fontSize: '1.1rem', transition: 'transform 0.25s', transform: open ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '0 1.5rem 1.2rem', color: '#64748b', fontSize: '0.82rem', lineHeight: 1.75, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ paddingTop: '1rem' }}>{item.a}</div>
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000614',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      color: '#fff',
      overflowX: 'hidden',
    }}>
      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20%', right: '-15%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,136,0.03) 0%, transparent 65%)' }} />
      </div>

      {/* Nav */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(0,6,20,0.9)', backdropFilter: 'blur(16px)',
      }}>
        <a href="/" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="18" height="18" viewBox="0 0 100 100" style={{ fill: 'none', stroke: '#00ff88', strokeWidth: 8 }}>
            <polygon points="50 3 93 25 93 75 50 97 7 75 7 25" />
          </svg>
          BAZAAR BRAIN
        </a>
        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem' }}
            onMouseEnter={e => e.target.style.color = '#e2e8f0'}
            onMouseLeave={e => e.target.style.color = '#64748b'}
          >Home</a>
          <a href="/app" style={{
            background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
            color: '#000', padding: '0.5rem 1.4rem', borderRadius: '6px',
            textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem',
          }}>Launch App →</a>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: 'clamp(3rem, 8vw, 5rem) 2rem 3rem' }}>
        <div style={{ color: '#00ff88', fontSize: '0.65rem', letterSpacing: '0.35em', marginBottom: '1rem' }}>TRANSPARENT PRICING</div>
        <h1 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, lineHeight: 1.15,
          marginBottom: '1rem', letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Start Free.<br />Scale When Ready.
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
          The Z3 proof engine is free forever. We monetize the scale — not the math.
        </p>

        {/* Annual / Monthly Toggle */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '30px', padding: '0.4rem 0.8rem' }}>
          <span style={{ fontSize: '0.78rem', color: isYearly ? '#64748b' : '#e2e8f0', transition: 'color 0.2s' }}>Monthly</span>
          <button onClick={() => setIsYearly(y => !y)} style={{
            width: 42, height: 22, borderRadius: '11px', border: 'none', cursor: 'pointer',
            background: isYearly ? '#00ff88' : 'rgba(255,255,255,0.15)',
            position: 'relative', transition: 'background 0.25s',
          }}>
            <div style={{
              position: 'absolute', top: 3, left: isYearly ? 22 : 3,
              width: 16, height: 16, borderRadius: '50%', background: '#fff',
              transition: 'left 0.25s',
              boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }} />
          </button>
          <span style={{ fontSize: '0.78rem', color: isYearly ? '#00ff88' : '#64748b', transition: 'color 0.2s' }}>
            Annual <span style={{ fontSize: '0.65rem', background: 'rgba(0,255,136,0.15)', color: '#00ff88', padding: '0.1rem 0.4rem', borderRadius: '8px', marginLeft: '0.2rem' }}>2 months free</span>
          </span>
        </div>
      </div>

      {/* Plans */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap', padding: '0 2rem 5rem', maxWidth: '1100px', margin: '0 auto', alignItems: 'flex-start' }}>
        {PLANS.map(plan => <PlanCard key={plan.id} plan={plan} isYearly={isYearly} />)}
      </div>

      {/* Feature comparison note */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 2rem 3rem', color: '#64748b', fontSize: '0.7rem', lineHeight: 1.8 }}>
        All plans include the Z3 mathematical proof engine and SEBI-compliant risk framing.<br />
        Prices are in INR. Annual billing charged upfront. Switch plans anytime.
      </div>

      {/* FAQ */}
      <section style={{ position: 'relative', zIndex: 1, maxWidth: '720px', margin: '0 auto', padding: '0 2rem 6rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ color: '#8b5cf6', fontSize: '0.65rem', letterSpacing: '0.35em', marginBottom: '0.8rem' }}>COMMON QUESTIONS</div>
          <h2 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 800, margin: 0 }}>Frequently Asked</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {FAQ.map(item => <FAQItem key={item.q} item={item} />)}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', zIndex: 1, padding: '0 2rem 6rem' }}>
        <div style={{
          maxWidth: '580px', margin: '0 auto', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(0,255,136,0.05), rgba(139,92,246,0.05))',
          border: '1px solid rgba(0,255,136,0.15)', borderRadius: '14px',
          padding: '3rem 2rem',
        }}>
          <h2 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 800, marginBottom: '0.8rem' }}>Still deciding? Start free.</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '2rem', lineHeight: 1.7 }}>No credit card needed. Upgrade when you're ready. The Z3 proof engine is yours forever.</p>
          <a href="/app" style={{
            display: 'inline-block', background: 'linear-gradient(135deg, #00ff88, #00b860)',
            color: '#000', padding: '0.9rem 2.5rem', borderRadius: '8px',
            textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem',
            boxShadow: '0 0 25px rgba(0,255,136,0.25)',
          }}>
            Launch App Free →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        textAlign: 'center', padding: '2rem',
        color: '#64748b', fontSize: '0.68rem', lineHeight: 2,
      }}>
        <div style={{ marginBottom: '0.5rem', color: '#475569', fontSize: '0.62rem' }}>
          ⚠️ Investment in securities market are subject to market risks. Read all related documents carefully before investing. Bazaar Brain provides algorithmic risk analysis, not financial advice.
        </div>
        © 2026 Bazaar Brain · Built for ET GenAI Hackathon · Made with ❤️ for India's retail investors
      </footer>
    </div>
  );
}
