// api/generate-receipt.js - Dynamic Satirical Receipt Item Generator & Cryptographic Verifier
const { signToken, verifyToken } = require('./_crypto');

const TOPIC_PRESETS = {
  crypto: [
    { desc: "Bought the Absolute Peak Top", qty: 3, cost: 4200.00 },
    { desc: "Discord Mod 'Trust Me Bro' Alpha", qty: 1, cost: 850.50 },
    { desc: "Cold Storage Ledger Hidden Under Mattress", qty: 1, cost: 179.00 },
    { desc: "Unrealized Gains Vanished at 3 AM", qty: 8, cost: 9800.00 }
  ],
  dev: [
    { desc: "Pushed Directly to Production Main Branch", qty: 2, cost: 1200.00 },
    { desc: "Docker Desktop Consuming 28GB RAM", qty: 1, cost: 450.00 },
    { desc: "Stared Blankly at CSS Flexbox Bug", qty: 47, cost: 2350.00 },
    { desc: "Over-engineered Monorepo for 1-Page App", qty: 1, cost: 3400.00 }
  ],
  dating: [
    { desc: "Pretended to Care About Horoscopes", qty: 4, cost: 140.00 },
    { desc: "Cocktails with Someone Who Looked Like Their 2019 Photo", qty: 6, cost: 210.00 },
    { desc: "Over-analyzed Read Receipt Timestamp Gap", qty: 18, cost: 540.00 },
    { desc: "Ghosted After 3-Hour Conversation About Pasta", qty: 1, cost: 95.00 }
  ],
  wfh: [
    { desc: "Polite Head Nodding While Muted & Asleep", qty: 14, cost: 700.00 },
    { desc: "Snack Expedition to Fridge Every 12 Minutes", qty: 89, cost: 185.00 },
    { desc: "Dress Shirt on Top / Boxer Shorts on Bottom", qty: 220, cost: 440.00 },
    { desc: "Slack Status Set to 'Focusing' (Playing Roguelike)", qty: 35, cost: 1225.00 }
  ]
};

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Receipt verification query: /api/generate-receipt?verify=TOKEN
  if (req.method === 'GET' && req.query && req.query.verify) {
    const verifiedData = verifyToken(req.query.verify);
    if (!verifiedData) {
      return res.status(404).json({ success: false, error: 'Invalid or counterfeit receipt token.' });
    }
    return res.status(200).json({ success: true, receipt: verifiedData });
  }

  if (req.method === 'POST') {
    try {
      const { topic, customHeadline, customItems } = req.body || {};
      const chosenTopic = (topic || 'dev').toLowerCase();

      let items = TOPIC_PRESETS[chosenTopic] || TOPIC_PRESETS.dev;

      // Allow user custom items injection if provided
      if (Array.isArray(customItems) && customItems.length > 0) {
        items = customItems.slice(0, 8).map(ci => ({
          desc: String(ci.desc || 'Custom Item').slice(0, 45),
          qty: Math.max(1, parseInt(ci.qty, 10) || 1),
          cost: Math.max(0, parseFloat(ci.cost) || 10.00)
        }));
      }

      const subtotal = items.reduce((sum, item) => sum + (item.qty * item.cost), 0);
      const existentialTax = subtotal * 0.18;
      const total = subtotal + existentialTax;

      const receiptId = `RCPT-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 8999 + 1000)}`;

      // Cryptographically signed receipt ledger token
      const verificationToken = signToken({
        receiptId,
        topic: chosenTopic,
        headline: customHeadline || `${chosenTopic.toUpperCase()} AUDIT REPORT`,
        subtotal: subtotal.toFixed(2),
        existentialTax: existentialTax.toFixed(2),
        total: total.toFixed(2),
        itemCount: items.length,
        issuedAt: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        receiptId,
        headline: customHeadline || `${chosenTopic.toUpperCase()} SURVIVAL LOG`,
        items,
        subtotal: subtotal.toFixed(2),
        existentialTax: existentialTax.toFixed(2),
        total: total.toFixed(2),
        verificationToken,
        verifyUrl: `/receipt.html?receiptToken=${verificationToken}`
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate receipt: ' + err.message
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method Not Allowed' });
};
