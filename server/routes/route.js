const express = require('express');
const router = express.Router();

require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** 工具：从混杂文本里抠出 JSON */
function extractJson(text) {
  if (!text) return null;
  // 先尝试数组
  let m = text.match(/\[[\s\S]*\]/);
  if (m) {
    try { return JSON.parse(m[0]); } catch {}
  }
  // 再尝试对象
  m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch {}
  }
  return null;
}

/** 兜底：修正/补齐 5 条路线，并强制首尾为指定起终点 */
function validateAndFixRoutes(inputRoutes, start, end) {
  const safeText = (s) => (typeof s === 'string' ? s : String(s || ''));
  const routes = Array.isArray(inputRoutes) ? inputRoutes : [];

  // 过滤出有效 stops 的项
  let clean = routes
    .map((r, i) => {
      const opt = typeof r?.option === 'number' ? r.option : i + 1;
      const stops = Array.isArray(r?.stops) ? r.stops : [];
      return { option: opt, stops };
    })
    .filter(r => r.stops.length >= 1);

  // 修正每条路线的首尾 stop
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

    // 强制第一站= start
    if (stops[0].place.trim() !== start.trim()) {
      stops.unshift({ time: '09:00 AM', place: safeText(start), description: 'Start point' });
    } else {
      stops[0].place = safeText(start);
    }

    // 强制最后一站= end
    if (stops[stops.length - 1].place.trim() !== end.trim()) {
      stops.push({ time: '06:00 PM', place: safeText(end), description: 'Destination' });
    } else {
      stops[stops.length - 1].place = safeText(end);
    }

    // 去重：如果中途已经含 start/end，避免重复（保留首、尾）
    const mid = stops.slice(1, -1).filter(s => {
      const p = s.place.trim();
      return p !== start.trim() && p !== end.trim();
    });

    return {
      option: idx + 1,
      stops: [stops[0], ...mid, stops[stops.length - 1]],
    };
  });

  // 不足 5 条 → 拷贝最后一条补齐（标注 Auto-filled）
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
    // 给中途第一站打个标识，避免完全一样
    if (clone.stops.length > 2) {
      clone.stops[1].description = (clone.stops[1].description || '') + ' · Auto-filled';
    } else if (clone.stops.length === 2) {
      clone.stops.splice(1, 0, { time: '12:00 PM', place: 'Mid stop (Auto-filled)', description: 'Auto-filled mid stop' });
    }
    clean.push(clone);
  }

  // 超过 5 条 → 截断
  clean = clean.slice(0, 5);

  // 最终再做一次首尾强制
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

/** 构造严格 Prompt（英文更稳定） */
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
  {
    "option": 1,
    "stops": [
      { "time": "09:00 AM", "place": "${start}", "description": "Start point" },
      { "time": "10:30 AM", "place": "Valid mid stop 1", "description": "..." },
      { "time": "06:00 PM", "place": "${end}", "description": "Destination" }
    ]
  },
  { "option": 2, "stops": [ ... ] },
  { "option": 3, "stops": [ ... ] },
  { "option": 4, "stops": [ ... ] },
  { "option": 5, "stops": [ ... ] }
]
  `.trim();
}

/** 尝试用 JSON 模式；失败则回退文本解析 */
async function callModelForRoutes(start, end) {
  const prompt = buildPrompt(start, end);

  // 1) 优先：JSON 模式（部分模型支持）
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',          // 若没有此模型，可换为你可用的 4.x / 3.5 版本
      temperature: 0.2,              // 越低越稳
      response_format: { type: 'json_object' }, // 期望 JSON
      messages: [
        { role: 'system', content: 'You always follow instructions exactly and return valid JSON.' },
        { role: 'user', content: prompt }
      ],
    });
    const content = completion.choices?.[0]?.message?.content || '';
    const obj = JSON.parse(content);               // JSON 模式直接就是对象
    const arr = Array.isArray(obj) ? obj : (obj.data || obj.routes || obj.itineraries);
    if (Array.isArray(arr)) return arr;
  } catch (e) {
    // console.warn('JSON mode failed, fallback to text parse:', e?.message);
  }

  // 2) 回退：普通文本 → 提取 JSON
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
  // 再兜底：如果是对象包着数组
  if (parsed && typeof parsed === 'object') {
    const arr = parsed.data || parsed.routes || parsed.itineraries;
    if (Array.isArray(arr)) return arr;
  }
  return [];
}

/** 生成路线（强化版） */
router.post('/generate-route', async (req, res) => {
  const { start, end } = req.body || {};
  if (!start || !end) {
    return res.status(400).json({ success: false, message: 'start and end are required' });
  }

  try {
    let routes = [];
    let attempts = 0;

    while (attempts < 2) { // 最多重试 2 次
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

    // 最终兜底（理论上上面已经修好了）
    if (!Array.isArray(routes) || routes.length !== 5) {
      routes = validateAndFixRoutes(routes || [], start, end);
    }

    return res.json({
      success: true,
      // 维持你前端的旧接口：返回字符串（你现有代码里 JSON.parse(data.result)）
      result: JSON.stringify(routes),
    });
  } catch (error) {
    console.error('generate-route error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate routes' });
  }
});

module.exports = router;
