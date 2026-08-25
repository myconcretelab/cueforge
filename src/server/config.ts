import 'dotenv/config';
import path from 'node:path';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1).default('postgresql://cueforge:password@localhost:5432/cueforge'),
  SESSION_SECRET: z.string().min(16).default('development-only-change-me'),
  STORAGE_PATH: z.string().default('./storage'),
  HOST: z.string().default('127.0.0.1'),
  PORT: z.coerce.number().int().positive().default(8100),
  PUBLIC_URL: z.string().url().default('http://localhost:5173'),
  LEGACY_PUBLIC_URLS: z.string().default('').transform((value) => value
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean))
    .pipe(z.array(z.string().url())),
  FREESOUND_API_KEY: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().trim().min(1).optional(),
  ),
  SUPER_ADMIN_EMAILS: z.string().default('').transform((value) => value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean))
    .pipe(z.array(z.string().email())),
  MAIL_FROM: z.string().trim().min(1).default('CueForge <noreply@cueforge.fr>'),
  SMTP_HOST: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().trim().min(1).optional(),
  ),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.string().default('false').transform((value) => value === 'true'),
  SMTP_USER: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().trim().min(1).optional(),
  ),
  SMTP_PASSWORD: z.preprocess(
    (value) => value === '' ? undefined : value,
    z.string().min(1).optional(),
  ),
  SENDMAIL_PATH: z.string().trim().min(1).default('/usr/sbin/sendmail'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
}).superRefine((value, context) => {
  if (Boolean(value.SMTP_USER) !== Boolean(value.SMTP_PASSWORD)) {
    context.addIssue({
      code: 'custom',
      path: ['SMTP_USER'],
      message: 'SMTP_USER et SMTP_PASSWORD doivent être définis ensemble.',
    });
  }
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
  PUBLIC_ORIGINS: [parsed.data.PUBLIC_URL, ...parsed.data.LEGACY_PUBLIC_URLS],
  isProduction: parsed.data.NODE_ENV === 'production',
};
