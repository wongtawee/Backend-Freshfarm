const express = require('express');
const router = express.Router();
const { register, login,  forgotPassword,
  resetPassword,handleResetRedirect } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
const authMiddleware = require('../middleware/authMiddleware');

router.get('/me', authMiddleware, (req, res) => {
  res.json({
    message: 'Token ถูกต้อง',
    user: req.user 
  });
});
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/reset-redirect', handleResetRedirect);

module.exports = router;
