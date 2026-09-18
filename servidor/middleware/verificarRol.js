/**
 * Middleware de autorización: comprueba que el usuario del token tenga
 * alguno de los roles que la ruta exige.
 *
 * Uso:  rutas.post('/', verificarToken, verificarRol('administrador'), controlador)
 */
const { error } = require('../utilidades/respuestas');

function verificarRol(...rolesPermitidos) {
  return function (peticion, respuesta, siguiente) {
    if (!peticion.usuario) {
      return error(respuesta, 401, 'Acceso no autorizado: falta el token de autenticación.');
    }
    if (!rolesPermitidos.includes(peticion.usuario.rol)) {
      return error(
        respuesta, 403,
        `Acceso denegado: esta operación solo está permitida para el rol ${rolesPermitidos.join(' o ')}.`
      );
    }
    return siguiente();
  };
}

module.exports = verificarRol;
