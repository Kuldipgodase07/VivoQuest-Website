// server/db.js — PostgreSQL connection pool
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

// Test connection on startup
pool.query('SELECT NOW()').then(() => {
  console.log('✅ PostgreSQL connected successfully');
}).catch((err) => {
  console.error('❌ PostgreSQL connection failed:', err.message);
  console.error('   Check your DATABASE_URL in .env');
});

export default pool;
