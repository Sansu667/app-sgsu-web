/** Controlador del sello de integridad de la bitácora (versión 1.2, NF-03). */
const modelo = require('../modelos/selloModelo');
const { exito, error } = require('../utilidades/respuestas');

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** POST /api/bitacora/sellos — sella un día (hoy si no se envía fecha). */
function sellar(peticion, respuesta) {
  const fecha = (peticion.body && peticion.body.fecha) || modelo.hoy();
  if (!FORMATO_FECHA.test(fecha) || Number.isNaN(Date.parse(fecha))) {
    return error(respuesta, 400, 'La fecha debe tener el formato AAAA-MM-DD.');
  }
  if (fecha > modelo.hoy()) {
    return error(respuesta, 400, 'No se puede sellar un día que todavía no ha ocurrido.');
  }
  const sello = modelo.sellar(fecha);
  if (!sello) return error(respuesta, 409, `El día ${fecha} ya tiene sello de integridad.`);
  return exito(respuesta, 201, { sello }, 'Bitácora del día sellada correctamente.');
}

/** GET /api/bitacora/sellos — lista los sellos creados. */
function listar(peticion, respuesta) {
  return exito(respuesta, 200, { sellos: modelo.listar() });
}

/** GET /api/bitacora/verificacion — recalcula la cadena y reporta alteraciones. */
function verificar(peticion, respuesta) {
  return exito(respuesta, 200, modelo.verificar());
}

module.exports = { sellar, listar, verificar };
