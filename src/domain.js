import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export class AppError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function positiveInteger(value, name = 'Cantidad') {
  if (!Number.isSafeInteger(value) || value < 1 || value > 1000000) throw new AppError(`${name} inválido.`);
  return value;
}
export function text(value, name, max = 120) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new AppError(`${name} inválido.`);
  return value.trim();
}
export function normalizeItems(items) {
  if (!Array.isArray(items) || !items.length || items.length > 50) throw new AppError('Agrega entre 1 y 50 productos.');
  return items.map(item => ({
    productId: positiveInteger(item.productId, 'Producto'), quantity: positiveInteger(item.quantity),
    notes: item.notes == null ? '' : typeof item.notes === 'string' && item.notes.length <= 300 ? item.notes.trim() : (() => { throw new AppError('Observación demasiado larga.'); })()
  }));
}
export function assertTransition(from, to) {
  const transitions = { abierto: ['pendiente'], pendiente: ['preparando'], preparando: ['listo'], listo: ['entregado'] };
  if (!transitions[from]?.includes(to)) throw new AppError('El estado del pedido cambió o la transición no está permitida.', 409);
}
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${(await scrypt(password, salt, 64)).toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || password.length > 200) return false;
  const [salt, hash] = encoded.split(':');
  const expected = Buffer.from(hash, 'hex');
  const actual = await scrypt(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
