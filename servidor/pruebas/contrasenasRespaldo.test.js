/**
 * NF-01 (versión 1.2): si los hilos de trabajo no pueden arrancar (por ejemplo,
 * porque el archivo del trabajador no quedó en el despliegue), el inicio de
 * sesión no se cae: se usa bcrypt asíncrono como respaldo.
 */
process.env.ARCHIVO_TRABAJADOR = '/no/existe/trabajador.js';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const contrasenas = require('../utilidades/contrasenas');

after(() => contrasenas.cerrar());

test('PS-17 NF-01 · sin hilos de trabajo la comparación usa el respaldo y sigue funcionando', async () => {
  const hash = bcrypt.hashSync('Clave2026*', 10);
  const errorOriginal = console.error;
  console.error = () => {}; // el aviso esperado no ensucia la salida de la prueba
  try {
    const resultados = await Promise.all([
      contrasenas.comparar('Clave2026*', hash),
      contrasenas.comparar('otra', hash),
    ]);
    assert.deepEqual(resultados, [true, false]);
    // Después del fallo, las siguientes llamadas van directo al respaldo.
    assert.equal(await contrasenas.comparar('Clave2026*', hash), true);
    const nuevo = await contrasenas.calcularHash('Otra2026*');
    assert.equal(bcrypt.compareSync('Otra2026*', nuevo), true);
  } finally {
    console.error = errorOriginal;
  }
});
