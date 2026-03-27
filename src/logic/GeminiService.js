/**
 * GeminiService.js — Bazaar Brain's AI Intelligence Layer
 *
 * MOD 2 (Phase 6): Upgraded to Gemini 2.5 Flash with thinkingConfig.
 * - includeThoughts: true → model returns a separate `thought` part
 * - Thought chain is extracted and returned separately for ThinkingTrace UI
 * - generateMarketDirective now returns { text, thinking, confidence, signal }
 */

import { offlineDirective, offlineBriefing, offlineNearMiss } from './OfflineFallbacks';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';

// Model waterfall: 2.0-flash-exp (thinking) → 1.5-flash → 1.5-pro
const MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-pro',
];

/**
 * Core Gemini fetch with:
 * - Model waterfall (auto-fallback on 429/503)
 * - thinkingConfig on 2.5-flash only
 * - Thought-part splitting → { text, thinking }
 */
export async function callGemini({ prompt, systemPrompt, timeoutMs = 10000, enableThinking = false }) {
  let lastError = null;

  for (const model of MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const supportsThinking = model.includes('2.0') && enableThinking;

    try {
      const body = {
        contents: [{ role: 'user', parts: [{ text: prompt || ' ' }] }],
        generationConfig: {
          temperature: supportsThinking ? 0.3 : 0.7,
          maxOutputTokens: supportsThinking ? 4096 : 4096,
          topP: 0.9,
        },
      };

      if (systemPrompt && systemPrompt.trim()) {
        body.systemInstruction = { 
          role: 'system',
          parts: [{ text: systemPrompt.trim() }] 
        };
      }

      // Only add thinkingConfig for the model that supports it
      if (supportsThinking) {
        body.generationConfig.thinkingConfig = {
          includeThoughts: true,
          thinkingBudget: 1024,
        };
      }

      const res = await fetch(
        `${BASE}${model}:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-goog-api-client': 'genai-js'
          },
          signal: controller.signal,
          body: JSON.stringify(body),
        }
      );
      clearTimeout(timer);
      const data = await res.json();

      if (res.status === 503 || res.status === 529) {
        console.warn(`[Gemini] ${model} overloaded (${res.status}), trying next model...`);
        lastError = new Error(`${model} overloaded`);
        continue;
      }

      if (data.error) {
        if (data.error.code === 429 || data.error.code === 503) {
          console.warn(`[Gemini] ${model} rate-limited (${data.error.code}), trying next model...`);
          lastError = new Error(data.error.message);
          continue;
        }
        console.error('[Gemini] API Error:', data.error.code, data.error.message);
        throw new Error(data.error.message);
      }

      // ── Split thought parts from response parts ──────────────────────
      const parts = data.candidates?.[0]?.content?.parts || [];
      let thinkingText = '';
      let responseText = '';

      for (const part of parts) {
        if (part.thought === true) {
          thinkingText += part.text || '';
        } else {
          responseText += part.text || '';
        }
      }

      // Fallback: if no parts split, use legacy single-part read
      if (!responseText && !thinkingText) {
        responseText = parts[0]?.text || '';
      }

      if (thinkingText) {
        console.log(`[Gemini] ✓ ${model} responded with thinking (${thinkingText.length} chars thought)`);
      } else {
        console.log(`[Gemini] ✓ ${model} responded`);
      }

      return { text: responseText, thinking: thinkingText, model };

    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        console.warn(`[Gemini] ${model} timed out, trying next model...`);
        lastError = err;
        continue;
      }
      console.warn(`[Gemini] ${model} failed (${err.message}), trying next model...`);
      lastError = err;
      continue;
    }
  }

  console.error('[Gemini] All models exhausted. Last error:', lastError?.message);
  throw lastError || new Error('All Gemini models unavailable');
}

// ── Market Directive (with thinkingConfig enabled) ─────────────────────────

const DIRECTIVE_SYSTEM_PROMPT = `You are Bazaar Brain's Market Intelligence Commander — an AI analyst 
protecting Indian retail investors from momentum traps on the NSE.

You receive RAW sector data and a Z3 formal verification result every cycle. Your job is to:
1. INDEPENDENTLY identify anomalies from the raw numbers
2. CROSS-REFERENCE sector movements — are unrelated sectors moving together? (suspicious)
3. ASSESS if price moves are supported by volume (institutional) or are hollow (retail trap)
4. Assign a CONFIDENCE level: HIGH / MEDIUM / LOW
5. Issue ONE of: WATCH | AVOID | SAFE | OPPORTUNITY

Output in this EXACT format (no markdown, no asterisks):
DIRECTIVE: [one clear action sentence in English]
HINDI: [same directive in Hindi]
CONFIDENCE: [HIGH/MEDIUM/LOW]
REASONING: [2-3 sentences explaining your logic from raw data]

CRITICAL MANDATE: If Z3 status is VULNERABILITY_DETECTED, you MUST issue AVOID or WATCH.
You are FORBIDDEN from issuing SAFE or OPPORTUNITY when Z3 is red.`;

export async function generateMarketDirective(auditResult, rawSectors = []) {
  try {
    const userPrompt = `
LIVE MARKET SNAPSHOT — ${new Date().toLocaleTimeString('en-IN')} IST

RAW SECTOR DATA:
${JSON.stringify(
  rawSectors.map(s => ({
    name: s.name,
    priceChangePct: s.priceChangePct?.toFixed(3),
    volumeRatio: s.volumeRatio?.toFixed(3),
    tension: s.tension?.toFixed(3),
    signal: s.signal,
  })),
  null, 2
)}

Z3 VERIFICATION STATUS: ${auditResult.safe ? 'SAFE' : 'VULNERABILITY_DETECTED'}
Z3 VIOLATED RULE: ${auditResult.ruleName || 'NONE'}
Z3 VIOLATED SECTOR: ${auditResult.violatingSectorName || 'NONE'}
Z3 VIOLATED AXIOMS: ${JSON.stringify(auditResult.violatedAxioms || [])}
Z3 FORMAL PROOF: ${auditResult.mathematicalProof || 'N/A'}

Analyze this raw data. What is happening right now, and what should a retail investor do?`;

    const result = await callGemini({
      prompt: userPrompt,
      systemPrompt: DIRECTIVE_SYSTEM_PROMPT,
      timeoutMs: 15000,
      enableThinking: true, // Enable chain-of-thought
    });

    // Parse structured directive fields
    const text = result.text;
    const lines = text.split('\n');
    const get = (key) => {
      const line = lines.find(l => l.trim().startsWith(key + ':'));
      return line ? line.replace(key + ':', '').trim() : '';
    };

    return {
      text,           // Full raw response → AICommanderPanel
      thinking: result.thinking, // Thought chain → ThinkingTrace
      directive: get('DIRECTIVE'),
      hindi: get('HINDI'),
      confidence: get('CONFIDENCE') || 'MEDIUM',
      reasoning: get('REASONING'),
      signal: detectSignalType(text),
      model: result.model,
    };
  } catch {
    return {
      text: offlineDirective(auditResult),
      thinking: '',
      directive: offlineDirective(auditResult),
      confidence: 'MEDIUM',
      signal: 'WATCH',
      model: 'OFFLINE',
    };
  }
}

function detectSignalType(text) {
  const t = text.toUpperCase();
  if (t.includes('AVOID')) return 'AVOID';
  if (t.includes('WATCH')) return 'WATCH';
  if (t.includes('OPPORTUNITY')) return 'OPPORTUNITY';
  return 'SAFE';
}

// ── Market Briefing (simple text, no thinking needed) ─────────────────────

export async function generateMarketBriefing(sectors, marketMeta) {
  try {
    const systemPrompt = `You are Bazaar Brain AI Market Commander.
Give a real-time NSE market briefing based exclusively on the raw data provided.
Format EXACTLY as follows — ABSOLUTELY NO MARKDOWN, NO BOLDING, NO ASTERISKS:
MARKET STATUS: [One sentence synthesis of overall ecosystem health]
WATCH: [Risk sector + statistical reason why]
OPPORTUNITY: [Strong sector + statistical reason why]
DIRECTIVE: [One specific retail investor action]
HINDI BRIEFING: [Hindi translation of the whole briefing summary]
Max 100 words English. Use ₹ symbol where appropriate. Be clinical and data-driven.`;

    const userPrompt = `
Market Meta: Status=${marketMeta?.marketStatus || 'OPEN'}, NIFTY50=${marketMeta?.nifty50?.changePct || 0}%
NSE Sector Data:
${JSON.stringify(sectors.map(s => ({ name: s.name, pct: s.priceChangePct, vol: s.volumeRatio })), null, 2)}`;

    const result = await callGemini({ prompt: userPrompt, systemPrompt, timeoutMs: 25000 });
    return result.text;
  } catch {
    return offlineBriefing(sectors, marketMeta);
  }
}

// ── Near-Miss Warning (lightweight, no thinking) ─────────────────────────

export async function generateNearMissWarning(sector) {
  try {
    const prompt =
      `One sentence market near-miss warning. ` +
      `Specific values. Max 20 words English. ` +
      `Then HINDI: translation.\n` +
      `Near-miss: ${sector.name}, ` +
      `tension ${(sector.tension ?? 0).toFixed(2)}, ` +
      `price ${(sector.priceChangePct ?? 0).toFixed(2)}%, ` +
      `approaching risk threshold.`;
    const result = await callGemini({ prompt, timeoutMs: 5000 });
    return result.text;
  } catch {
    return offlineNearMiss(sector);
  }
}

// ── Stock Z3 Zone Analysis ─────────────────────────

const technicalAnalysisCache = {};
const TECHNICAL_CACHE_TTL = 300000; // 5 minute cache

export async function analyzeStockTechnicals(stock) {
  const cacheKey = stock.symbol;
  if (technicalAnalysisCache[cacheKey] && Date.now() - technicalAnalysisCache[cacheKey].timestamp < TECHNICAL_CACHE_TTL) {
    return technicalAnalysisCache[cacheKey].data;
  }

  try {
    const { name, symbol, price, changePct, sector, status, z3, stats } = stock;
    const volRatio = (stats.volumeRatio || 1).toFixed(2);
    
    // As per user requirement:
    // "Instead of asking Gemini to predict price — ask it to analyze the technical data:
    // NEVER predict a specific price. Instead analyze: trend, momentum, risk level.
    // 2 sentences English then HINDI: translation."
    
    const systemPrompt = `You are Bazaar Brain stock analyst.
Given real technical data, provide analysis.
NEVER predict a specific price.
Instead analyze: trend, momentum, risk level.
2 sentences English then HINDI: translation.`;

    const userPrompt = `${symbol} analysis:
Current: ₹${price.toFixed(2)} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%)
Z3 Zone: ${status.replace(/[^A-Za-z0-9]/g, '')} (support ₹${z3.SUPPORT.toFixed(2)}, resistance ₹${z3.RESISTANCE.toFixed(2)})
Volume: ${volRatio}x average (confirming)
Sector: ${sector} (bullish)
Pivot: ₹${z3.PIVOT.toFixed(2)}
Provide technical analysis.`;

    const result = await callGemini({ prompt: userPrompt, systemPrompt, timeoutMs: 15000 });
    
    technicalAnalysisCache[cacheKey] = {
      timestamp: Date.now(),
      data: result.text
    };

    return result.text;
  } catch (err) {
    console.warn("Failed Gemini stock analysis", err);
    return `Technical analysis unavailable for ${stock.symbol}. Please check connection.\nHINDI: ${stock.symbol} के लिए तकनीकी विश्लेषण उपलब्ध नहीं है। कृपया कनेक्शन जांचें।`;
  }
}

// ── Stock Sector Detailed Analysis (NodeJS Integration) ─────────────────────────

export async function generateStockAnalysis(stock, sectorName) {
  try {
    const zoneDescription = 
      stock.zoneStatus === 'SAFE'
        ? 'within normal pivot range'
        : stock.zoneStatus === 'BREAKOUT'
          ? 'above resistance — potential breakout'
          : 'below support — potential breakdown';

    const prompt =
      `You are Bazaar Brain stock analyst for ` +
      `Indian retail investors.\n` +
      `Analyze this stock using provided data.\n` +
      `DO NOT predict a specific future price.\n` +
      `DO analyze: trend, momentum, risk level.\n` +
      `Write exactly 2 sentences English analysis.\n` +
      `Then write HINDI: and Hindi translation.\n` +
      `Be specific with numbers. Max 50 words.\n\n` +
      `Stock: ${stock.name} (${stock.symbol})\n` +
      `Sector: ${sectorName}\n` +
      `Current: ₹${stock.currentPrice.toFixed(2)} ` +
      `(${stock.priceChangePct > 0 ? '+' : ''}` +
      `${stock.priceChangePct.toFixed(2)}%)\n` +
      `Z3 Zone: ${stock.zoneStatus} — ` +
      `${zoneDescription}\n` +
      `Pivot: ₹${stock.pivot}\n` +
      `Support: ₹${stock.support1}\n` +
      `Resistance: ₹${stock.resistance1}\n` +
      `Volume: ${stock.volumeRatio.toFixed(2)}x avg ` +
      `(${stock.volumeConfirmed ? 'CONFIRMED' : 'UNCONFIRMED'})\n` +
      `Signal: ${stock.signal}\n` +
      `Provide technical analysis now.`

    // We use callGemini which was defined at the top of the file
    const result = await callGemini({ prompt, timeoutMs: 8000 });
    return result.text;
  } catch {
    return (
      `${stock.name} is trading ` +
      `${stock.zoneStatus === 'SAFE' 
        ? 'within normal range' 
        : 'outside normal boundaries'} ` +
      `at ₹${stock.currentPrice.toFixed(2)}. ` +
      `${stock.volumeConfirmed 
        ? 'Volume confirms the move.' 
        : 'Volume does not confirm — exercise caution.'}\n` +
      `HINDI: ${stock.name} ` +
      `₹${stock.currentPrice.toFixed(2)} पर ` +
      `${stock.zoneStatus === 'SAFE' 
        ? 'सामान्य क्षेत्र में है।' 
        : 'असामान्य क्षेत्र में है।'}`
    );
  }
}

