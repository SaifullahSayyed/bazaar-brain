import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import SceneBackground from './3d/SceneBackground';
import MarketNerveCenter from './3d/MarketNerveCenter';
import SectorPopup from './SectorPopup';
import StockDetailPopup from './StockDetailPopup';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import useLiveGrid from '../hooks/useLiveGrid';
import ThinkingTrace from './ThinkingTrace';
import MambaBrain from '../logic/MambaBrain';
import { useMarketStore } from '../context/MarketStore';
import { useRiskAuditor } from '../hooks/useRiskAuditor';
import { generateMarketDirective, generateMarketBriefing, generateNearMissWarning, generateStockAnalysis } from '../logic/GeminiService';
import { runRealZ3Audit } from '../logic/Z3Client';
import AICommanderPanel from './AICommanderPanel';
import AIBriefingPanel from './AIBriefingPanel';
import SentinelEngine from '../logic/SentinelEngine';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const { sectors, marketMeta, serverMeta, connectionStatus, dataFreshness } = useLiveGrid();
  
  const setSectors = useMarketStore(state => state.setSectors);
  const setMarketMeta = useMarketStore(state => state.setMarketMeta);
  const setConnectionStatus = useMarketStore(state => state.setConnectionStatus);
  const setDataFreshness = useMarketStore(state => state.setDataFreshness);
  const incrementTick = useMarketStore(state => state.incrementTick);
  
  const systemStatus = useMarketStore(state => state.systemStatus);
  const setSystemStatus = useMarketStore(state => state.setSystemStatus);
  const aiStatus = useMarketStore(state => state.aiStatus);
  const setAiStatus = useMarketStore(state => state.setAiStatus);
  const pushSignalEvent = useMarketStore(state => state.pushSignalEvent);
  const acknowledgeSignal = useMarketStore(state => state.acknowledgeSignal);
  const setGeminiThinking = useMarketStore(state => state.setGeminiThinking);
  const geminiThinking = useMarketStore(state => state.geminiThinking);

  const { auditSectors } = useRiskAuditor();
  const auditResult = useMarketStore(state => state.auditResult);
  const solveTimeMs = auditResult?.solveTimeMs || 0;

  const [directive, setDirective] = useState('');
  const [showBriefing, setShowBriefing] = useState(false);
  const [aiBriefing, setAiBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [isGeneratingDirective, setIsGeneratingDirective] = useState(false);

  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedStockDetail, setSelectedStockDetail] = useState(null);
  const [stockAnalysis, setStockAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [sentinelAlerts, setSentinelAlerts] = useState([]);
  const handleSectorClick = (sector) => setSelectedSector(sector);

  const lastNearMissRef = useRef({});

  // Handlers required by App Demo and Buttons
  // useCallback ensures stable reference so useEffect event listeners don't re-register every render
  const handleAIBriefing = useCallback(async () => {
    setShowBriefing(true);
    setBriefingLoading(true);
    const start = performance.now();
    const liveSectors = useMarketStore.getState().sectors;
    const liveMeta = useMarketStore.getState().marketMeta;
    try {
      console.log('[Briefing] Calling Gemini with', liveSectors?.length, 'sectors, NIFTY:', liveMeta?.nifty50?.price);
      // generateMarketBriefing already has an internal offline fallback — no need to double-call
      const text = await generateMarketBriefing(liveSectors, liveMeta);
      const ms = Math.round(performance.now() - start);
      console.log('[Briefing] Gemini responded in', ms, 'ms');
      const source = text.startsWith('MARKET STATUS:') && !text.includes('Gemini') ? 'OFFLINE' : 'GEMINI';
      setAiBriefing({ text, generatedInMs: ms, source });
      pushSignalEvent({
        type: 'BRIEFING',
        text: text.slice(0, 80) + '...',
        time: new Date().toLocaleTimeString('en-IN', { hour12: false })
      });
    } catch (err) {
      // generateMarketBriefing should never throw (has internal catch), but handle defensively
      console.error('[Briefing] Unexpected error:', err.message);
      const fallbackText = `MARKET STATUS: NSE system active. NIFTY50 at ₹${liveMeta?.nifty50?.price?.toFixed(0) || 'N/A'}.`;
      setAiBriefing({ text: fallbackText, generatedInMs: Math.round(performance.now() - start), source: 'OFFLINE' });
    } finally {
      setBriefingLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushSignalEvent]);

  const handleAcknowledge = useCallback(() => {
    acknowledgeSignal();
    setDirective('');
    setSystemStatus('MONITORING');
    setAiStatus('STANDBY');
    pushSignalEvent({
      type: 'SAFE',
      text: 'Signal acknowledged. Resuming monitoring.',
      time: new Date().toLocaleTimeString('en-IN', { hour12: false })
    });
  }, [acknowledgeSignal, setSystemStatus, setAiStatus, pushSignalEvent]);

  useEffect(() => {
    const handler = () => handleAcknowledge();
    const briefingHandler = () => handleAIBriefing();
    const z3Handler = async (e) => {
      const sectorId = e.detail?.sectorId;
      if (sectorId) {
        handleStatus(sectorId);
      } else {
        // Fire the REAL Z3 SMT solver on the server
        pushSignalEvent({
          type: 'AUDIT',
          text: '⚙ Z3 WASM solver initializing — running SAT checks...',
          time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
        });

        try {
          const liveSectors = useMarketStore.getState().sectors;
          const z3Result = await runRealZ3Audit(liveSectors);

          // Map Z3 result back to the auditResult store format
          const violation = z3Result.results?.find(r => !r.safe);
          const finalResult = violation ? {
            safe: false,
            rule: violation.violatingRule,
            ruleName: violation.violatingRule,
            violatingSectorId: violation.sectorId,
            violatingSectorName: violation.sectorName,
            mathematicalProof: violation.smtlib2,
            proofStatement: z3Result.summarySmtlib2,
            solveTimeMs: z3Result.totalSolveTimeMs,
            violatingMetrics: violation.model || {},
            violatedAxioms: z3Result.violatedAxioms || [],
          } : {
            safe: true,
            mathematicalProof: z3Result.summarySmtlib2,
            solveTimeMs: z3Result.totalSolveTimeMs,
            violatedAxioms: z3Result.violatedAxioms || [],
          };

          // Update store
          useMarketStore.getState().setAuditResult(finalResult);

          // Push event for UI feedback in Sidebar trace
          pushSignalEvent({
            type: 'AUDIT',
            text: z3Result.safe
              ? z3Result.summarySmtlib2
              : `⚡ SAT — ${violation?.sectorName}: ${violation?.violatingRule}`,
            proof: violation ? violation.smtlib2 : z3Result.summarySmtlib2,
            time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
            solveTimeMs: z3Result.totalSolveTimeMs,
          });

        } catch (err) {
          console.warn('[Z3Client] Real Z3 unavailable, using local engine:', err.message);
          // Fallback to local rule engine (this now updates the store directly)
          const liveResult = auditSectors(useMarketStore.getState().sectors);
          
          pushSignalEvent({
            type: 'AUDIT',
            text: liveResult?.safe
              ? `∀s ∈ Sectors: ¬MOMENTUM_TRAP(s) ∧ ¬CIRCUIT_BREAKER(s) → STATUS=SAFE`
              : `${liveResult?.mathematicalProof || 'Rule violation detected'}`,
            proof: liveResult?.proofStatement,
            time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
            solveTimeMs: liveResult?.solveTimeMs,
          });
        }
      }
    };
    const stockDetailHandler = (e) => {
      setSelectedStockDetail(e.detail.stock);
      setSelectedSector(null); // Close sector popup when stock detail opens
      setStockAnalysis(null);
    };

    window.addEventListener('bazaar-acknowledge', handler);
    window.addEventListener('bazaar-trigger-briefing', briefingHandler);
    window.addEventListener('bazaar-trigger-z3-audit', z3Handler);
    window.addEventListener('bazaar-show-stock-detail', stockDetailHandler);
    return () => {
      window.removeEventListener('bazaar-acknowledge', handler);
      window.removeEventListener('bazaar-trigger-briefing', briefingHandler);
      window.removeEventListener('bazaar-trigger-z3-audit', z3Handler);
      window.removeEventListener('bazaar-show-stock-detail', stockDetailHandler);
    };
  }, [handleAcknowledge, handleAIBriefing, auditSectors, pushSignalEvent]);

  const handleStatus = (sectorId) => {
    const sector = sectors.find(s => s.id === sectorId);
    if (sector) {
      setSelectedSector(sector);
      pushSignalEvent({
        type: 'STATUS_CHECK',
        text: `Voice command: Checking ${sector.name}`,
        time: new Date().toLocaleTimeString('en-IN', { hour12: false })
      });
    }
  };

  const handleStockAIAnalysis = async (stock) => {
    setAnalysisLoading(true);
    try {
      const result = await generateStockAnalysis(stock, selectedStockDetail.sectorName || 'Main Sector');
      setStockAnalysis(result);
    } catch (err) {
      setStockAnalysis("AI Link Interrupted. Technical data still valid.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    // Sync useLiveGrid data to global Zustand store every time it updates (700ms)
    setSectors(sectors);
    setMarketMeta(marketMeta);
    setConnectionStatus(connectionStatus);
    if (setDataFreshness) setDataFreshness(dataFreshness);
    incrementTick();
    useMarketStore.setState({ 
      stateNorm: MambaBrain.getStateNorm(),
      syncAgeSeconds: marketMeta?.syncAgeSeconds || 0 
    });

    // Only run continuous audit if we are actively monitoring.
    // Otherwise, freeze the auditResult to preserve the violation state for the AI Commander UI.
    let result = undefined;
    if (systemStatus !== 'SIGNAL_DETECTED') {
      result = auditSectors(sectors);
    }

    if (result && !result.safe && systemStatus !== 'SIGNAL_DETECTED' && !isGeneratingDirective) {
      setSystemStatus('SIGNAL_DETECTED');
      setAiStatus('THINKING');
      setIsGeneratingDirective(true);
      const liveSectorsForDirective = useMarketStore.getState().sectors;
      generateMarketDirective(result, liveSectorsForDirective)
        .then(directiveResult => {
          // directiveResult is now { text, thinking, directive, hindi, confidence, signal, model }
          const text = directiveResult.text || directiveResult; // fallback: old shape was plain string
          setDirective(text);
          // Store real thinking chain for ThinkingTrace
          if (directiveResult.thinking) {
            setGeminiThinking(directiveResult.thinking);
          }
          setAiStatus('COMMANDING');
          setIsGeneratingDirective(false);
          pushSignalEvent({
            type: 'SIGNAL',
            text: text.split('HINDI:')[0].trim().slice(0, 120),
            sector: result.violatingSectorName,
            metrics: result.violatingMetrics,
            proof: result.mathematicalProof,
            time: new Date().toLocaleTimeString('en-IN', { hour12: false })
          });
        })
        .catch(() => {
          setIsGeneratingDirective(false);
        });
    }

    if (result?.safe && systemStatus !== 'SIGNAL_DETECTED') {
      const nearMiss = sectors.find(s => (s.tension ?? 0) > 0.82);
      if (nearMiss) {
        const lastT = lastNearMissRef.current[nearMiss.name] || 0;
        if (Date.now() - lastT > 20000) { // Throttle GM warning spam to every 20s per sector
          lastNearMissRef.current[nearMiss.name] = Date.now();
          generateNearMissWarning(nearMiss)
            .then(result => {
              const text = result?.text || result; // handle both string and object shape
              pushSignalEvent({
                type: 'NEAR_MISS',
                text: text.split('HINDI:')[0].trim().slice(0, 80),
                sector: nearMiss.name,
                time: new Date().toLocaleTimeString('en-IN', { hour12: false })
              });
            });
        }
      }
    }
    // Run Sentinel cross-sector contagion prediction on every tick
    if (sectors && sectors.length > 0) {
      const newAlerts = SentinelEngine.update(sectors);
      if (newAlerts.length > 0) {
        setSentinelAlerts(prev => [...newAlerts, ...prev].slice(0, 5));
      }
    }

  }, [sectors, marketMeta, connectionStatus, dataFreshness, setSectors, setMarketMeta, setConnectionStatus, setDataFreshness, incrementTick]);

  return (
    <>
      <SceneBackground sectors={sectors} systemStatus={systemStatus} />
      
      <div className="dashboard-container">
        <Header 
          connectionStatus={connectionStatus} 
          dataFreshness={dataFreshness} 
          onBriefingClick={handleAIBriefing}
          onStatus={handleStatus}
          onAcknowledge={handleAcknowledge}
        />

        {dataFreshness === 'MARKET_CLOSED' && (
          <div className="market-closed-banner">
            ● MARKET CLOSED — Showing last session data · NSE opens 9:15 AM IST
          </div>
        )}
        
        <div style={{
          gridArea: 'canvas',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          minHeight: '400px',
          borderRadius: '1rem',
          border: '1px solid var(--color-border)',
          margin: '0.5rem',
          background: 'rgba(6, 13, 26, 0.4)',
          backdropFilter: 'blur(8px)'
        }}>
          <MarketNerveCenter
            sectors={sectors}
            auditResult={auditResult}
            onSectorClick={handleSectorClick}
          />
        </div>

        <AnimatePresence>
          {selectedSector && (
            <SectorPopup
              sector={selectedSector}
              onClose={() => setSelectedSector(null)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedStockDetail && (
            <StockDetailPopup
              stock={selectedStockDetail}
              stockAnalysis={stockAnalysis}
              analysisLoading={analysisLoading}
              onClose={() => setSelectedStockDetail(null)}
              onAIAnalysis={handleStockAIAnalysis}
            />
          )}
        </AnimatePresence>
        
        <Sidebar sectors={sectors} sentinelAlerts={sentinelAlerts} />
        <Footer solveTimeMs={solveTimeMs} />

        <AnimatePresence>
          {showBriefing && (
            <AIBriefingPanel
              briefing={aiBriefing}
              isLoading={briefingLoading}
              onClose={() => {
                setShowBriefing(false)
                setAiBriefing(null)
              }}
            />
          )}
        </AnimatePresence>
          {/* Right Panel: Emergency Directive OR Z3 Backtest OR Z3 Proof */}
        <AnimatePresence>
          {systemStatus === 'SIGNAL_DETECTED' && aiStatus === 'THINKING' && (
            <ThinkingTrace isOpen={true} />
          )}
          
          {systemStatus === 'SIGNAL_DETECTED' && aiStatus !== 'THINKING' && (
            <>
              <AICommanderPanel
                auditResult={auditResult}
                directive={directive}
                onAcknowledge={handleAcknowledge}
              />
              {geminiThinking && (
                <ThinkingTrace 
                  isOpen={true} 
                  lines={geminiThinking.split('\n').filter(l => l.trim().length > 0)}
                  className="tt-post-generation"
                />
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
