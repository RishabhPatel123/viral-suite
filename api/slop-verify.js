// api/slop-verify.js - Edge verification endpoint enforcing Anti-Cheat & Speed Verification
const { verifyToken } = require('./_crypto');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { sessionToken, guess, clientElapsedMs } = req.body || {};

    if (!sessionToken || typeof guess !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionToken (string) and guess (boolean)'
      });
    }

    // Decrypt and cryptographically verify session token HMAC
    const payload = verifyToken(sessionToken);
    if (!payload) {
      return res.status(403).json({
        success: false,
        verified: false,
        antiCheatAlert: 'TAMPER_DETECTED',
        error: 'Cryptographic token signature is invalid or modified.'
      });
    }

    const now = Date.now();
    const serverElapsedMs = now - payload.issuedAt;

    // Token expiration check (e.g., maximum 3 minutes per round)
    if (serverElapsedMs > 180000) {
      return res.status(410).json({
        success: false,
        verified: false,
        antiCheatAlert: 'TOKEN_EXPIRED',
        error: 'Round session token has expired (> 3 minutes).'
      });
    }

    // Speed-Hack & Macro Invalidation Shield:
    // Human cognitive saccade reading speed + motor latency cannot physically resolve in under 450ms.
    let speedBonusValid = true;
    let antiCheatFlag = null;

    if (serverElapsedMs < 450) {
      speedBonusValid = false;
      antiCheatFlag = 'UNNATURAL_REFLEX_VELOCITY';
    }

    const isCorrect = guess === payload.isAiSlop;

    // Server-computed anti-tamper scoring
    let baseScore = isCorrect ? 100 : 0;
    let speedBonus = 0;

    if (isCorrect && speedBonusValid) {
      // 10,000ms countdown: fast answers get up to 100 bonus points
      const remainingTime = Math.max(0, 10000 - serverElapsedMs);
      speedBonus = Math.floor(remainingTime / 100);
    }

    const totalRoundScore = baseScore + speedBonus;

    // Return the verified verdict and forensic breakdown drawer contents
    return res.status(200).json({
      success: true,
      verified: true,
      roundId: payload.roundId,
      isAiSlop: payload.isAiSlop,
      userGuess: guess,
      correct: isCorrect,
      baseScore,
      speedBonus,
      totalRoundScore,
      serverElapsedMs,
      antiCheatFlag,
      explanation: payload.explanation,
      highlights: payload.highlights
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Internal verification failure: ' + err.message
    });
  }
};
