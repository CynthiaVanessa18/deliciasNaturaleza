import sql from 'mssql';
import { config } from './config.js';
export { sql };
let pool;
export async function getPool() {
  if (!pool) pool = await new sql.ConnectionPool(config.database).connect();
  return pool;
}
export async function closePool() { if (pool) await pool.close(); }
