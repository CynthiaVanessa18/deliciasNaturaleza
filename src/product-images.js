import { AppError } from './domain.js';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export function imageExtension(bytes, mime) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new AppError('Selecciona una imagen de máximo 5 MB.');
  if (mime === 'image/png' && bytes.length >= 24 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii',12,16) === 'IHDR') return 'png';
  if (mime === 'image/jpeg' && bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes.at(-2) === 255 && bytes.at(-1) === 217) return 'jpg';
  if (mime === 'image/webp' && bytes.length >= 20 && bytes.toString('ascii',0,4) === 'RIFF' && bytes.toString('ascii',8,12) === 'WEBP' && ['VP8 ','VP8L','VP8X'].includes(bytes.toString('ascii',12,16))) return 'webp';
  throw new AppError('Formato de imagen inválido. Usa JPG, PNG o WebP.');
}
export function imagePath(value) {
  if (value == null) return null;
  if (value === '') return '';
  if (typeof value !== 'string' || !(/^\/uploads\/products\/[a-f0-9-]{36}\.(png|jpg|webp)$/.test(value) || /^\/assets\/images\/customer-(entradas|platos|bebidas|postres)\.svg$/.test(value))) throw new AppError('La imagen del producto no es válida.');
  return value;
}
