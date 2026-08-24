import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1).default('postgresql://soundflow:password@localhost:5432/soundflow'),
  SESSION_SECRET: z.string().min(16).default('development-only-change-me'),
  STORAGE_PATH: z.string().default('./storage'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().default(8100),
  PUBLIC_URL: z.string().url().default('http://localhost:5173'),
  FREESOUND_API_KEY: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().trim().min(1).optional(),
  ),
  SAAS_MODE: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  TRIAL_DAYS: z.coerce.number().int().min(1).max(365).default(14),
  TRIAL_STORAGE_BYTES: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).default(2 * 1024 * 1024 * 1024),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = schema.safeParse({
  ...process.env,
  HOST: process.env.HOST ?? process.env.IP,
});

if (!parsed.success) {
  throw new Error(`Configuration invalide: ${parsed.error.message}`);
}

if (parsed.data.NODE_ENV === 'production' && parsed.data.SESSION_SECRET === 'development-only-change-me') {
  throw new Error('SESSION_SECRET doit être défini en production.');
}

export const config = {
  ...parsed.data,
  STORAGE_PATH: path.resolve(parsed.data.STORAGE_PATH),
  isProduction: parsed.data.NODE_ENV === 'production',
};
