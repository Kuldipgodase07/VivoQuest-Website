// server/routes/webinar.js — Webinar registration endpoints
import { Router } from 'express';
import pool from '../db.js';

const router = Router();

/**
 * POST /api/webinar-registrations
 * Body: { name, email, phone?, organization?, webinar }
 */
router.post('/', async (req, res) => {
  const { name, email, phone, organization, webinar } = req.body;

  // Basic validation
  if (!name || !email || !webinar) {
    return res.status(400).json({ error: 'name, email, and webinar session are required.' });
  }
  if (!['1', '2', 'both'].includes(webinar)) {
    return res.status(400).json({ error: 'webinar must be "1", "2", or "both".' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO webinar_registrations (name, email, phone, organization, webinar_session)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, webinar_session, created_at`,
      [name.trim(), email.trim().toLowerCase(), phone?.trim() || null, organization?.trim() || null, webinar]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      // Unique violation — email already registered
      return res.status(409).json({ error: 'This email is already registered for a webinar.' });
    }
    console.error('Webinar registration error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

/**
 * GET /api/webinar-registrations
 * Returns all registrations (for admin/debugging)
 */
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone, organization, webinar_session, created_at
       FROM webinar_registrations ORDER BY created_at DESC`
    );
    return res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (err) {
    console.error('Fetch webinar registrations error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
});

export default router;
