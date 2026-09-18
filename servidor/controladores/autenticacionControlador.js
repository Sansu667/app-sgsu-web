/**
 * Controlador de autenticación del SGSU.
 * Registro público de clientes, inicio de sesión y consulta del propio perfil.
 */
const bcrypt = require('bcryptjs');

const usuarioModelo = require('../modelos/usuarioModelo');
const { generarToken, DURACION_TOKEN } = require('../middleware/verificarToken');
const { validarUsuario, validarInicioSesion } = require('../utilidades/validaciones');
const { exito, error } = require('../utilidades/respuestas');

const RONDAS_SAL = 10;

/**
 * POST /api/autenticacion/registro
 * Registro público. Siempre crea el usuario con rol "cliente": los roles
 * de técnico y administrador solo los asigna un administrador.
 */
function registrar(peticion, respuesta) {
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
    contrasenaHash: bcrypt.hashSync(contrasena, RONDAS_SAL),
    idRol: rolCliente.id,
  });

  return exito(respuesta, 201, { usuario }, 'Usuario registrado correctamente.');
}

/**
 * POST /api/autenticacion/login
 * Devuelve el token de sesión si las credenciales son correctas.
 */
function iniciarSesion(peticion, respuesta) {
  const errores = validarInicioSesion(peticion.body);
  if (errores.length) {
    return error(respuesta, 400, 'Los datos enviados no son válidos.', errores);
  }

  const { nombreUsuario, contrasena } = peticion.body;
  const usuario = usuarioModelo.buscarPorNombreUsuarioConClave(nombreUsuario);

  // Se responde igual si el usuario no existe y si la contraseña está mala,
  // para no revelar qué nombres de usuario están registrados.
  const credencialCorrecta =
    usuario && bcrypt.compareSync(contrasena, usuario.contrasena_hash);

  if (!credencialCorrecta) {
    return error(respuesta, 401, 'Error en la autenticación: usuario o contraseña incorrectos.');
  }
  if (usuario.estado !== 'activo') {
    return error(respuesta, 403, 'La cuenta se encuentra inactiva. Comuníquese con el administrador.');
  }

  return exito(respuesta, 200, {
    token: generarToken(usuario),
    expiraEn: DURACION_TOKEN,
    usuario: usuarioModelo.buscarPorId(usuario.id),
  }, 'Autenticación satisfactoria.');
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
