/** NF-02 (versión 1.2): bloqueo temporal después de 5 intentos fallidos. */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const { levantar } = require('./apoyo');
const contrasenas = require('../utilidades/contrasenas');
const limite = require('../middleware/limiteIntentos');

let api;
before(async () => { api = await levantar(); });
after(async () => { await api.cerrar(); await contrasenas.cerrar(); });

test('PS-04 NF-02 · cinco fallos devuelven 401 y el sexto intento devuelve 429', async () => {
  const ip = '203.0.113.10';
  for (let i = 1; i <= 5; i++) {
    const r = await api.iniciar('julian.tecnico', 'ClaveMala', ip);
    assert.equal(r.estado, 401, `intento ${i}`);
  }
  const bloqueado = await api.iniciar('julian.tecnico', 'Tecnico2026*', ip);
  assert.equal(bloqueado.estado, 429);
  assert.match(bloqueado.datos.mensaje, /Demasiados intentos/);
  const espera = Number(bloqueado.cabeceras.get('retry-after'));
  assert.ok(espera > 0 && espera <= limite.VENTANA_MS / 1000);
});

test('PS-05 NF-02 · el bloqueo no afecta a otro usuario desde la misma IP', async () => {
  const r = await api.iniciar('ana.gomez', 'Usuario2026*', '203.0.113.10');
  assert.equal(r.estado, 200);
});

test('PS-06 NF-02 · el bloqueo no afecta al mismo usuario desde otra IP', async () => {
  const r = await api.iniciar('julian.tecnico', 'Tecnico2026*', '198.51.100.7');
  assert.equal(r.estado, 200);
});

test('PS-07 NF-02 · un login correcto antes del límite reinicia el contador', async () => {
  const ip = '203.0.113.20';
  for (let i = 0; i < 4; i++) await api.iniciar('carlos.perez', 'ClaveMala', ip);
  assert.equal((await api.iniciar('carlos.perez', 'Usuario2026*', ip)).estado, 200);
  for (let i = 0; i < 4; i++) {
    assert.equal((await api.iniciar('carlos.perez', 'ClaveMala', ip)).estado, 401);
  }
  assert.equal((await api.iniciar('carlos.perez', 'Usuario2026*', ip)).estado, 200);
});

test('PS-08 NF-02 · el bloqueo vence cuando pasa la ventana de tiempo', () => {
  const ahora = 1_000_000;
  for (let i = 0; i < limite.LIMITE; i++) limite.registrarFallo('192.0.2.1', 'prueba', ahora);
  assert.ok(limite.segundosBloqueo('192.0.2.1', 'prueba', ahora) > 0);
  assert.equal(limite.segundosBloqueo('192.0.2.1', 'prueba', ahora + limite.VENTANA_MS), 0);
});
