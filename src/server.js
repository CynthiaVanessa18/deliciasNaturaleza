import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import { config, validateConfig } from './config.js';
import { getPool, closePool } from './db.js';
import { SqlSessionStore } from './session-store.js';
import { api } from './api.js';
import { AppError } from './domain.js';
try {
  validateConfig();
  const pool = await getPool();
  await pool.request().query("IF COL_LENGTH('Products','ImageUrl') IS NULL ALTER TABLE Products ADD ImageUrl nvarchar(300) NULL");
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(express.json({ limit: '64kb' }));
  app.use('/assets/bootstrap',express.static(fileURLToPath(new URL('../node_modules/bootstrap/dist/',import.meta.url))));
  app.use(express.static(fileURLToPath(new URL('../public/',import.meta.url))));
  app.use(session({ name: 'restaurante.sid', secret: config.secret, store: new SqlSessionStore(),
    resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', secure: config.production, maxAge: 8*60*60*1000 } }));
  app.use('/api',(req,res,next) => { res.set('Cache-Control','no-store'); next(); },api);
  app.use('/api',(req,res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
  app.use((error,req,res,next) => {
    if (res.headersSent) return next(error);
    const duplicate = [2601,2627].includes(error.number);
    const malformed = error.type === 'entity.parse.failed';
    const tooLarge = error.type === 'entity.too.large';
    const status = error instanceof AppError ? error.status : duplicate ? 409 : malformed ? 400 : tooLarge ? 413 : 500;
    if (status === 500) console.error('Error de operación:',error.message);
    res.status(status).json({ error: duplicate ? 'Ya existe un registro con esos datos.' : malformed ? 'JSON inválido.' : tooLarge ? 'El archivo supera el tamaño permitido (5 MB para imágenes).' : status === 500 ? 'No se pudo completar la operación. Intenta de nuevo.' : error.message });
  });
  const server = app.listen(config.port,'127.0.0.1',() => console.log(`Restaurante disponible en http://localhost:${config.port}`));
  const cleanup = setInterval(() => getPool().then(pool => pool.request().query('DELETE FROM Sessions WHERE ExpiresAt<SYSUTCDATETIME()')).catch(error => console.error('Limpieza de sesiones:',error.message)),60*60*1000);
  cleanup.unref();
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal,() => server.close(async () => { clearInterval(cleanup); await closePool(); process.exit(0); }));
} catch (error) { console.error('No se pudo iniciar el restaurante:',error.message); await closePool(); process.exitCode = 1; }
