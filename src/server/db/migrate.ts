import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index.js';

await migrate(db, { migrationsFolder: './migrations' });
await pool.end();
console.log('Migrations appliquées.');
