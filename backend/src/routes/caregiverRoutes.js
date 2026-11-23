const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'cg-1', name: 'Rachana Shrestha', role: 'Registered Critical Care Nurse', verified: true, rating: 4.95 },
      { id: 'cg-2', name: 'Dr. Arvind Rao', role: 'Consultant Physician', verified: true, rating: 4.98 },
    ]
  });
});

module.exports = router;
