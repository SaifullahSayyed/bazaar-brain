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
  educationMode: false,

  // MOD 2 (Phase 6): Gemini thinking chain → fed to ThinkingTrace
  geminiThinking: '',
  setGeminiThinking: (thinking) => set({ geminiThinking: thinking }),

  toggleEducationMode: () => set(state => ({ educationMode: !state.educationMode })),

  // MOD 5 (Phase 6): User Portfolio — sector ID → holding info
  userPortfolio: {
    'S2': { name: 'NIFTY IT', invested: 50000 },
    'S1': { name: 'NIFTY BANK', invested: 145000 },
  },
  setUserPortfolio: (portfolio) => set({ userPortfolio: portfolio }),

  setSectors: (sectors) => set({ sectors }),
  setAuditResult: (result) => set({ auditResult: result }),
  setSystemStatus: (status) => set({ systemStatus: status }),
  setAiStatus: (status) => set({ aiStatus: status }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setMarketMeta: (meta) => set({ marketMeta: meta }),
  setDataFreshness: (freshness) => set({ dataFreshness: freshness }),
  incrementTick: () => set(state => ({ tickCount: state.tickCount + 1 })),
  acknowledgeSignal: () => set({
    systemStatus: 'MONITORING',
    auditResult: null,
    aiStatus: 'STANDBY',
    aiCurrentDirective: null,
    geminiThinking: '',
  }),
  pushSignalEvent: (event) => set(state => ({
    signalHistory: [event, ...state.signalHistory].slice(0, 15),
    lastSignalTime: new Date().toLocaleTimeString('en-IN', { hour12: false }),
  })),
}));
