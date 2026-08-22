import { mkdir } from 'node:fs/promises';
import { buildApp } from './app.js';
import { config } from './config.js';
import { pool } from './db/index.js';
import { registerSocketServer } from './socket.js';

await mkdir(config.STORAGE_PATH, { recursive: true });
const app = await buildApp();
const io = registerSocketServer(app);

const shutdown = async () => {
  io.close();
  await app.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ host: config.HOST, port: config.PORT });
