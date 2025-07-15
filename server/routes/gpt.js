const express = require('express');
const router = express.Router();
require('dotenv').config();

const OpenAI = require('openai'); 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post('/generate-route', async (req, res) => {
  console.log('✅ API HIT: /api/generate-route');  // <--- 加这一行
  const { location, preference } = req.body;

  const prompt = `I want to visit ${location}. I enjoy ${preference}. Please suggest a 3-stop travel itinerary with times and brief explanations.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch GPT result' });
  }
});

module.exports = router;
