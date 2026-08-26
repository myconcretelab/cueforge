import { mkdir } from 'node:fs/promises';
import { buildApp } from './app.js';
import { config } from './config.js';
import { pool } from './db/index.js';
import { registerSocketServer } from './socket.js';
import { cleanupExpiredDemos } from './services/demo.js';
import { reconcileStripeSubscriptions } from './services/billing.js';

await mkdir(config.STORAGE_PATH, { recursive: true });
const app = await buildApp();
const io = registerSocketServer(app);
const cleanupDemos = () => cleanupExpiredDemos().then((count) => {
  if (count > 0) app.log.info({ count }, 'Espaces de démonstration expirés supprimés');
}).catch((error) => app.log.error(error, 'Échec du nettoyage des espaces de démonstration'));
await cleanupDemos();
const demoCleanupTimer = setInterval(cleanupDemos, 60 * 60 * 1000);
demoCleanupTimer.unref();

const reconcileBilling = () => reconcileStripeSubscriptions().then(({ checked, failed }) => {
  if (checked > 0) app.log.info({ checked, failed }, 'Rapprochement Stripe terminé');
}).catch((error) => app.log.error(error, 'Échec du rapprochement Stripe'));
const billingReconciliationMs = config.BILLING_RECONCILIATION_INTERVAL_MINUTES * 60 * 1000;
const initialBillingTimer = billingReconciliationMs > 0 ? setTimeout(reconcileBilling, 30_000) : undefined;
initialBillingTimer?.unref();
const billingReconciliationTimer = billingReconciliationMs > 0 ? setInterval(reconcileBilling, billingReconciliationMs) : undefined;
billingReconciliationTimer?.unref();

const shutdown = async () => {
  clearInterval(demoCleanupTimer);
  if (initialBillingTimer) clearTimeout(initialBillingTimer);
  if (billingReconciliationTimer) clearInterval(billingReconciliationTimer);
  io.close();
  await app.close();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await app.listen({ host: config.HOST, port: config.PORT });
