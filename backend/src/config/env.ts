import dotenv from 'dotenv';

dotenv.config();

const defaultOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

const parseOrigins = (value?: string) => {
  if (!value) return defaultOrigins;
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5001),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || defaultOrigins.join(','),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  MONGO_URI: process.env.MONGO_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-me',
  COOKIE_NAME: process.env.COOKIE_NAME || 'designforge_session',
  CSRF_COOKIE_NAME: process.env.CSRF_COOKIE_NAME || '_designforge_csrf',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_PROVIDER: process.env.AI_PROVIDER || 'openai',
  AI_MODEL: process.env.AI_MODEL || 'gpt-4o-mini',
  ALLOWED_ORIGINS: parseOrigins(process.env.CLIENT_ORIGIN),
};
