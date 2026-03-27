/**
 * Z3Client.js — Frontend client for the real Z3 SMT Server
 * 
 * Calls the /z3-audit endpoint on the Bazaar Brain Node.js server
 * which runs the actual Microsoft Z3 WASM solver.
 */

const Z3_SERVER_URL = 'http://localhost:8080';

/**
 * Run a real Z3 audit against all sectors.
 * Returns the full result including SMTLIB2 proof strings and SAT/UNSAT for each sector.
 */
export async function runRealZ3Audit(sectors) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  console.log(`[Z3Client] Initiating Z3 audit on ${sectors.length} sectors...`);
  console.log(`[Z3Client] Server URL: ${Z3_SERVER_URL}/z3-audit`);

  try {
    const response = await fetch(`${Z3_SERVER_URL}/z3-audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectors: sectors.map(s => ({
          id: s.id,
          name: s.name,
          nifty: s.nifty,
          priceChangePct: s.priceChangePct ?? 0,
          volumeRatio: s.volumeRatio ?? 1,
          tension: s.tension ?? 0,
        }))
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error(`[Z3Client] Server error: ${response.status} ${response.statusText}`);
      throw new Error(`Z3 server responded ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[Z3Client] Audit successful. Solve time: ${result.totalSolveTimeMs}ms`);
    return result;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[Z3Client] Audit timed out after 20s');
      throw new Error('Z3 audit timed out after 20s');
    }
    console.error(`[Z3Client] Connection failed: ${err.message}`);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Check if the Z3 server is up and running.
 */
export async function checkZ3ServerStatus() {
  try {
    const res = await fetch(`${Z3_SERVER_URL}/z3-status`, { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    return { online: true, ...data };
  } catch {
    return { online: false };
  }
}
