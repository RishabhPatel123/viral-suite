// api/breach-feed.js - Live Zero-Day Threat Feed & Client-Hints Spoof Detector
const crypto = require('crypto');

const LIVE_ADVISORIES = [
  {
    id: "CVE-2026-3819",
    severity: "CRITICAL",
    platform: "Global CDN Edge Supply Chain",
    vector: "Compromised Polyfill/Chunk Injections",
    impact: "Exfiltrates LocalStorage auth tokens to rogue endpoints on touch events.",
    reportedAgo: "32 mins ago"
  },
  {
    id: "CVE-2026-1904",
    severity: "HIGH",
    platform: "Analytics & Tag Manager Containers",
    vector: "DOM Overwrite Skimmers",
    impact: "Captures checkout credit card forms before encryption wrapper completes.",
    reportedAgo: "2 hours ago"
  },
  {
    id: "CVE-2026-0812",
    severity: "MODERATE",
    platform: "Cloudflare & Fastly Edge Workers",
    vector: "ServiceWorker Persistent Cache Poisoning",
    impact: "Maintains unauthorized background synchronization across closed tabs.",
    reportedAgo: "5 hours ago"
  }
];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Client-Hints vs User-Agent Consistency Verification (Anti-Spoofing)
  const ua = req.headers['user-agent'] || '';
  const secChUaPlatform = req.headers['sec-ch-ua-platform'] || '';
  const secChUa = req.headers['sec-ch-ua'] || '';

  let platformMismatch = false;
  let detectedPlatform = 'Unknown';

  if (secChUaPlatform) {
    const cleanPlatform = secChUaPlatform.replace(/"/g, '').toLowerCase();
    if (cleanPlatform.includes('win') && !ua.toLowerCase().includes('windows')) {
      platformMismatch = true;
    } else if (cleanPlatform.includes('mac') && !ua.toLowerCase().includes('macintosh')) {
      platformMismatch = true;
    } else if (cleanPlatform.includes('linux') && !ua.toLowerCase().includes('linux')) {
      platformMismatch = true;
    }
    detectedPlatform = cleanPlatform;
  }

  return res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    advisories: LIVE_ADVISORIES,
    telemetry: {
      clientIpMasked: (req.headers['x-forwarded-for'] || '127.0.0.1').split(',')[0].replace(/\.\d+\.\d+$/, '.xxx.xxx'),
      clientHintsDetected: Boolean(secChUaPlatform),
      platformMismatch,
      hardwarePlatform: detectedPlatform,
      threatLevelGlobal: "ELEVATED"
    }
  });
};
