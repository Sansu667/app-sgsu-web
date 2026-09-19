/**
 * Hilo de trabajo que calcula y compara hashes bcrypt (NF-01, versión 1.2).
 * Corre fuera del hilo principal de Node.js, así que mientras compara una
 * contraseña el servidor sigue atendiendo las demás peticiones.
 */
const { parentPort } = require('node:worker_threads');
const bcrypt = require('bcryptjs');

parentPort.on('message', ({ id, operacion, clave, hash, rondas }) => {
  try {
    const resultado = operacion === 'comparar'
      ? bcrypt.compareSync(clave, hash)
      : bcrypt.hashSync(clave, rondas);
    parentPort.postMessage({ id, resultado });
  } catch (e) {
    parentPort.postMessage({ id, error: e.message });
  }
});

// Aviso al hilo principal de que el trabajador cargó bien y puede recibir tareas.
parentPort.postMessage({ listo: true });
