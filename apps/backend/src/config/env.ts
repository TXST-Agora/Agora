import 'dotenv/config';
export const ENV = {
  PORT: process.env.PORT ?? '3000',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  MONGO_URI: process.env.MONGO_URI ?? '',
  JWT_SECRET: process.env.JWT_SECRET ?? 'dev'
} as const;
