/**
 * Cálculo y comparación de contraseñas sin bloquear el servidor (NF-01, versión 1.2).
 *
 * En la versión 1.1 se usaba bcrypt.compareSync en el hilo principal. La prueba
 * de estrés con JMeter (defecto DEF-012) mostró que, mientras se comparaba una
 * contraseña, Node.js no podía atender nada más y las peticiones hacían fila.
 * Ahora el trabajo pesado se reparte en un grupo de hilos de trabajo
 * (worker_threads), uno por núcleo disponible, y el hilo principal queda libre.
 * Si por alguna razón no se pueden crear hilos, se usa la versión asíncrona de
 * bcryptjs como respaldo.
 */
const os = require('node:os');
const path = require('node:path');
const { Worker } = require('node:worker_threads');
const bcrypt = require('bcryptjs');

const RONDAS_SAL = 10;
const TAMANO = Math.max(1, Math.min(4,
  typeof os.availableParallelism === 'function' ? os.availableParallelism() : os.cpus().length));

const hilos = [];
const pendientes = new Map();
let siguienteId = 1;
let turno = 0;
let hilosDisponibles = true;

function crearHilo() {
  const hilo = new Worker(process.env.ARCHIVO_TRABAJADOR || path.join(__dirname, 'trabajadorContrasenas.js'));
  hilo.unref(); // sin tareas, el hilo no impide que el proceso termine
  hilo.tareas = 0;
  hilo.listo = false;
  hilo.on('message', ({ id, listo, resultado, error }) => {
    if (listo) { hilo.listo = true; return; } // el trabajador cargó bcrypt sin problemas
    const tarea = pendientes.get(id);
    if (!tarea) return;
    pendientes.delete(id);
    if (--hilo.tareas === 0) hilo.unref();
    if (error) tarea.rechazar(new Error(error)); else tarea.resolver(resultado);
  });
  hilo.on('error', (e) => {
    hilo.unref(); // un hilo caído no debe mantener vivo el proceso
    const i = hilos.indexOf(hilo);
    if (i >= 0) hilos.splice(i, 1);
    // Las tareas del hilo caído no se pierden: se terminan con el respaldo.
    for (const [id, tarea] of pendientes) {
      if (tarea.hilo === hilo) { pendientes.delete(id); respaldo(tarea.mensaje).then(tarea.resolver, tarea.rechazar); }
    }
    if (!hilo.listo) {
      // Si el hilo ni siquiera arrancó (por ejemplo, el archivo del trabajador
      // no quedó incluido en el despliegue), no se insiste: se usa el respaldo.
      if (hilosDisponibles) console.error('No se pudieron iniciar los hilos de contraseñas; se usa bcrypt asíncrono.', e.message);
      hilosDisponibles = false;
    } else if (hilosDisponibles) {
      hilos.push(crearHilo());
    }
  });
  return hilo;
}

/** Respaldo: versión asíncrona de bcryptjs en el hilo principal. */
function respaldo(mensaje) {
  return mensaje.operacion === 'comparar'
    ? bcrypt.compare(mensaje.clave, mensaje.hash)
    : bcrypt.hash(mensaje.clave, mensaje.rondas);
}

function enviar(mensaje) {
  if (hilosDisponibles && hilos.length === 0) {
    try {
      for (let i = 0; i < TAMANO; i++) hilos.push(crearHilo());
    } catch (e) {
      hilosDisponibles = false;
    }
  }
  if (!hilosDisponibles || hilos.length === 0) return respaldo(mensaje);
  const hilo = hilos[turno++ % hilos.length];
  const id = siguienteId++;
  // Mientras el hilo tenga tareas se mantiene referenciado, para que el
  // proceso no termine antes de recibir la respuesta.
  if (hilo.tareas++ === 0) hilo.ref();
  return new Promise((resolver, rechazar) => {
    pendientes.set(id, { resolver, rechazar, hilo, mensaje });
    hilo.postMessage({ id, ...mensaje });
  });
}

/** Compara una contraseña con su hash. Devuelve una promesa con true o false. */
function comparar(clave, hash) {
  if (typeof clave !== 'string' || typeof hash !== 'string') return Promise.resolve(false);
  return enviar({ operacion: 'comparar', clave, hash });
}

/** Calcula el hash de una contraseña nueva. */
function calcularHash(clave, rondas = RONDAS_SAL) {
  return enviar({ operacion: 'hash', clave, rondas });
}

/** Cierra los hilos. Solo lo usan las pruebas. */
async function cerrar() {
  await Promise.all(hilos.splice(0).map((h) => h.terminate()));
}

module.exports = { comparar, calcularHash, cerrar, TAMANO, RONDAS_SAL };
