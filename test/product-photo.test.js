import test from 'node:test';
import assert from 'node:assert/strict';
import helmet from 'helmet';
import { photoMime, photoPreview } from '../public/product-photo.js';
test('la vista previa usa imágenes data compatibles con la política de la página',async () => {
  const previous = globalThis.FileReader;
  globalThis.FileReader = class {
    readAsDataURL() { this.result = 'data:image/png;base64,dGVzdA=='; this.onload(); }
  };
  try {
    const source = await photoPreview({type:'image/png'});
    assert.match(source,/^data:image\/png;/);
    const headers = {};
    helmet()({headers:{},secure:false},{setHeader:(name,value) => headers[name.toLowerCase()] = value,removeHeader:() => {}},() => {});
    const imagePolicy = headers['content-security-policy'].split(';').find(part => part.startsWith('img-src'));
    assert.match(imagePolicy,/data:/);
    assert.doesNotMatch(imagePolicy,/blob:/);
  } finally { if (previous) globalThis.FileReader = previous; else delete globalThis.FileReader; }
});
test('reconoce fotos de Windows sin tipo MIME y rechaza otros formatos',() => {
  assert.equal(photoMime({name:'comida.PNG',type:''}),'image/png');
  assert.equal(photoMime({name:'comida.jpeg',type:'application/octet-stream'}),'image/jpeg');
  assert.equal(photoMime({name:'foto.webp',type:'image/webp'}),'image/webp');
  assert.equal(photoMime({name:'foto.png',type:'text/html'}),null);
  assert.equal(photoMime({name:'foto.heic',type:''}),null);
});
