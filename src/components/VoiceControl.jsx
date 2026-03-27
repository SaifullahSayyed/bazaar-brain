import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceBridge, { extractIntent } from '../logic/VoiceBridge';

const VoiceControl = ({ onBriefing, onStatus, onAcknowledge }) => {
  const [state, setState] = useState('IDLE'); // IDLE, LISTENING, PROCESSING, RESULT, UNSUPPORTED
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!VoiceBridge.supported) {
      setState('UNSUPPORTED');
    }
  }, []);

  const handleStart = () => {
    if (state !== 'IDLE') return;

    setError(null);
    setState('LISTENING');

    VoiceBridge.startListening(
      (interim) => {
        // Optional: show interim transcript
      },
      async (final) => {
        setState('PROCESSING');
        try {
          const intent = await extractIntent(final.transcript);
          setResult(intent);
          setState('RESULT');

          // Execute actions based on intent
          if (intent.action === 'BRIEFING') {
            onBriefing?.();
          } else if (intent.action === 'STATUS') {
            onStatus?.(intent.sectorId);
          } else if (intent.action === 'ACKNOWLEDGE') {
            onAcknowledge?.();
          }

          // Return to IDLE after 2.5s
          setTimeout(() => {
            setState('IDLE');
            setResult(null);
          }, 2500);
        } catch (err) {
          setError('Failed to parse intent');
          setState('IDLE');
        }
      },
      (err) => {
        setError(err);
        setState('IDLE');
      }
    );
  };

  const handleStop = () => {
    if (state === 'LISTENING') {
      VoiceBridge.stopListening();
      setState('IDLE');
    }
  };

  const renderMic = () => {
    const isListening = state === 'LISTENING';
    const isProcessing = state === 'PROCESSING';

    return (
      <div className="voice-mic-container" style={{ position: 'relative', cursor: 'pointer' }} onClick={isListening ? handleStop : handleStart}>
        {/* Pulsing rings for LISTENING */}
        <AnimatePresence>
          {isListening && [0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="voice-ring"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 2.8, opacity: 0 }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut"
              }}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid var(--color-bull)',
                pointerEvents: 'none'
              }}
            />
          ))}
        </AnimatePresence>

        {/* Rotating ring for PROCESSING */}
        {isProcessing && (
          <motion.div
            className="voice-process-ring"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: 'var(--color-neutral)',
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Mic Icon */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          style={{
            fontSize: '1.8rem',
            color: isListening ? 'var(--color-bear)' : 
                   isProcessing ? 'var(--color-neutral)' : 
                   state === 'UNSUPPORTED' ? 'var(--color-text-muted)' : 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: state === 'IDLE' ? 'none' : 'drop-shadow(0 0 8px currentColor)'
          }}
          title={state === 'UNSUPPORTED' ? 'Use Chrome for voice support' : 'बोलिए — Speak in Hindi'}
        >
          {state === 'UNSUPPORTED' ? '🎙️' : '🎙️'} 
          {/* Note: In a real project we'd use an SVG icon, but we'll use emoji/styled div for now as requested */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </motion.div>

        {/* Status Text */}
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          marginTop: '0.5rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem'
        }}>
          {isListening && <span style={{ color: 'var(--color-bear)' }}>सुन रहा हूं...</span>}
          {isProcessing && <span style={{ color: 'var(--color-neutral)' }}>AI सोच रहा है...</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="voice-control-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      {renderMic()}
      
      <AnimatePresence>
        {state === 'RESULT' && result && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem'
            }}
          >
            <div style={{
              background: 'rgba(0,255,136,0.15)',
              border: '1px solid var(--color-bull)',
              borderRadius: '0.3rem',
              padding: '0.2rem 0.5rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: result.confidence > 0.7 ? 'var(--color-bull)' : 'var(--color-warning)'
            }}>
              {result.action} → {result.target}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: 'var(--color-text-muted)'
            }}>
              "{result.translatedText}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(VoiceControl);
