/**
 * Formato único de respuesta para toda la API.
 * Tener una sola forma de responder hace que quien consume el servicio
 * no tenga que adivinar la estructura en cada endpoint.
 */

/** Respuesta correcta: { exito: true, mensaje?, ...datos }. */
function exito(respuesta, codigo, datos = {}, mensaje) {
  const cuerpo = { exito: true };
  if (mensaje) cuerpo.mensaje = mensaje;
  return respuesta.status(codigo).json({ ...cuerpo, ...datos });
}

/** Respuesta de error: { exito: false, mensaje, errores? }. */
function error(respuesta, codigo, mensaje, errores) {
  const cuerpo = { exito: false, mensaje };
  if (errores && errores.length) cuerpo.errores = errores;
  return respuesta.status(codigo).json(cuerpo);
}

module.exports = { exito, error };
