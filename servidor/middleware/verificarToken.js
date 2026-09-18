/**
 * Middleware de autenticación: valida el token JWT que viaja en el
 * encabezado Authorization con el esquema Bearer.
 */
const jwt = require('jsonwebtoken');
const { error } = require('../utilidades/respuestas');

const LLAVE_SECRETA = process.env.LLAVE_SECRETA || 'clave_de_desarrollo_sgsu_aa5_ev03';
const DURACION_TOKEN = process.env.DURACION_TOKEN || '4h';

/** Genera el token de sesión de un usuario. */
function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nombreUsuario: usuario.nombre_usuario, rol: usuario.rol },
    LLAVE_SECRETA,
    { expiresIn: DURACION_TOKEN }
  );
}

/** Exige un token válido. Deja los datos del usuario en peticion.usuario. */
function verificarToken(peticion, respuesta, siguiente) {
  const encabezado = peticion.headers.authorization || '';

  if (!encabezado.startsWith('Bearer ')) {
    return error(respuesta, 401, 'Acceso no autorizado: falta el token de autenticación.');
  }

  try {
    peticion.usuario = jwt.verify(encabezado.slice(7).trim(), LLAVE_SECRETA);
    return siguiente();
  } catch (e) {
    const mensaje = e.name === 'TokenExpiredError'
      ? 'Acceso no autorizado: el token ya expiró.'
      : 'Acceso no autorizado: el token no es válido.';
    return error(respuesta, 401, mensaje);
  }
}

module.exports = { verificarToken, generarToken, LLAVE_SECRETA, DURACION_TOKEN };
