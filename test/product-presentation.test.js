import test from 'node:test';
import assert from 'node:assert/strict';
import { productImage } from '../public/product-presentation.js';
test('una foto personalizada reemplaza la referencia y quitarla no restaura la foto inicial',() => {
  const imageUrl = '/uploads/products/11223344-1122-3344-5566-112233445566.png';
  assert.equal(productImage({name:'Casado de pollo',imageUrl}),imageUrl);
  assert.equal(productImage({name:'Casado de pollo',imageUrl:''}),null);
  assert.equal(productImage({name:'Casado de pollo',imageUrl:null}),'/assets/images/customer-platos.svg');
  assert.equal(productImage({name:'Comida nueva',imageUrl:null}),null);
  assert.equal(productImage({name:'Comida nueva',imageUrl:'javascript:alert(1)'}),null);
});
