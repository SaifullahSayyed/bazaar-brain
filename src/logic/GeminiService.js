const API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const ENDPOINT = 
  'https://generativelanguage.googleapis.com/' +
  'v1beta/models/gemini-1.5-flash:generateContent'

async function callGemini(prompt, timeoutMs=8000) {
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(), timeoutMs)
  try {
    const res = await fetch(
      `${ENDPOINT}?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 350,
            topP: 0.9
          }
        })
      }
    )
    clearTimeout(timer)
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } catch (err) {
    clearTimeout(timer)
    throw err
  }
}

export async function generateMarketDirective(auditResult) {
  try {
    const prompt = 
      `You are Bazaar Brain, India's AI Market ` +
      `Commander. Issue a formal market directive.\n` +
      `Write exactly 2 sentences:\n` +
      `1. Threat with sector name and exact values\n` +
      `2. Clear action for retail investor\n` +
      `Maximum 40 words English.\n` +
      `Then write HINDI: and Hindi translation.\n` +
      `No markdown. Plain text only.\n\n` +
      `PROOF: ${auditResult.ruleName}\n` +
      `Sector: ${auditResult.violatingSectorName} ` +
      `(${auditResult.violatingNifty})\n` +
      `Metrics: ${JSON.stringify(auditResult.violatingMetrics)}\n` +
      `Math: ${auditResult.mathematicalProof}\n` +
      `Issue directive now.`
    return await callGemini(prompt, 8000)
  } catch {
    return (
      `Risk signal in ` +
      `${auditResult.violatingSectorName}. ` +
      `Mathematical proof confirms ` +
      `${auditResult.ruleName}. Exercise caution.\n` +
      `HINDI: ${auditResult.violatingSectorName} ` +
      `में जोखिम संकेत। सावधानी बरतें।`
    )
  }
}

export async function generateMarketBriefing(sectors, marketMeta) {
  try {
    const sectorSummary = (sectors || [])
      .map(s => 
        `${s.name}: ` +
        `${s.priceChangePct > 0 ? '+' : ''}` +
        `${(s.priceChangePct ?? 0).toFixed(2)}%, ` +
        `Vol:${(s.volumeRatio ?? 0).toFixed(2)}x, ` +
        `Tension:${(s.tension ?? 0).toFixed(2)}`
      ).join('\n')

    const prompt =
      `You are Bazaar Brain AI Market Commander.\n` +
      `Give real-time NSE market briefing.\n` +
      `Format EXACTLY — no other text:\n` +
      `MARKET STATUS: [one sentence]\n` +
      `WATCH: [risk sector + reason]\n` +
      `OPPORTUNITY: [strong sector + why]\n` +
      `DIRECTIVE: [one investor action]\n` +
      `HINDI BRIEFING: [Hindi translation]\n` +
      `Max 90 words English. Use ₹ symbol.\n\n` +
      `Sectors:\n${sectorSummary}\n` +
      `NIFTY50: ` +
      `${marketMeta?.nifty50?.changePct ?? 0}%\n` +
      `Status: ` +
      `${marketMeta?.marketStatus ?? 'OPEN'}`
    return await callGemini(prompt, 10000)
  } catch {
    return (
      `MARKET STATUS: NSE markets showing ` +
      `positive momentum across sectors.\n` +
      `WATCH: Monitor high tension sectors closely.\n` +
      `OPPORTUNITY: Sectors with strong volume.\n` +
      `DIRECTIVE: Review portfolio allocation.\n` +
      `HINDI BRIEFING: बाज़ार में सकारात्मक ` +
      `संकेत हैं। सावधानी से निवेश करें।`
    )
  }
}

export async function generateNearMissWarning(sector) {
  try {
    const prompt =
      `One sentence market near-miss warning. ` +
      `Specific values. Max 20 words English. ` +
      `Then HINDI: translation.\n` +
      `Near-miss: ${sector.name}, ` +
      `tension ${(sector.tension??0).toFixed(2)}, ` +
      `price ${(sector.priceChangePct??0).toFixed(2)}%, ` +
      `approaching risk threshold.`
    return await callGemini(prompt, 5000)
  } catch {
    return (
      `${sector.name} approaching risk threshold. ` +
      `Monitor closely.\n` +
      `HINDI: ${sector.name} जोखिम सीमा के करीब। ` +
      `ध्यान रखें।`
    )
  }
}
