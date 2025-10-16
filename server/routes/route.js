const express = require('express');
const router = express.Router();

require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Introducing model + authentication middleware
const Route = require('../models/Route');                 // 你的 Mongoose 模型
const requireAuth = require('../middleware/requireAuth'); // 你的 JWT 中间件（把用户放到 req.user）

/** Tool: Extract JSON from jumbled text */
function extractJson(text) {
  if (!text) return null;
  let m = text.match(/\[[\s\S]*\]/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

/** Back-up: Modify/complete 5 routes and force the start and end points to be designated */
function validateAndFixRoutes(inputRoutes, start, end) {
  const safeText = (s) => (typeof s === 'string' ? s : String(s || ''));
  const routes = Array.isArray(inputRoutes) ? inputRoutes : [];

  let clean = routes
    .map((r, i) => {
      const opt = typeof r?.option === 'number' ? r.option : i + 1;
      const stops = Array.isArray(r?.stops) ? r.stops : [];
      return { option: opt, stops };
    })
    .filter(r => r.stops.length >= 1);

  clean = clean.map((r, idx) => {
    const stops = r.stops.map(s => ({
      time: safeText(s.time || ''),
      place: safeText(s.place || ''),
      description: safeText(s.description || '')
    }));
    if (stops.length === 0) {
      stops.push(
        { time: '09:00 AM', place: safeText(start), description: 'Start point' },
        { time: '06:00 PM', place: safeText(end), description: 'Destination' },
      );
    }
    if (stops[0].place.trim() !== start.trim()) {
      stops.unshift({ time: '09:00 AM', place: safeText(start), description: 'Start point' });
    } else {
      stops[0].place = safeText(start);
    }
    if (stops[stops.length - 1].place.trim() !== end.trim()) {
      stops.push({ time: '06:00 PM', place: safeText(end), description: 'Destination' });
    } else {
      stops[stops.length - 1].place = safeText(end);
    }
    const mid = stops.slice(1, -1).filter(s => {
      const p = s.place.trim();
      return p !== start.trim() && p !== end.trim();
    });
    return { option: idx + 1, stops: [stops[0], ...mid, stops[stops.length - 1]] };
  });

  while (clean.length < 5) {
    const base = clean[clean.length - 1] || {
      option: clean.length + 1,
      stops: [
        { time: '09:00 AM', place: safeText(start), description: 'Start point' },
        { time: '06:00 PM', place: safeText(end), description: 'Destination' },
      ],
    };
    const clone = JSON.parse(JSON.stringify(base));
    clone.option = clean.length + 1;
    if (clone.stops.length > 2) {
      clone.stops[1].description = (clone.stops[1].description || '') + ' · Auto-filled';
    } else if (clone.stops.length === 2) {
      clone.stops.splice(1, 0, { time: '12:00 PM', place: 'Mid stop (Auto-filled)', description: 'Auto-filled mid stop' });
    }
    clean.push(clone);
  }

  clean = clean.slice(0, 5);
  clean = clean.map((r, i) => {
    const stops = r.stops || [];
    if (stops.length === 0) {
      stops.push(
        { time: '09:00 AM', place: safeText(start), description: 'Start point' },
        { time: '06:00 PM', place: safeText(end), description: 'Destination' },
      );
    } else {
      stops[0].place = safeText(start);
      stops[stops.length - 1].place = safeText(end);
    }
    return { option: i + 1, stops };
  });

  return clean;
}

/** Constructing Prompt */
function buildPrompt(start, end) {
  return `
You are a meticulous travel planner.

TASK:
Create EXACTLY 5 different driving itineraries from the given start to the given end in New Zealand.

HARD RULES (must follow all):
- The FIRST stop of every itinerary MUST be the EXACT string: "${start}"
- The LAST stop of every itinerary MUST be the EXACT string: "${end}"
- Do NOT change or normalize these two strings. Use them verbatim.
- Each itinerary must have 3–6 stops total (including start and end).
- All intermediate stops must be real places that can be found on Google Maps (no vague descriptions).
- Times can be approximate, e.g. "10:00 AM".
- Keep descriptions short (1 sentence).

OUTPUT (JSON ONLY — no extra text):
[
  { "option": 1, "stops": [
    { "time": "09:00 AM", "place": "${start}", "description": "Start point" },
    { "time": "10:30 AM", "place": "Valid mid stop 1", "description": "..." },
    { "time": "06:00 PM", "place": "${end}", "description": "Destination" }
  ]},
  { "option": 2, "stops": [ ... ] },
  { "option": 3, "stops": [ ... ] },
  { "option": 4, "stops": [ ... ] },
  { "option": 5, "stops": [ ... ] }
]`.trim();
}

/** Calling Model */
async function callModelForRoutes(start, end) {
  const prompt = buildPrompt(start, end);
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You always follow instructions exactly and return valid JSON.' },
        { role: 'user', content: prompt }
      ],
    });
    const content = completion.choices?.[0]?.message?.content || '';
    const obj = JSON.parse(content);
    const arr = Array.isArray(obj) ? obj : (obj.data || obj.routes || obj.itineraries);
    if (Array.isArray(arr)) return arr;
  } catch {}

  const fallback = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    temperature: 0.2,
    messages: [
      { role: 'system', content: 'Return JSON only. No commentary.' },
      { role: 'user', content: prompt },
    ],
  });
  const text = fallback.choices?.[0]?.message?.content || '';
  const parsed = extractJson(text);
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') {
    const arr = parsed.data || parsed.routes || parsed.itineraries;
    if (Array.isArray(arr)) return arr;
  }
  return [];
}

