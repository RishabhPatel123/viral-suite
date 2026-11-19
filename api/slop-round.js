// api/slop-round.js - Edge endpoint for blind challenge generation
const crypto = require('crypto');
const { signToken } = require('./_crypto');

// Dynamic pool of forensic categories with variable sentence templates and authentic vs synthetic archetypes
const DYNAMIC_SPECIMENS = [
  // 1. Synthetic E-Commerce Review
  {
    category: "Verified E-Commerce Review",
    sourceLabel: "Noise-Cancelling Headphones (Amazon Verified Purchase)",
    isAiSlop: true,
    specimen: "In the bustling tapestry of modern acoustic technology, these sound transducers stand as a paramount testament to sonic fidelity. Boasting ergonomic contouring and state-of-the-art noise neutralization, they seamlessly integrate into one's auditory repertoire. It is not merely an audio peripheral, but an indispensable sonic voyage.",
    highlights: ["bustling tapestry", "paramount testament", "one's auditory repertoire", "indispensable sonic voyage"],
    explanation: "Hallmark ChatGPT register: 'tapestry', 'testament', elevated pseudo-academic rhetoric for consumer earbuds, and zero mention of real-world friction (e.g. sweaty earcups or battery lifespan)."
  },
  // 2. Real Human E-Commerce Review
  {
    category: "Verified E-Commerce Review",
    sourceLabel: "Noise-Cancelling Headphones (Amazon Verified Purchase)",
    isAiSlop: false,
    specimen: "ANC is solid on the subway but the left cup started clicking when I turn my head after week 2. Ear pads get sweaty during summer commutes. Good sound for $80, though charging cable is stupidly short.",
    highlights: ["started clicking when I turn my head", "sweaty during summer commutes", "stupidly short"],
    explanation: "Authentic human texture: granular ergonomic flaws, specific dollar benchmark, colloquial frustration ('stupidly short'), and sensory discomfort."
  },
  // 3. Synthetic Sick Day Note
  {
    category: "Corporate Slack / Sick Day",
    sourceLabel: "#team-engineering Slack DM to Manager",
    isAiSlop: true,
    specimen: "Good morning Sarah, I hope this message finds you well and amidst a productive week. Regrettably, I am writing to formally communicate that I have succumbed to an unexpected physiological indisposition characterized by elevated pyrexia. I aim to resume my sprint obligations expeditiously.",
    highlights: ["hope this message finds you well", "physiological indisposition", "elevated pyrexia", "expeditiously"],
    explanation: "Unnatural sycophancy: 'hope this finds you well' in a Slack DM, Victorian medical terminology ('pyrexia') instead of 'fever', and robotic corporate framing for simple bed rest."
  },
  // 4. Real Human Sick Day Note
  {
    category: "Corporate Slack / Sick Day",
    sourceLabel: "#team-engineering Slack DM to Manager",
    isAiSlop: false,
    specimen: "hey sarah, woke up with a brutal migraine and throwing up since 4am. won't make standup today. pushed my draft PR to staging-auth branch if dave needs to review. gonna crash now.",
    highlights: ["brutal migraine", "won't make standup", "staging-auth branch if dave needs", "gonna crash now"],
    explanation: "Natural asynchronous workplace cadence: lower-case casual greeting, visceral personal symptoms, immediate unblocking of teammates with branch name, and abrupt exit."
  },
  // 5. Synthetic Dating Profile
  {
    category: "Dating Profile Bio",
    sourceLabel: "Hinge Prompt: 'Together we could...'",
    isAiSlop: true,
    specimen: "Embark on an enchanting odyssey of mutual intellectual curiosity, savoring artisanal pour-overs while unraveling the philosophical nuances of existence and fostering vibrant emotional resonance.",
    highlights: ["enchanting odyssey", "mutual intellectual curiosity", "philosophical nuances of existence", "vibrant emotional resonance"],
    explanation: "Classic high-entropy LLM courtship hallucination: polysyllabic abstractions with zero tangible hobbies, locations, self-deprecation, or human vulnerability."
  },
  // 6. Real Human Dating Profile
  {
    category: "Dating Profile Bio",
    sourceLabel: "Hinge Prompt: 'Together we could...'",
    isAiSlop: false,
    specimen: "argue for 45 mins in Trader Joe's over which frozen dumplings to buy, burn them anyway because we got distracted playing Mario Kart, and then eat cereal at 1am on the living room rug.",
    highlights: ["Trader Joe's", "burn them anyway", "distracted playing Mario Kart", "living room rug"],
    explanation: "Concrete situational specificity: specific grocery chain, relatable clumsy failure, spontaneous indoor setting, and zero polished corporate syntax."
  },
  // 7. Synthetic Tech Changelog
  {
    category: "Open Source Changelog",
    sourceLabel: "GitHub Release Notes v2.4.0",
    isAiSlop: true,
    specimen: "We are thrilled to herald the dawn of v2.4.0, encapsulating an exquisite symphony of holistic optimizations and seamless architectural paradigms designed to empower your developer workflows with unprecedented synergy.",
    highlights: ["herald the dawn", "exquisite symphony", "holistic optimizations", "unprecedented synergy"],
    explanation: "Silicon Valley corporate vaporware generated by prompt: grandiose buzzwords ('symphony', 'synergy') devoid of actual git commits, benchmark numbers, or bug IDs."
  },
  // 8. Real Human Tech Changelog
  {
    category: "Open Source Changelog",
    sourceLabel: "GitHub Release Notes v2.4.0",
    isAiSlop: false,
    specimen: "Fixes memory leak in worker thread pool when payload exceeds 16MB (#1482). Replaced Lodash cloneDeep with structuredClone for ~35% faster serialization. Thanks @kaboro for debugging the race condition in Safari.",
    highlights: ["worker thread pool when payload exceeds 16MB", "structuredClone for ~35% faster", "Thanks @kaboro"],
    explanation: "Real engineering precision: exact issue reference (#1482), quantitative benchmark (+35%), specific API call replacement, and community attribution."
  },
  // 9. Synthetic Viral Tech Opinion
  {
    category: "Viral Social Commentary",
    sourceLabel: "X (Twitter) Thread Opener",
    isAiSlop: true,
    specimen: "The intersection of Artificial General Intelligence and decentralized ledger frameworks is not merely an evolutionary pivot—it is the paramount renaissance of human cognition itself. Let that sink in. 🧵👇",
    highlights: ["intersection of Artificial General Intelligence", "paramount renaissance", "human cognition itself", "Let that sink in"],
    explanation: "AI slop archetype: inflated philosophical grandeur, cliché 'Let that sink in', and robotic thread-hook formatting."
  },
  // 10. Real Human Viral Tech Opinion
  {
    category: "Viral Social Commentary",
    sourceLabel: "X (Twitter) Thread Opener",
    isAiSlop: false,
    specimen: "every single enterprise 'AI transformation' meeting I've attended this quarter is just 8 senior VPs nodding at a slide deck of Python wrappers around GPT-4 while their actual billing database runs on Postgres 9.4 on a box under Dave's desk",
    highlights: ["just 8 senior VPs nodding", "Python wrappers around GPT-4", "Postgres 9.4 on a box under Dave's desk"],
    explanation: "Ground-truth comedic cynicism: acute organizational observation, obsolete database version callout, and vivid tactile imagery ('box under Dave's desk')."
  },
  // 11. Synthetic Customer Support Response
  {
    category: "Customer Support Resolution",
    sourceLabel: "SaaS Billing Ticket #88412",
    isAiSlop: true,
    specimen: "Dear Valued Customer, We empathize profoundly with the inconvenience you have encountered regarding the duplicate invoice transaction. Please rest assured that our dedicated technical division is diligently orchestrating an equitable resolution.",
    highlights: ["empathize profoundly", "Valued Customer", "dedicated technical division", "diligently orchestrating"],
    explanation: "Over-calibrated AI neutrality: passive voice avoidance of liability, hollow emotional declarations ('empathize profoundly'), and zero actionable ETA."
  },
  // 12. Real Human Customer Support Response
  {
    category: "Customer Support Resolution",
    sourceLabel: "SaaS Billing Ticket #88412",
    isAiSlop: false,
    specimen: "Hey Marco, sorry about that! Stripe had a webhook retry hiccup on our webhook server yesterday morning which triggered the double charge. I just refunded transaction #ch_9381k2—should show up on your Chase statement in 2-3 business days.",
    highlights: ["Stripe had a webhook retry hiccup", "just refunded transaction #ch_9381k2", "Chase statement in 2-3 business days"],
    explanation: "Authentic support agent: names the specific backend vendor root cause (Stripe webhook retry), provides the raw transaction hash, and names the user's banking institution."
  }
];

