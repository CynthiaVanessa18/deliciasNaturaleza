import { readFile } from 'node:fs/promises';
import { getPool, closePool, sql } from '../src/db.js';
import { validateConfig } from '../src/config.js';
import { hashPassword } from '../src/domain.js';
try {
  validateConfig();
  const password = process.env.ADMIN_PASSWORD;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!password || password.length < 12 || password.startsWith('REEMPLAZAR') || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Configura ADMIN_EMAIL y ADMIN_PASSWORD (12 caracteres como mínimo).');
  }
  const pool = await getPool();
  for (const filename of ['schema.sql', 'product-images.sql', 'seed.sql']) {
    const source = await readFile(new URL(`../database/${filename}`, import.meta.url), 'utf8');
    for (const batch of source.split(/^\s*GO\s*$/gim).filter(part => part.trim())) await pool.request().batch(batch);
  }
  await pool.request().input('email', sql.NVarChar(254), email)
    .input('name', sql.NVarChar(120), process.env.ADMIN_NAME || 'Administrador')
    .input('hash', sql.VarChar(200), await hashPassword(password))
    .query(`IF NOT EXISTS(SELECT 1 FROM Users WHERE Email=@email)
      INSERT INTO Users(Name,Email,PasswordHash,Role) VALUES(@name,@email,@hash,'administrador');`);
  console.log('Tablas, menú de ejemplo y administrador preparados. Un usuario existente conserva su contraseña.');
} catch (error) { console.error('No se pudo preparar la base de datos:', error.message); process.exitCode = 1; }
finally { await closePool(); }
