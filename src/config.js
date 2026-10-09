const env = process.env;
const [serverName, namedInstance] = (env.DB_SERVER || 'localhost').split('\\');
const instanceName = env.DB_INSTANCE || namedInstance;
export const config = {
  port: Number(env.PORT || 3000), production: env.NODE_ENV === 'production',
  secret: env.SESSION_SECRET,
  database: {
    server: serverName, ...(instanceName ? {} : { port: Number(env.DB_PORT || 1433) }),
    database: env.DB_DATABASE || 'Restaurante', user: env.DB_USER, password: env.DB_PASSWORD,
    options: { encrypt: env.DB_ENCRYPT !== 'false', trustServerCertificate: env.DB_TRUST_CERTIFICATE === 'true', ...(instanceName ? { instanceName } : {}) },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
  }
};
export function validateConfig() {
  if (!config.secret || config.secret.length < 32 || config.secret.startsWith('REEMPLAZAR')) {
    throw new Error('Configura SESSION_SECRET con un secreto aleatorio de al menos 32 caracteres.');
  }
  if (!config.database.user || !config.database.password || config.database.password.startsWith('REEMPLAZAR')) {
    throw new Error('Configura DB_USER y DB_PASSWORD en .env.');
  }
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) throw new Error('PORT inválido.');
}
