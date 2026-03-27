class MambaBrain {
  constructor() {
    this.A = [0.91, 0.88, 0.93, 0.87, 0.90, 0.92, 0.86, 0.89];
    this.B = [0.18, 0.22, 0.15, 0.25, 0.20, 0.17, 0.28, 0.21];
    this.h_t = new Array(8).fill(0);
    this.tickCount = 0;
    this.injection = null; // { sectorId, overrides, ticksLeft }
    
    this.NSE_SECTORS = [
      { id:'S1', name:'Banking & Finance', nifty:'NIFTY BANK' },
      { id:'S2', name:'Information Technology', nifty:'NIFTY IT' },
      { id:'S3', name:'FMCG', nifty:'NIFTY FMCG' },
      { id:'S4', name:'Pharmaceuticals', nifty:'NIFTY PHARMA' },
      { id:'S5', name:'Energy', nifty:'NIFTY ENERGY' },
      { id:'S6', name:'Auto', nifty:'NIFTY AUTO' },
      { id:'S7', name:'Metals & Mining', nifty:'NIFTY METAL' },
      { id:'S8', name:'Real Estate', nifty:'NIFTY REALTY' }
    ];
  }

  reset() {
    this.h_t = new Array(8).fill(0);
    this.tickCount = 0;
    this.injection = null;
  }

  getStateNorm() {
    return Math.sqrt(this.h_t.reduce((sum, val) => sum + val * val, 0));
  }

  getStateVector() {
    return [...this.h_t];
  }

  injectSignal(sectorId, overrides) {
    this.injection = {
      sectorId,
      overrides,
      ticksLeft: 3
    };
  }

  tick(liveData = null) {
    this.tickCount++;
    const output = [];
    const u_t = new Array(8).fill(0);

    for (let i = 0; i < 8; i++) {
      if (liveData && liveData[i]) {
        u_t[i] = liveData[i].tension !== undefined ? liveData[i].tension : 0;
      } else {
        u_t[i] = 0.5 * Math.sin(this.tickCount * 0.1 + i * 0.7) + 
                 0.5 * Math.cos(this.tickCount * 0.07 + i);
      }

      this.h_t[i] = this.A[i] * this.h_t[i] + this.B[i] * u_t[i];

      let sectorData = {
        id: this.NSE_SECTORS[i].id,
        name: this.NSE_SECTORS[i].name,
        nifty: this.NSE_SECTORS[i].nifty,
        tension: this.h_t[i],
        voltage: 50 + (this.h_t[i] * 20),
        waterLevel: Math.abs(this.h_t[i]),
        temperature: 50000 + (this.h_t[i] * 1000),
        humidity: Math.abs(Math.sin(this.tickCount * 0.1 + i)),
        pressure: 1000 + (this.h_t[i] * 20),
        price: 25000 + (i * 1500) + (this.h_t[i] * 500),
        currentPrice: 25000 + (i * 1500) + (this.h_t[i] * 500),
        priceChangePct: this.h_t[i] * 2,
        signal: this.h_t[i] > 0.5 ? 'BULLISH' : this.h_t[i] < -0.5 ? 'BEARISH' : 'NEUTRAL'
      };

      if (liveData && liveData[i]) {
        sectorData = {
          ...sectorData,
          ...liveData[i],
          tension: this.h_t[i] // override tension with SSM hidden state
        };
      }

      if (this.injection && this.injection.sectorId === sectorData.id) {
        sectorData = {
          ...sectorData,
          ...this.injection.overrides
        };
      }

      output.push(sectorData);
    }

    if (this.injection) {
      this.injection.ticksLeft--;
      if (this.injection.ticksLeft <= 0) {
        this.injection = null;
      }
    }

    return output;
  }

  getMarketMeta() {
    const niftyBase = 24500;
    const sensexBase = 80500;
    const sin = Math.sin(this.tickCount * 0.05);
    
    return {
      nifty50: {
        price: niftyBase + (sin * 120),
        change: sin * 80,
        changePct: sin * 0.32
      },
      sensex: {
        price: sensexBase + (sin * 400),
        change: sin * 250,
        changePct: sin * 0.31
      },
      syncAgeSeconds: 0
    };
  }
}

export default new MambaBrain();
