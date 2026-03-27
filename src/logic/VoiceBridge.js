import { callGemini } from './GeminiService';

class VoiceBridge {
  constructor() {
    const SR = window.SpeechRecognition ||
                window.webkitSpeechRecognition;
    if (!SR) {
      this.supported = false;
      return;
    }
    this.supported = true;
    this.recognition = new SR();
    this.recognition.lang = 'hi-IN';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.isListening = false;
  }

  startListening(onInterim, onFinal, onError) {
    if (!this.supported) {
      onError?.('Speech recognition not supported in this browser. Use Chrome.');
      return;
    }
    if (this.isListening) return;
    this.isListening = true;

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      if (result.isFinal) {
        this.isListening = false;
        onFinal?.({ transcript, confidence });
      } else {
        onInterim?.({ transcript });
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      onError?.(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.start();
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

export const extractIntent = async (transcript) => {
  console.log('🎤 VOICE EXTRACTING FROM:', transcript);
  const prompt = 
    `Analyze this Hindi market query: "${transcript}"\n` +
    `Map to ONE action: BRIEFING, STATUS, ACKNOWLEDGE, UNKNOWN.\n` +
    `Target: sector name (e.g. Banking, IT, Auto, Pharma, Energy, Metal, FMCG, Realty) or 'market'.\n` +
    `Format: ACTION|TARGET|CONFIDENCE|TRANSLATION\n` +
    `Confidence: 0.0 to 1.0\n` +
    `Translation: English version of query.\n` +
    `NO OTHER TEXT.`;

  try {
    const response = await callGemini(prompt, 15000);
    console.log('🤖 GEMINI VOICE REPLY:', response);
    
    // Extra robust cleaning: strip markdown code blocks and find the line with pipes
    const lines = response.replace(/```[a-z]*|```/gi, '').split('\n')
      .map(l => l.replace(/\*/g, '').trim())
      .filter(l => l.length > 0 && !l.includes('ACTION|TARGET')); // ignore header
      
    // Find the first line that looks like a valid response (contains at least two pipes)
    let validLine = lines.find(l => l.split('|').length >= 3);
    
    // If not found, just take the last valid looking line as fallback
    if (!validLine && lines.length > 0) {
      validLine = lines[lines.length - 1];
    }

    const parts = (validLine || '').split('|').map(s => s.trim());
    
    if (parts.length < 3) {
      console.warn('⚠️ Voice parse failed format. Expected 3+ pipes. Got:', response);
      // Failsafe: Bypass Gemini entirely and scan the user's raw microphone text
      const rawTranscript = transcript.toLowerCase();
      const targets = ['banking', 'it', 'auto', 'pharma', 'energy', 'metal', 'fmcg', 'realty'];
      const foundTarget = targets.find(t => rawTranscript.includes(t));
      
      if (foundTarget) {
        return { action: 'STATUS', target: foundTarget, sectorId: 'S' + (targets.indexOf(foundTarget) + 1), confidence: 1.0, translatedText: transcript };
      }
      
      if (rawTranscript.includes('briefing') || rawTranscript.includes('market')) {
        return { action: 'BRIEFING', target: 'market', confidence: 1.0, translatedText: transcript };
      }
      
      return { action: 'UNKNOWN', target: 'UNKNOWN', confidence: 0, translatedText: transcript };
    }

    const [action, target, conf, trans] = parts;
    
    // Map friendly names to IDs
    const sectorMap = {
      'banking': 'S1', 'it': 'S2', 'fmcg': 'S3', 'pharma': 'S4',
      'energy': 'S5', 'auto': 'S6', 'metal': 'S7', 'realty': 'S8'
    };
    const sectorId = sectorMap[target.toLowerCase()] || null;

    return {
      action: action || 'UNKNOWN',
      target: target || 'UNKNOWN',
      sectorId: sectorId,
      confidence: parseFloat(conf) || 0,
      translatedText: trans || transcript
    };
  } catch (error) {
    console.error('❌ Voice extraction error:', error);
    const msg = error.message || 'Error';
    return { action: 'UNKNOWN', target: 'UNKNOWN', sectorId: null, confidence: 0, translatedText: msg };
  }
};

export default new VoiceBridge();
