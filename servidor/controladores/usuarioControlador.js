/**
 * Controlador de la gestión de usuarios. Todas las operaciones de este
 * archivo son de uso exclusivo del administrador.
 */
const bcrypt = require('bcryptjs');

const usuarioModelo = require('../modelos/usuarioModelo');
const { validarUsuario } = require('../utilidades/validaciones');
const { exito, error } = require('../utilidades/respuestas');

const RONDAS_SAL = 10;

/** GET /api/usuarios — lista con filtros y paginación. */
function listar(peticion, respuesta) {
  const { rol, estado, busqueda, pagina, tamano } = peticion.query;
  const resultado = usuarioModelo.listar({ rol, estado, busqueda, pagina, tamano });
  return exito(respuesta, 200, {
    total: resultado.total,
    pagina: resultado.pagina,
    tamano: resultado.tamano,
    usuarios: resultado.registros,
  });
}

/** GET /api/usuarios/:id */
function consultarPorId(peticion, respuesta) {
  const usuario = usuarioModelo.buscarPorId(Number(peticion.params.id));
  if (!usuario) return error(respuesta, 404, 'No existe un usuario con ese identificador.');
  return exito(respuesta, 200, { usuario });
}

/** POST /api/usuarios — el administrador crea usuarios con cualquier rol. */
function crear(peticion, respuesta) {
  const errores = validarUsuario(peticion.body);
  const { rol } = peticion.body || {};
  const rolEncontrado = rol ? usuarioModelo.buscarRolPorNombre(rol) : null;

  if (!rolEncontrado) {
    errores.push('El rol es obligatorio y debe ser administrador, tecnico o cliente.');
  }
  if (errores.length) {
    return error(respuesta, 400, 'Los datos enviados no son válidos.', errores);
  }

  const { nombreCompleto, documento, correo, nombreUsuario, contrasena, telefono } = peticion.body;
  if (usuarioModelo.existeDuplicado({ correo, documento, nombreUsuario })) {
    return error(respuesta, 409,
      'Ya existe un usuario con ese correo, documento o nombre de usuario.');
  }

  const usuario = usuarioModelo.crear({
    nombreCompleto, documento, correo, nombreUsuario, telefono,
    contrasenaHash: bcrypt.hashSync(contrasena, RONDAS_SAL),
    idRol: rolEncontrado.id,
  });
  return exito(respuesta, 201, { usuario }, 'Usuario creado correctamente.');
}

/** PUT /api/usuarios/:id — actualiza los datos del usuario. */
function actualizar(peticion, respuesta) {
  const id = Number(peticion.params.id);
  const existente = usuarioModelo.buscarPorId(id);
  if (!existente) return error(respuesta, 404, 'No existe un usuario con ese identificador.');

  const cuerpo = { ...peticion.body, nombreUsuario: existente.nombre_usuario };
  const errores = validarUsuario(cuerpo, { exigirContrasena: false });

  const rol = peticion.body && peticion.body.rol;
  const rolEncontrado = rol ? usuarioModelo.buscarRolPorNombre(rol) : { id: existente.id_rol };
  if (!rolEncontrado) {
    errores.push('El rol debe ser administrador, tecnico o cliente.');
  }
  if (errores.length) {
    return error(respuesta, 400, 'Los datos enviados no son válidos.', errores);
  }

  const duplicado = usuarioModelo.existeDuplicado({
    correo: cuerpo.correo, documento: cuerpo.documento,
    nombreUsuario: existente.nombre_usuario, idExcluido: id,
  });
  if (duplicado) {
    return error(respuesta, 409, 'Otro usuario ya tiene ese correo o ese documento.');
  }

  const usuario = usuarioModelo.actualizar(id, {
    nombreCompleto: cuerpo.nombreCompleto,
    correo: cuerpo.correo,
    telefono: cuerpo.telefono,
    idRol: rolEncontrado.id,
  });
  return exito(respuesta, 200, { usuario }, 'Usuario actualizado correctamente.');
}

/** PATCH /api/usuarios/:id/estado — activa o inactiva la cuenta. */
function cambiarEstado(peticion, respuesta) {
  const id = Number(peticion.params.id);
  const { estado } = peticion.body || {};

  if (!['activo', 'inactivo'].includes(estado)) {
    return error(respuesta, 400, 'El estado debe ser activo o inactivo.');
  }
  if (!usuarioModelo.buscarPorId(id)) {
    return error(respuesta, 404, 'No existe un usuario con ese identificador.');
  }
  if (id === peticion.usuario.id && estado === 'inactivo') {
    return error(respuesta, 409, 'Un administrador no puede inactivar su propia cuenta.');
  }

  const usuario = usuarioModelo.cambiarEstado(id, estado);
  return exito(respuesta, 200, { usuario }, `La cuenta quedó en estado ${estado}.`);
}

/** DELETE /api/usuarios/:id — solo si el usuario no tiene solicitudes asociadas. */
function eliminar(peticion, respuesta) {
  const id = Number(peticion.params.id);
  if (!usuarioModelo.buscarPorId(id)) {
    return error(respuesta, 404, 'No existe un usuario con ese identificador.');
  }
  if (id === peticion.usuario.id) {
    return error(respuesta, 409, 'Un administrador no puede eliminar su propia cuenta.');
  }

  const relacionadas = usuarioModelo.contarSolicitudesRelacionadas(id);
  if (relacionadas > 0) {
    return error(respuesta, 409,
      `No se puede eliminar: el usuario tiene ${relacionadas} solicitud(es) asociadas. ` +
      'Inactive la cuenta en lugar de borrarla.');
  }

  usuarioModelo.eliminar(id);
  return exito(respuesta, 200, { idEliminado: id }, 'Usuario eliminado correctamente.');
}

/** GET /api/usuarios/roles — catálogo de roles del sistema. */
function listarRoles(peticion, respuesta) {
  return exito(respuesta, 200, { roles: usuarioModelo.listarRoles() });
}

module.exports = { listar, consultarPorId, crear, actualizar, cambiarEstado, eliminar, listarRoles };
