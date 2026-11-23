const express = require('express');
const router = express.Router();

router.post('/triage', (req, res) => {
  const { symptoms } = req.body;
  res.json({
    success: true,
    triageLevel: 'HOME_VISIT_SUITABLE',
    recommendation: 'General Physician Visit + CBC Blood Panel',
    urgencyScore: 0.32
  });
});

module.exports = router;
