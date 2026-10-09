export function photoMime(file) {
  if (['image/jpeg','image/png','image/webp'].includes(file.type)) return file.type;
  if (file.type && file.type !== 'application/octet-stream') return null;
  return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'})[file.name?.split('.').at(-1).toLowerCase()] || null;
}
export function photoPreview(file) {
  return new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}
