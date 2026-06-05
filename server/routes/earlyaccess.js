// server/routes/earlyaccess.js — Early access signup endpoints
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

/**
 * POST /api/early-access
 * Body: { name, email, phone?, organization?, country }
 */
router.post('/', async (req, res) => {
  const { name, email, phone, organization, country } = req.body;

  // Basic validation
  if (!name || !email || !country) {
    return res.status(400).json({ error: 'name, email, and country are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO early_access_signups (name, email, phone, organization, country)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, country, created_at`,
      [name.trim(), email.trim().toLowerCase(), phone?.trim() || null, organization?.trim() || null, country.trim()]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      // Unique violation — already signed up
      return res.status(409).json({ error: 'This email has already signed up for early access.' });
    }
    console.error('Early access signup error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

/**
 * GET /api/early-access
 * Returns all signups (for admin/debugging)
 */
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, organization, country, created_at
       FROM early_access_signups ORDER BY created_at DESC`
    );
    return res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (err) {
    console.error('Fetch early access signups error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
