const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'คุณไม่มีสิทธิ์เข้าถึง (เฉพาะ admin)' });
  }
  next();
};

module.exports = adminMiddleware;
