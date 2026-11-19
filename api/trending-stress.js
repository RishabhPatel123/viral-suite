// api/trending-stress.js - Dynamic Trending Stress Targets & Global Obliteration Counter

// In-memory global tally (persists across warm serverless execution cycles)
let globalStressObliterated = 1428904;

const TRENDING_TARGETS = [
  { id: 'zoom', name: 'Mandatory 8 AM Zoom Sync', category: 'Corporate Drag', hp: 120, color: '#38bdf8' },
  { id: 'merge', name: 'Merge Conflict in 42 Files', category: 'Dev Pain', hp: 200, color: '#ef4444' },
  { id: 'jira', name: 'High-Priority Friday Ticket', category: 'Sprint Chaos', hp: 160, color: '#f59e0b' },
  { id: 'inmail', name: 'Cold "Quick 15-min Chat" Pitch', category: 'Inbox Spam', hp: 100, color: '#a855f7' },
  { id: 'cookie', name: 'Modal Cookie Consent Walls', category: 'Web Agony', hp: 140, color: '#10b981' },
  { id: 'battery', name: 'Low Battery at 1% in Airport', category: 'Panic State', hp: 180, color: '#f43f5e' }
];

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { hits } = req.body || {};
    const parsedHits = Math.min(Math.max(1, parseInt(hits, 10) || 1), 500); // capped rate
    globalStressObliterated += parsedHits;

    return res.status(200).json({
      success: true,
      globalStressObliterated,
      added: parsedHits
    });
  }

  // GET: return trending targets and active global counter
  return res.status(200).json({
    success: true,
    globalStressObliterated,
    trendingTargets: TRENDING_TARGETS,
    activeSmashersWorldwide: 384 + Math.floor(Math.sin(Date.now() / 60000) * 45)
  });
};
