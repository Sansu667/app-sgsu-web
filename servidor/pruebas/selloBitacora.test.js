/** NF-03 (versión 1.2): sello diario de integridad de la bitácora. */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { levantar } = require('./apoyo');
const contrasenas = require('../utilidades/contrasenas');
const { baseDatos } = require('../configuracion/baseDatos');

let api;
let tokenAdmin;
let tokenTecnico;
before(async () => {
  api = await levantar();
  tokenAdmin = (await api.iniciar('admin', 'Admin2026*')).datos.token;
  tokenTecnico = (await api.iniciar('laura.tecnico', 'Tecnico2026*')).datos.token;
});
after(async () => { await api.cerrar(); await contrasenas.cerrar(); });

test('PS-09 NF-03 · el administrador sella la bitácora del día (201)', async () => {
  const r = await api.pedir('POST', '/bitacora/sellos', { token: tokenAdmin, cuerpo: {} });
  assert.equal(r.estado, 201);
  assert.match(r.datos.sello.hash, /^[0-9a-f]{64}$/);
  assert.equal(r.datos.sello.hash_anterior, '0'.repeat(64));
  assert.ok(r.datos.sello.total_movimientos > 0);
});

test('PS-10 NF-03 · sellar dos veces el mismo día devuelve 409', async () => {
  const r = await api.pedir('POST', '/bitacora/sellos', { token: tokenAdmin, cuerpo: {} });
  assert.equal(r.estado, 409);
});

test('PS-11 NF-03 · fechas inválidas o futuras devuelven 400', async () => {
  for (const fecha of ['17/09/2026', '2999-01-01']) {
    const r = await api.pedir('POST', '/bitacora/sellos', { token: tokenAdmin, cuerpo: { fecha } });
    assert.equal(r.estado, 400, fecha);
  }
});

test('PS-12 NF-03 · los sellos se encadenan: el segundo usa el hash del primero', async () => {
  const r = await api.pedir('POST', '/bitacora/sellos', { token: tokenAdmin, cuerpo: { fecha: '2026-01-01' } });
  assert.equal(r.estado, 201);
  const lista = (await api.pedir('GET', '/bitacora/sellos', { token: tokenAdmin })).datos.sellos;
  assert.equal(lista.length, 2);
  assert.equal(lista[1].hash_anterior, lista[0].hash);
});

test('PS-13 NF-03 · sin cambios la verificación dice íntegra', async () => {
  const r = await api.pedir('GET', '/bitacora/verificacion', { token: tokenAdmin });
  assert.equal(r.estado, 200);
  assert.equal(r.datos.estado, 'íntegra');
  assert.deepEqual(r.datos.alteradas, []);
});

test('PS-14 NF-03 · un cambio directo en la base de datos se detecta como alterada', async () => {
  baseDatos.prepare("UPDATE bitacora SET comentario = 'cambiado a mano' WHERE id = 1").run();
  const r = await api.pedir('GET', '/bitacora/verificacion', { token: tokenAdmin });
  assert.equal(r.datos.estado, 'alterada');
  assert.equal(r.datos.alteradas.length, 1);
  assert.equal(r.datos.alteradas[0].motivo, 'los movimientos del día cambiaron');
});

test('PS-15 NF-03 · un técnico no puede sellar ni verificar (403)', async () => {
  const a = await api.pedir('POST', '/bitacora/sellos', { token: tokenTecnico, cuerpo: {} });
  const b = await api.pedir('GET', '/bitacora/verificacion', { token: tokenTecnico });
  assert.equal(a.estado, 403);
  assert.equal(b.estado, 403);
});

test('PS-16 NF-03 · sin token la ruta responde 401', async () => {
  const r = await api.pedir('GET', '/bitacora/sellos');
  assert.equal(r.estado, 401);
});
