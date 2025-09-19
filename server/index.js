/*const express = require('express');
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
});*/

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const routeRoutes = require('./routes/route');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/route', routeRoutes);

// 健康检查路由（Render 会定时访问）
app.get('/healthz', (req, res) => {
  res.status(200).send('ok');
});

// MongoDB 连接
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

