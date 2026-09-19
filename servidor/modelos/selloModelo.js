/**
 * Modelo del sello de integridad de la bitácora (versión 1.2, NF-03).
 *
 * La idea: al cierre de cada día se calcula un hash SHA-256 con todos los
 * movimientos de la bitácora de ese día, encadenado con el hash del sello
 * anterior. Si alguien modifica o borra un movimiento directamente en la base
 * de datos, al recalcular el hash ya no coincide con el guardado y la
 * verificación lo marca como alterado. El primer sello se encadena con 64 ceros.
 */
const crypto = require('node:crypto');
const { baseDatos } = require('../configuracion/baseDatos');

const HASH_INICIAL = '0'.repeat(64);

/** Fecha local de hoy en formato AAAA-MM-DD (la misma zona que usa SQLite con 'localtime'). */
function hoy() {
  return baseDatos.prepare("SELECT date('now','localtime') AS fecha").get().fecha;
}

/** Movimientos de un día, siempre en el mismo orden para que el hash sea estable. */
function movimientosDelDia(fecha) {
  return baseDatos.prepare(`
    SELECT id, id_solicitud, id_usuario, estado_anterior, estado_nuevo, comentario, fecha
      FROM bitacora
     WHERE substr(fecha, 1, 10) = ?
     ORDER BY id
  `).all(fecha).map((fila) => ({ ...fila }));
}

function calcularHash(hashAnterior, movimientos) {
  return crypto.createHash('sha256')
    .update(hashAnterior)
    .update(JSON.stringify(movimientos))
    .digest('hex');
}

// La cadena sigue el orden en que se crearon los sellos (id) y no el de las
// fechas: así se puede sellar después un día anterior que quedó pendiente sin
// romper la cadena. (Encontrado en la prueba PS-13 de la versión 1.2.)
function listar() {
  return baseDatos.prepare('SELECT * FROM sello_bitacora ORDER BY id').all().map((f) => ({ ...f }));
}

function buscarPorFecha(fecha) {
  const fila = baseDatos.prepare('SELECT * FROM sello_bitacora WHERE fecha = ?').get(fecha);
  return fila ? { ...fila } : null;
}

/** Crea el sello de un día. Devuelve null si ese día ya estaba sellado. */
function sellar(fecha) {
  if (buscarPorFecha(fecha)) return null;
  const ultimo = baseDatos.prepare('SELECT hash FROM sello_bitacora ORDER BY id DESC LIMIT 1').get();
  const hashAnterior = ultimo ? ultimo.hash : HASH_INICIAL;
  const movimientos = movimientosDelDia(fecha);
  const hash = calcularHash(hashAnterior, movimientos);
  baseDatos.prepare(`
    INSERT INTO sello_bitacora (fecha, total_movimientos, hash, hash_anterior)
    VALUES (?, ?, ?, ?)
  `).run(fecha, movimientos.length, hash, hashAnterior);
  return buscarPorFecha(fecha);
}

/** Recalcula toda la cadena y devuelve los días cuyo hash ya no coincide. */
function verificar() {
  const sellos = listar();
  const alteradas = [];
  let hashEsperadoAnterior = HASH_INICIAL;
  for (const sello of sellos) {
    const movimientos = movimientosDelDia(sello.fecha);
    const recalculado = calcularHash(sello.hash_anterior, movimientos);
    const cadenaRota = sello.hash_anterior !== hashEsperadoAnterior;
    if (recalculado !== sello.hash || cadenaRota) {
      alteradas.push({
        fecha: sello.fecha,
        movimientosSellados: sello.total_movimientos,
        movimientosActuales: movimientos.length,
        motivo: cadenaRota ? 'la cadena de sellos está rota' : 'los movimientos del día cambiaron',
      });
    }
    hashEsperadoAnterior = sello.hash;
  }
  return {
    estado: alteradas.length ? 'alterada' : 'íntegra',
    sellosRevisados: sellos.length,
    alteradas,
  };
}

module.exports = { hoy, sellar, listar, verificar, HASH_INICIAL };
