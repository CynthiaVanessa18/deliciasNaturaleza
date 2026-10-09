import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeItems, assertTransition, hashPassword, verifyPassword } from '../src/domain.js';
test('rechaza pedidos vacíos, cantidades negativas y observaciones demasiado largas',() => {
  for (const items of [[],[{ productId:1,quantity:-1 }],[{ productId:1,quantity:1.5 }],[{ productId:1,quantity:1,notes:'x'.repeat(301) }]]) assert.throws(() => normalizeItems(items));
  assert.deepEqual(normalizeItems([{ productId:1,quantity:2,notes:' sin cebolla ' }]),[{ productId:1,quantity:2,notes:'sin cebolla' }]);
});
test('impide saltos, regresiones y repetir transiciones de cocina',() => {
  for (const pair of [['abierto','listo'],['listo','preparando'],['pendiente','pendiente'],['entregado','abierto']]) assert.throws(() => assertTransition(...pair));
  for (const pair of [['abierto','pendiente'],['pendiente','preparando'],['preparando','listo'],['listo','entregado']]) assert.doesNotThrow(() => assertTransition(...pair));
});
test('las contraseñas usan sales distintas y rechazan credenciales incorrectas',async () => {
  const password = 'MiClaveDePrueba123';
  const first = await hashPassword(password), second = await hashPassword(password);
  assert.notEqual(first,second); assert.equal(await verifyPassword(password,first),true);
  assert.equal(await verifyPassword('incorrecta',first),false); assert.equal(await verifyPassword('x'.repeat(201),first),false);
});
