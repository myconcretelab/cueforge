import { mkdir } from 'node:fs/promises';
import { buildApp } from './app.js';
import { config } from './config.js';
import { pool } from './db/index.js';
import { registerSocketServer } from './socket.js';
import { cleanupExpiredDemos } from './services/demo.js';

await mkdir(config.STORAGE_PATH, { recursive: true });
const app = await buildApp();
const io = registerSocketServer(app);
const cleanupDemos = () => cleanupExpiredDemos().then((count) => {
  if (count > 0) app.log.info({ count }, 'Espaces de démonstration expirés supprimés');
}).catch((error) => app.log.error(error, 'Échec du nettoyage des espaces de démonstration'));
await cleanupDemos();
const demoCleanupTimer = setInterval(cleanupDemos, 60 * 60 * 1000);
demoCleanupTimer.unref();

const shutdown = async () => {
  clearInterval(demoCleanupTimer);
  io.close();
  await app.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ host: config.HOST, port: config.PORT });