/** Generate Route */
router.post('/generate-route', async (req, res) => {
  const { start, end } = req.body || {};
  if (!start || !end) {
    return res.status(400).json({ success: false, message: 'start and end are required' });
  }
  try {
    let routes = [];
    let attempts = 0;
    while (attempts < 2) {
      attempts++;
      const raw = await callModelForRoutes(start, end);
      routes = validateAndFixRoutes(raw, start, end);
      const ok =
        Array.isArray(routes) &&
        routes.length === 5 &&
        routes.every(r =>
          Array.isArray(r.stops) &&
          r.stops.length >= 2 &&
          r.stops[0]?.place?.trim() === start.trim() &&
          r.stops[r.stops.length - 1]?.place?.trim() === end.trim()
        );
      if (ok) break;
    }
    if (!Array.isArray(routes) || routes.length !== 5) {
      routes = validateAndFixRoutes(routes || [], start, end);
    }
    return res.json({ success: true, result: JSON.stringify(routes) });
  } catch (error) {
    console.error('generate-route error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate routes' });
  }
});

/** ========= "Save Route / My Route" with authentication ========= **/

// Save route (must be logged in)
router.post('/save-route', requireAuth, async (req, res) => {
  try {
    const { title, stops } = req.body || {};

    // Simple verification
    if (!Array.isArray(stops) || stops.length < 2) {
      return res.status(400).json({ success: false, message: 'stops is required' });
    }

    // Get the user ID from the authentication middleware
    const userId = req.user && (req.user.id || req.user.sub || req.user._id);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Just write title (consistent with the model)
    const doc = await Route.create({
      userId,
      title: (title && title.trim()) || `My Trip - ${new Date().toLocaleString()}`,
      stops
    });

    return res.status(201).json({ success: true, routeId: doc._id, route: doc });
  } catch (e) {
    console.error('save-route error:', e);
    return res.status(500).json({ success: false, message: e.message || 'Failed to save route' });
  }
});


// My Routes (must be logged in)
router.get('/my-routes', requireAuth, async (req, res) => {
  try {
    const userId = (req.user && (req.user.id || req.user.sub || req.user._id));
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const routes = await Route.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, routes });
  } catch (e) {
    console.error('my-routes error:', e);
    return res.status(500).json({ success: false, message: 'Failed to load routes' });
  }
});

module.exports = router;
