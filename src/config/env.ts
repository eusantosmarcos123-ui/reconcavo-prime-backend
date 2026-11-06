import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 3333,
  HOST: process.env.HOST || '0.0.0.0',
  JWT_SECRET: process.env.JWT_SECRET || 'reconcavo-prime-super-secret-high-performance-token-2026',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3333',
  STITCH_PROJECT_ID: process.env.STITCH_PROJECT_ID || '11909117132411956430',
  STITCH_PROJECT_URL: process.env.STITCH_PROJECT_URL || 'https://stitch.withgoogle.com/projects/11909117132411956430',
  STITCH_API_KEY: process.env.STITCH_API_KEY || '',
};
