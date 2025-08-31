const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const { JWT_SECRET = "dev_secret", JWT_EXPIRES = "7d" } = process.env;

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// 登录
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ success: false, message: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid password' });

  const token = signToken(user);
  res.json({
    success: true,
    user: { id: user._id, email: user.email },
    token
  });
});

// 注册
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ success: false, message: 'Email already in use' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({ email, password: hashedPassword });

  const token = signToken(newUser);
  res.status(201).json({
    success: true,
    user: { id: newUser._id, email: newUser.email },
    token
  });
});

module.exports = router;
