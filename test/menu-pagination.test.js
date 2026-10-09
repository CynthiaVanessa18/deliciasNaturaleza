import test from 'node:test';
import assert from 'node:assert/strict';
import { menuPage } from '../public/menu-pagination.js';
test('30 comidas se recorren en cinco páginas sin saltos ni repeticiones',() => {
  const products = Array.from({length:30},(_,id) => ({id}));
  const seen = [];
  for (let page=1;page<=5;page++) {
    const result = menuPage(products,page);
    assert.equal(result.count,5); assert.equal(result.current,page); assert.equal(result.items.length,6);
    seen.push(...result.items);
  }
  assert.deepEqual(seen,products);
});
test('ajusta la última página al filtrar y maneja un menú vacío',() => {
  const result = menuPage(Array.from({length:7},(_,id) => id),5);
  assert.equal(result.current,2); assert.deepEqual(result.items,[6]); assert.equal(result.start,7); assert.equal(result.end,7);
  const filtered = menuPage([1,2],5); assert.equal(filtered.current,1); assert.deepEqual(filtered.items,[1,2]);
  const empty = menuPage([],5); assert.equal(empty.current,1); assert.deepEqual(empty.items,[]); assert.equal(empty.start,0); assert.equal(empty.end,0);
});
