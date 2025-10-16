const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const routeRoutes = require('./routes/route');

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routing
app.use('/api/auth', authRoutes);
app.use('/api/route', routeRoutes);

// Health check routing (Render will visit it regularly)
app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

