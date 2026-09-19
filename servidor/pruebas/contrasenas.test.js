/**
 * NF-01 (versión 1.2): las contraseñas se comparan en hilos de trabajo y el
 * hilo principal sigue atendiendo peticiones durante una ráfaga de logins.
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const { levantar } = require('./apoyo');
const contrasenas = require('../utilidades/contrasenas');

let api;
before(async () => { api = await levantar(); });
after(async () => { await api.cerrar(); await contrasenas.cerrar(); });

test('PS-01 NF-01 · el grupo de hilos calcula y compara hashes compatibles con bcrypt', async () => {
  const hash = await contrasenas.calcularHash('Clave2026*');
  assert.match(hash, /^\$2[aby]\$10\$/);
  assert.equal(bcrypt.compareSync('Clave2026*', hash), true);
  assert.equal(await contrasenas.comparar('Clave2026*', hash), true);
  assert.equal(await contrasenas.comparar('otra', hash), false);
  assert.equal(await contrasenas.comparar(undefined, hash), false);
});

test('PS-02 NF-01 · el login correcto sigue funcionando con el grupo de hilos', async () => {
  const r = await api.iniciar('ana.gomez', 'Usuario2026*');
  assert.equal(r.estado, 200);
  assert.ok(r.datos.token);
});

test('PS-03 NF-01 · durante 20 logins simultáneos /api/salud responde en menos de 300 ms', async () => {
  // Cada login usa una IP distinta para no activar el límite de intentos.
  const logins = Array.from({ length: 20 }, (_, i) =>
    api.iniciar('laura.tecnico', 'Tecnico2026*', `10.0.0.${i + 1}`));
  await new Promise((r) => setTimeout(r, 20)); // deja que la ráfaga empiece
  const inicio = performance.now();
  const salud = await api.pedir('GET', '/salud');
  const demora = performance.now() - inicio;
  const resultados = await Promise.all(logins);
  console.log(`   /api/salud durante la ráfaga: ${demora.toFixed(1)} ms`);
  assert.equal(salud.estado, 200);
  assert.ok(resultados.every((r) => r.estado === 200), 'todos los logins deben ser correctos');
  assert.ok(demora < 300, `la consulta tardó ${demora.toFixed(1)} ms`);
});
