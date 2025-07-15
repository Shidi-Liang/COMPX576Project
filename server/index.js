const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const gptRoutes = require('./routes/gpt');


const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());
app.use('/api', gptRoutes); // Routing Entry


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
