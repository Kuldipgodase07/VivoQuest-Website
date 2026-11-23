const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const { email } = req.body;
  res.json({
    success: true,
    token: 'jwt_mock_token_vivoquest',
    user: { id: 'u1', name: 'Demo User', email, role: 'PATIENT' }
  });
});

router.get('/me', (req, res) => {
  res.json({
    success: true,
    data: { id: 'u1', name: 'Demo User', email: 'demo@vivoquest.com', role: 'PATIENT' }
  });
});

module.exports = router;
