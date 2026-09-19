/**
 * Controlador de autenticación del SGSU.
 * Registro público de clientes, inicio de sesión y consulta del propio perfil.
 */
const contrasenas = require('../utilidades/contrasenas');
const limiteIntentos = require('../middleware/limiteIntentos');

const usuarioModelo = require('../modelos/usuarioModelo');
const { generarToken, DURACION_TOKEN } = require('../middleware/verificarToken');
const { validarUsuario, validarInicioSesion } = require('../utilidades/validaciones');
const { exito, error } = require('../utilidades/respuestas');

/**
 * POST /api/autenticacion/registro
 * Registro público. Siempre crea el usuario con rol "cliente": los roles
 * de técnico y administrador solo los asigna un administrador.
 */
async function registrar(peticion, respuesta, siguiente) {
  try {
  const errores = validarUsuario(peticion.body);
  if (errores.length) {
    return error(respuesta, 400, 'Los datos enviados no son válidos.', errores);
  }

  const { nombreCompleto, documento, correo, nombreUsuario, contrasena, telefono } = peticion.body;

  const duplicado = usuarioModelo.existeDuplicado({ correo, documento, nombreUsuario });
  if (duplicado) {
    let campo = 'nombre de usuario';
    if (duplicado.correo === correo) campo = 'correo electrónico';
    else if (duplicado.documento === documento) campo = 'documento';
    return error(respuesta, 409, `Ya existe un usuario registrado con ese ${campo}.`);
  }

  const rolCliente = usuarioModelo.buscarRolPorNombre('cliente');
  const usuario = usuarioModelo.crear({
    nombreCompleto, documento, correo, nombreUsuario, telefono,
    contrasenaHash: await contrasenas.calcularHash(contrasena),
    idRol: rolCliente.id,
  });

  return exito(respuesta, 201, { usuario }, 'Usuario registrado correctamente.');
  } catch (e) {
    return siguiente(e);
  }
}

/**
 * POST /api/autenticacion/login
 * Devuelve el token de sesión si las credenciales son correctas.
 */
async function iniciarSesion(peticion, respuesta, siguiente) {
  try {
    const errores = validarInicioSesion(peticion.body);
    if (errores.length) {
      return error(respuesta, 400, 'Los datos enviados no son válidos.', errores);
    }

    const { nombreUsuario, contrasena } = peticion.body;
    const ip = peticion.ip;

    // NF-02: si ya hubo demasiados fallos, ni siquiera se compara la contraseña.
    const espera = limiteIntentos.segundosBloqueo(ip, nombreUsuario);
    if (espera > 0) {
      respuesta.set('Retry-After', String(espera));
      return error(respuesta, 429,
        `Demasiados intentos fallidos. Espere ${Math.ceil(espera / 60)} minutos e intente de nuevo.`);
    }

    const usuario = usuarioModelo.buscarPorNombreUsuarioConClave(nombreUsuario);

    // Se responde igual si el usuario no existe y si la contraseña está mala,
    // para no revelar qué nombres de usuario están registrados.
    // NF-01: la comparación corre en un hilo de trabajo y no bloquea el servidor.
    const credencialCorrecta =
      Boolean(usuario) && await contrasenas.comparar(contrasena, usuario.contrasena_hash);

    if (!credencialCorrecta) {
      limiteIntentos.registrarFallo(ip, nombreUsuario);
      return error(respuesta, 401, 'Error en la autenticación: usuario o contraseña incorrectos.');
    }
    limiteIntentos.reiniciar(ip, nombreUsuario);
    if (usuario.estado !== 'activo') {
      return error(respuesta, 403, 'La cuenta se encuentra inactiva. Comuníquese con el administrador.');
    }

    return exito(respuesta, 200, {
      token: generarToken(usuario),
      expiraEn: DURACION_TOKEN,
      usuario: usuarioModelo.buscarPorId(usuario.id),
    }, 'Autenticación satisfactoria.');
  } catch (e) {
    return siguiente(e);
  }
}

/**
 * GET /api/autenticacion/perfil
 * Datos del usuario dueño del token.
 */
function consultarPerfil(peticion, respuesta) {
  const usuario = usuarioModelo.buscarPorId(peticion.usuario.id);
  if (!usuario) {
    return error(respuesta, 404, 'El usuario del token ya no existe.');
  }
  return exito(respuesta, 200, { usuario });
}

module.exports = { registrar, iniciarSesion, consultarPerfil };
