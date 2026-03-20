import { describe, it, expect, beforeEach } from 'vitest';
import MambaBrain from '../MambaBrain';

describe('MambaBrain LSSM Engine', () => {
  beforeEach(() => {
    MambaBrain.reset();
  });

  // Test 1
  it('tick() always returns exactly 8 elements', () => {
    const result = MambaBrain.tick();
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBe(8);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('tension');
  });

  // Test 2
  it('All metric values within valid ranges after 1000 ticks', () => {
    let lastResult = [];
    for (let i = 0; i < 1000; i++) {
      lastResult = MambaBrain.tick();
    }
    
    lastResult.forEach(sector => {
      // Since it's sin/cos with decay, tension should remain bounded
      expect(sector.tension).toBeGreaterThanOrEqual(-10);
      expect(sector.tension).toBeLessThanOrEqual(10);
      expect(sector.voltage).toBeGreaterThanOrEqual(0);
      expect(sector.waterLevel).toBeGreaterThanOrEqual(0);
    });
  });

  // Test 3
  it('injectSignal produces values above thresholds', () => {
    MambaBrain.injectSignal('S1', {
      tension: 0.99,
      signal: 'MOMENTUM TRAP'
    });
    const result = MambaBrain.tick();
    const s1 = result.find(s => s.id === 'S1');
    expect(s1.tension).toBe(0.99);
    expect(s1.signal).toBe('MOMENTUM TRAP');
    
    // Check auto-reset after 3 ticks
    MambaBrain.tick(); // tick 2
    MambaBrain.tick(); // tick 3
    const resultAfter = MambaBrain.tick(); // tick 4
    const s1After = resultAfter.find(s => s.id === 'S1');
    expect(s1After.signal).not.toBe('MOMENTUM TRAP');
  });

  // Test 4
  it('Deterministic: same sequence without live data', () => {
    // Run 5 ticks and record state norm
    for(let i=0; i<5; i++) MambaBrain.tick();
    const norm1 = MambaBrain.getStateNorm();
    
    // Reset and repeat
    MambaBrain.reset();
    for(let i=0; i<5; i++) MambaBrain.tick();
    const norm2 = MambaBrain.getStateNorm();
    
    expect(norm1).toBeCloseTo(norm2, 5);
    expect(MambaBrain.getStateVector()).toEqual(expect.any(Array));
  });

  // Test 5
  it('Live data override correctly sets u_t', () => {
    const liveData = new Array(8).fill({ tension: 0 });
    liveData[0] = { tension: 1.0 }; // Supply high tension to S1
    
    const result = MambaBrain.tick(liveData);
    // Since h_t = A * h_t-1 + B * u_t
    // For S1: A=0.91, B=0.18. h_t = 0.91*0 + 0.18*1.0 = 0.18
    const s1 = result.find(s => s.id === 'S1');
    expect(s1.tension).toBeCloseTo(0.18, 5);
  });
});
