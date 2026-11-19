// api/entropy-eval.js - Hardware Entropy Calculation & Timezone Proxy/VPN Discrepancy Probe
const { signToken } = require('./_crypto');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { canvasHash, audioHash, webglRenderer, clientTimezone, screenRes, coreCount } = req.body || {};

    // Calculate simulated information entropy based on hash complexity and rare hardware strings
    let totalBits = 14.2; // Baseline User-Agent entropy

    if (canvasHash && canvasHash !== 'N/A') totalBits += 8.6;
    if (audioHash && audioHash !== 'N/A') totalBits += 5.4;
    if (webglRenderer && webglRenderer.includes('NVIDIA') || (webglRenderer && webglRenderer.includes('Apple M'))) {
      totalBits += 4.8;
    } else if (webglRenderer) {
      totalBits += 3.2;
    }
    if (screenRes && screenRes !== '1920x1080') totalBits += 3.5;

    // Population rarity: 1 in 2^(totalBits)
    const uniquenessRatio = Math.round(Math.pow(2, Math.min(totalBits, 33)));
    const uniquenessPercentage = ((1 / uniquenessRatio) * 100).toFixed(6);

    // IP vs Client Timezone discrepancy probe
    const geoCountry = req.headers['x-vercel-ip-country'] || req.headers['cf-ipcountry'] || null;
    const geoTimezone = req.headers['x-vercel-ip-timezone'] || null;

    let vpnOrProxySuspected = false;
    let anomalyNote = "Timezone aligns with network origin.";

    if (geoTimezone && clientTimezone && geoTimezone !== clientTimezone) {
      vpnOrProxySuspected = true;
      anomalyNote = `Network timezone (${geoTimezone}) differs from system hardware clock (${clientTimezone}). Active VPN/Proxy or anti-tracking shield detected.`;
    }

    // Cryptographic audit proof token for sharing
    const auditProofToken = signToken({
      auditId: `XRAY-${Date.now().toString(36).toUpperCase()}`,
      canvasHash: canvasHash || 'none',
      audioHash: audioHash || 'none',
      uniquenessRatio,
      timestamp: Date.now()
    });

    return res.status(200).json({
      success: true,
      entropyScoreBits: totalBits.toFixed(2),
      uniquenessRatio: `1 in ${uniquenessRatio.toLocaleString()}`,
      uniquenessPercentage: `${uniquenessPercentage}%`,
      vpnOrProxySuspected,
      anomalyNote,
      geoOrigin: geoCountry || 'Local Sandbox',
      auditProofToken
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Entropy evaluation error: ' + err.message
    });
  }
};
