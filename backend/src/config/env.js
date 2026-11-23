require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'vivoquest_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 5432,
  DB_USER: process.env.DB_USER || 'vivoquest_admin',
  DB_PASS: process.env.DB_PASS || 'supersecret_pass',
  DB_NAME: process.env.DB_NAME || 'vivoquest_db',
  AIML_URL: process.env.AIML_URL || 'http://localhost:8000',
};
