/**
 * Manejo centralizado de rutas inexistentes y de errores no controlados,
 * para que la API siempre responda en JSON y nunca con una página HTML de error.
 */
const { error } = require('../utilidades/respuestas');

/** Se ejecuta cuando ninguna ruta coincidió con la petición. */
function rutaNoEncontrada(peticion, respuesta) {
  return error(respuesta, 404,
    `La ruta ${peticion.method} ${peticion.originalUrl} no existe en esta API.`);
}

/** Captura cualquier error que se escape de los controladores. */
function manejadorErrores(err, peticion, respuesta, siguiente) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return error(respuesta, 400, 'El cuerpo de la petición no es un JSON válido.');
  }
  if (err && err.code === 'SQLITE_CONSTRAINT_CHECK') {
    return error(respuesta, 400, 'Alguno de los valores enviados no cumple las reglas del modelo de datos.');
  }
  if (err && String(err.code || '').startsWith('SQLITE_CONSTRAINT')) {
    return error(respuesta, 409, 'La operación viola una restricción de la base de datos.');
  }

  console.error('[error]', err && err.message);
  return error(respuesta, 500, 'Ocurrió un error interno en el servidor.');
}

module.exports = { rutaNoEncontrada, manejadorErrores };
