// server/routes/route.js
const express = require('express');
const router = express.Router();

const Route = require('../models/Route');
const requireAuth = require('../middleware/requireAuth'); // ← 如果你已经加了 JWT 中间件

require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/** 生成路线（你原本的接口，保持不变） */
router.post('/generate-route', async (req, res) => {
  const { start, end } = req.body;
  const prompt = `
You are a travel planner. 
I will give you a starting point (${start}) and a destination (${end}) in New Zealand.  

Generate exactly 5 driving itinerary options, each with 3 stops.  

Rules:
- The 3 stops must be towns or attractions that appear directly on the real driving route from ${start} to ${end}, or within 10 minutes driving distance from that route.
  The first stop must be somewhere in ${start} city, the last stop must be somewhere in ${end} city, and the middle stop must be somewhere in between.
- Do not include famous places from other regions of New Zealand if they are not directly on the driving path. 
- Avoid Rotorua, Napier, Queenstown, Christchurch, Dunedin, or any South Island locations unless ${start} and ${end} are in those areas. 
- If there are not many options, it is fine to repeat nearby towns or use smaller stops, as long as they are on the route.



  Return your answer in JSON:
  [
    { "option": 1, "stops": [ { "time": "10:00 AM", "place": "PLACE NAME 1", "description": "..." }, ... ] },
    { "option": 2, "stops": [...] },
    { "option": 3, "stops": [...] },
    { "option": 4, "stops": [...] },
    { "option": 5, "stops": [...] }
  ]
  Only return valid JSON.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    res.json({ success: true, result: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to fetch GPT result' });
  }
});

/** 保存路线 */
router.post('/save-route', async (req, res) => {
  try {
    const { userId, title, stops } = req.body;
    const route = await Route.create({ userId, title, stops });
    res.status(201).json({ success: true, route });
  } catch (e) {
    console.error('save-route error:', e);
    res.status(500).json({ success: false, message: 'Failed to save route' });
  }
});

/** ✅ 我的路线（不带参数，依赖 JWT） */
router.get('/my-routes', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub; // requireAuth 里解出的 { sub, email }
    const routes = await Route.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, routes });
  } catch (e) {
    console.error('my-routes error:', e);
    res.status(500).json({ success: false, message: 'Failed to load routes' });
  }
});

/** （可选）向下兼容你旧的带参数写法：/my-routes/:userId */
router.get('/my-routes/:userId', async (req, res) => {
  try {
    const routes = await Route.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, routes });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Failed to load routes' });
  }
});

module.exports = router;
