import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { readFile, unlink } from 'node:fs/promises';
import { api } from '../src/api.js';
import { imageExtension, imagePath, MAX_IMAGE_BYTES } from '../src/product-images.js';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9xkAAAAASUVORK5CYII=','base64');
test('valida formato, tamaño y rutas de las fotos de productos', () => {
  assert.equal(imageExtension(png,'image/png'),'png');
  assert.throws(() => imageExtension(png,'image/jpeg'));
  assert.throws(() => imageExtension(Buffer.from('<svg/>'),'image/png'));
  assert.throws(() => imageExtension(Buffer.alloc(MAX_IMAGE_BYTES+1),'image/png'));
  assert.equal(imagePath(''),'');
  assert.equal(imagePath('/assets/images/customer-platos.svg'),'/assets/images/customer-platos.svg');
  assert.equal(imagePath(null),null);
  assert.equal(imagePath('/uploads/products/11223344-1122-3344-5566-112233445566.png'),'/uploads/products/11223344-1122-3344-5566-112233445566.png');
  assert.throws(() => imagePath('https://example.com/image.png'));
  assert.throws(() => imagePath('/uploads/products/../../image.png'));
});
test('la API guarda imágenes válidas y exige permisos y protección de sesión',async () => {
  const app = express();
  app.use((req,res,next) => { req.session = {csrf:'test-token'}; if (req.get('x-test-role')) req.user = {id:1,role:req.get('x-test-role')}; next(); });
  app.use('/api',api);
  app.use((error,req,res,next) => res.status(error.status || 500).json({error:error.message}));
  const server = app.listen(0,'127.0.0.1');
  await new Promise(resolve => server.on('listening',resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/product-images`;
  let savedFile;
  try {
    const upload = headers => fetch(url,{method:'POST',headers:{'content-type':'image/png','x-csrf-token':'test-token',...headers},body:png});
    assert.equal((await upload({})).status,401);
    assert.equal((await upload({'x-test-role':'cliente'})).status,403);
    assert.equal((await upload({'x-test-role':'administrador','x-csrf-token':'wrong'})).status,403);
    const response = await upload({'x-test-role':'administrador'});
    assert.equal(response.status,201);
    const {imageUrl} = await response.json();
    assert.match(imageUrl,/^\/uploads\/products\/[a-f0-9-]{36}\.png$/);
    savedFile = new URL(`../public${imageUrl}`,import.meta.url);
    assert.deepEqual(await readFile(savedFile),png);
    const invalid = await fetch(url,{method:'POST',headers:{'content-type':'image/png','x-csrf-token':'test-token','x-test-role':'gerente'},body:'invalid image'});
    assert.equal(invalid.status,400);
  } finally {
    if (savedFile) await unlink(savedFile);
    await new Promise(resolve => server.close(resolve));
  }
});
