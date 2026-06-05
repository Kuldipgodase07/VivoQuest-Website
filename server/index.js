// server/index.js — VivoQuest Express API server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import webinarRoutes from './routes/webinar.js';
import earlyAccessRoutes from './routes/earlyaccess.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────
app.use('/api/webinar-registrations', webinarRoutes);
app.use('/api/early-access', earlyAccessRoutes);

// ─── 404 fallback ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// ─── Start server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 VivoQuest API server running on http://localhost:${PORT}`);
  console.log(`   POST /api/webinar-registrations`);
  console.log(`   POST /api/early-access`);
  console.log(`   GET  /api/health`);
});