// Procedural modifier to generate dynamic variations so repeat rounds feel freshly drafted
function generateDynamicSpecimen(baseItem) {
  const variations = [
    (text) => text,
    (text) => text.replace("Sarah", "Priya").replace("Dave", "Alex").replace("Marco", "Devon"),
    (text) => text.replace("$80", "$75").replace("16MB", "32MB").replace("Postgres 9.4", "MySQL 5.6"),
    (text) => text.replace("Amazon Verified Purchase", "Target Online Purchase").replace("Hinge Prompt", "Bumble Prompt")
  ];
  const randMod = variations[Math.floor(Math.random() * variations.length)];
  const specimenText = randMod(baseItem.specimen);
  const wordCount = specimenText.trim().split(/\s+/).length;

  return {
    ...baseItem,
    specimen: specimenText,
    wordCount
  };
}

module.exports = (req, res) => {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Pick random base item from dynamic library
    const randomIndex = Math.floor(Math.random() * DYNAMIC_SPECIMENS.length);
    const selected = generateDynamicSpecimen(DYNAMIC_SPECIMENS[randomIndex]);
    const roundId = crypto.randomUUID();
    const issuedAt = Date.now();

    // Cryptographic Blind Commitment Token
    // Embeds the secret ground truth + timestamp inside HMAC-SHA256
    const sessionToken = signToken({
      roundId,
      isAiSlop: selected.isAiSlop,
      category: selected.category,
      explanation: selected.explanation,
      highlights: selected.highlights,
      issuedAt
    });

    // Send blind payload to client (NO answer, NO highlights, NO hints)
    return res.status(200).json({
      success: true,
      roundId,
      sessionToken,
      category: selected.category,
      sourceLabel: selected.sourceLabel,
      specimen: selected.specimen,
      wordCount: selected.wordCount,
      issuedAt
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Failed to generate dynamic round payload: " + err.message
    });
  }
};
