import { create } from 'zustand';

export const useMarketStore = create((set, get) => ({
  sectors: [],
  auditResult: null,
  systemStatus: 'MONITORING',
  signalHistory: [],
  tickCount: 0,
  solveTimeMs: 0,
  stateNorm: 0,
  lastSignalTime: null,
  aiStatus: 'STANDBY',
  aiCurrentDirective: null,
  aiBriefingOpen: false,
  connectionStatus: 'OFFLINE',
  marketMeta: null,
  dataFreshness: 'STALE',
  syncAgeSeconds: 0,

  setSectors: (sectors) => set({ sectors }),
  setAuditResult: (result) => set({ auditResult: result }),
  setSystemStatus: (status) => set({ systemStatus: status }),
  setAiStatus: (status) => set({ aiStatus: status }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setMarketMeta: (meta) => set({ marketMeta: meta }),
  incrementTick: () => set(state => ({ tickCount: state.tickCount + 1 })),
  acknowledgeSignal: () => set({
    systemStatus: 'MONITORING',
    auditResult: null,
    aiStatus: 'STANDBY',
    aiCurrentDirective: null
  }),
  pushSignalEvent: (event) => set(state => ({
    signalHistory: [event, ...state.signalHistory].slice(0, 15),
    lastSignalTime: new Date().toLocaleTimeString('en-IN', { hour12: false })
  }))
}));
