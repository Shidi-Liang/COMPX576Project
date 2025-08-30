const express = require('express');
const router = express.Router();

const Route = require('../models/Route');

require('dotenv').config();

const OpenAI = require('openai'); 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


router.post('/generate-route', async (req, res) => {
  const { location, preference } = req.body;

  //const prompt = `I want to visit ${location}. I enjoy ${preference}. Please suggest a 3-stop travel itinerary with times and brief explanations.`;
  const prompt = `
  You are a travel planner. I want to visit ${location} and I enjoy ${preference}. 

  Please suggest 5 different travel itinerary option. Each option should include 3 different stops in ${location} or nearby that use real locations in Auckland, New Zealand.
  Only include real places in Auckland. Do NOT include locations in other countries or other regions.
  Please generate attractions located within Auckland city and easily reachable by car (within 30 minutes drive). Avoid islands or ferry-only places.
 

  Return your answer in the following JSON format:

  [
    {
      "option": 1,
      "stops": [
        { "time": "10:00 AM", "place": "PLACE NAME 1", "description": "..." },
        { "time": "1:00 PM", "place": "PLACE NAME 2", "description": "..." },
        { "time": "3:30 PM", "place": "PLACE NAME 3", "description": "..." }
      ]
    },
    {
      "option": 2,
      "stops": [...]
    },
    {
      "option": 3,
      "stops": [...]
    },
    {
      "option": 4,
      "stops": [...]
    },
    {
      "option": 5,
      "stops": [...]
    },
  ]
  Only return valid JSON.
  `;

    /*{
      "option": 2,
      "stops": [...]
    },
    {
      "option": 3,
      "stops": [...]
    },*/
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


// 保存路线
router.post('/save-route', async (req, res) => {
  const { userId, title, stops } = req.body;
  const route = new Route({ userId, title, stops });
  await route.save();
  res.json({ success: true, route });
});

// 获取用户路线
router.get('/my-routes/:userId', async (req, res) => {
  const routes = await Route.find({ userId: req.params.userId });
  res.json(routes);
});

module.exports = router;



