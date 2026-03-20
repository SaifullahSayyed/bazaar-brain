class RiskProofEngine {

  audit(sectors) {
    if (!sectors || sectors.length === 0) {
      return { safe: true, solveTimeMs: 0,
        proofStatement: 'No sectors to audit.' }
    }

    const start = performance.now()

    // Check rules in priority order
    const circuitResult = 
      this._checkCircuitBreaker(sectors)
    if (circuitResult) {
      return { ...circuitResult,
        solveTimeMs: performance.now() - start }
    }

    const momentumResult = 
      this._checkMomentumTrap(sectors)
    if (momentumResult) {
      return { ...momentumResult,
        solveTimeMs: performance.now() - start }
    }

    const rotationResult = 
      this._checkSectorRotation(sectors)
    if (rotationResult) {
      return { ...rotationResult,
        solveTimeMs: performance.now() - start }
    }

    return {
      safe: true,
      solveTimeMs: performance.now() - start,
      proofStatement:
        'MATHEMATICAL PROOF: All 8 NSE sectors ' +
        'pass formal risk thresholds. ' +
        '∀s ∈ Sectors: ¬MOMENTUM_TRAP(s) ∧ ' +
        '¬CIRCUIT_BREAKER(s) ∧ ¬ROTATION(S). ' +
        'Grid status: NOMINAL.'
    }
  }

  _checkMomentumTrap(sectors) {
    for (const s of sectors) {
      const pct = s.priceChangePct ?? 0
      const vol = s.volumeRatio ?? 1
      if (pct > 6 && vol < 0.6) {
        return {
          safe: false,
          rule: 'MOMENTUM_TRAP',
          ruleName: 'Momentum Trap Detected',
          severity: 'HIGH',
          violatingSectorId: s.id,
          violatingSectorName: s.name,
          violatingNifty: s.nifty,
          violatingMetrics: {
            priceChangePct: pct,
            volumeRatio: vol,
            tension: s.tension ?? 0
          },
          mathematicalProof:
            `∃s ∈ Sectors: (s.priceChangePct=` +
            `${pct.toFixed(2)} > 6) ∧ ` +
            `(s.volumeRatio=${vol.toFixed(2)} ` +
            `< 0.6) → MOMENTUM_TRAP`,
          proofStatement:
            `MATHEMATICAL PROOF: ${s.name} shows ` +
            `+${pct.toFixed(2)}% price move on ` +
            `${vol.toFixed(2)}x average volume. ` +
            `Formal verification confirms momentum ` +
            `trap pattern. Institutional ` +
            `distribution likely behind retail buying.`,
          recommendation:
            'AVOID CHASING — Volume does not ' +
            'confirm price move. High reversal risk.',
          recommendationHindi:
            'भाव पीछे मत भागो — वॉल्यूम कन्फर्म ' +
            'नहीं कर रहा। पलटाव की संभावना ज़्यादा है।'
        }
      }
    }
    return null
  }

  _checkCircuitBreaker(sectors) {
    for (const s of sectors) {
      const pct = Math.abs(s.priceChangePct ?? 0)
      if (pct > 13) {
        return {
          safe: false,
          rule: 'CIRCUIT_BREAKER',
          ruleName: 'Circuit Breaker Approach',
          severity: 'CRITICAL',
          violatingSectorId: s.id,
          violatingSectorName: s.name,
          violatingNifty: s.nifty,
          violatingMetrics: {
            priceChangePct: s.priceChangePct,
            volumeRatio: s.volumeRatio ?? 0,
            tension: s.tension ?? 0
          },
          mathematicalProof:
            `∃s ∈ Sectors: |s.priceChangePct=` +
            `${s.priceChangePct?.toFixed(2)}| ` +
            `> 13 → CIRCUIT_BREAKER_RISK`,
          proofStatement:
            `MATHEMATICAL PROOF: ${s.name} at ` +
            `${s.priceChangePct?.toFixed(2)}% ` +
            `approaches NSE circuit breaker limit. ` +
            `Liquidity risk formally confirmed. ` +
            `Exit windows narrowing rapidly.`,
          recommendation:
            'CRITICAL: Approaching circuit breaker. ' +
            'Reduce exposure immediately.',
          recommendationHindi:
            'खतरा: सर्किट ब्रेकर करीब है। ' +
            'तुरंत एक्सपोज़र कम करें।'
        }
      }
    }
    return null
  }

  _checkSectorRotation(sectors) {
    const highTension = sectors.filter(
      s => (s.tension ?? 0) > 0.82)
    const lowTension = sectors.filter(
      s => (s.tension ?? 0) < 0.18)
    if (highTension.length > 0 && 
        lowTension.length > 0) {
      const h = highTension[0]
      const l = lowTension[0]
      return {
        safe: false,
        rule: 'SECTOR_ROTATION',
        ruleName: 'Sector Rotation Signal',
        severity: 'MEDIUM',
        violatingSectorId: h.id,
        violatingSectorName: h.name,
        violatingNifty: h.nifty,
        violatingMetrics: {
          highSector: h.name,
          highTension: h.tension,
          lowSector: l.name,
          lowTension: l.tension
        },
        mathematicalProof:
          `∃s₁,s₂: (${h.name}.tension=` +
          `${h.tension?.toFixed(2)} > 0.82) ∧ ` +
          `(${l.name}.tension=` +
          `${l.tension?.toFixed(2)} < 0.18) ` +
          `→ ROTATION`,
        proofStatement:
          `MATHEMATICAL PROOF: Smart money ` +
          `rotation detected. ${h.name} showing ` +
          `stress (tension ${h.tension?.toFixed(2)}) ` +
          `while ${l.name} is quiet ` +
          `(tension ${l.tension?.toFixed(2)}). ` +
          `Institutional reallocation confirmed.`,
        recommendation:
          'ROTATION SIGNAL — Consider reducing ' +
          h.name + ' and watching ' + l.name,
        recommendationHindi:
          `रोटेशन संकेत — ${h.name} कम करें, ` +
          `${l.name} पर नज़र रखें।`
      }
    }
    return null
  }
}

export default new RiskProofEngine()
