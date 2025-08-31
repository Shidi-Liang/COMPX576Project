const jwt = require('jsonwebtoken');
const { JWT_SECRET = 'dev_secret' } = process.env;

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Missing token' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET); // { sub, email, iat, exp }
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};
