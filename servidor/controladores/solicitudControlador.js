/**
 * Controlador de las solicitudes de servicio: es el núcleo del proyecto.
 *
 * Reglas de negocio que se aplican aquí:
 *  - El cliente solo ve y edita sus propias solicitudes.
 *  - El técnico solo ve las que tiene asignadas.
 *  - El administrador ve todas.
 *  - El estado solo avanza por las transiciones permitidas.
 *  - Todo cambio de estado queda registrado en la bitácora.
 */
const solicitudModelo = require('../modelos/solicitudModelo');
const servicioModelo = require('../modelos/servicioModelo');
const usuarioModelo = require('../modelos/usuarioModelo');
const { validarSolicitud, transicionValida, TRANSICIONES } = require('../utilidades/validaciones');
const { exito, error } = require('../utilidades/respuestas');

/** Decide si el usuario del token puede ver una solicitud concreta. */
function puedeVer(usuario, solicitud) {
  if (usuario.rol === 'administrador') return true;
  if (usuario.rol === 'cliente') return solicitud.id_usuario === usuario.id;
  return solicitud.id_tecnico === usuario.id;
}

/** POST /api/solicitudes — el cliente radica una solicitud. */
function crear(peticion, respuesta) {
  const errores = validarSolicitud(peticion.body);
  if (errores.length) {
    return error(respuesta, 400, 'Los datos enviados no son válidos.', errores);
  }

  const servicio = servicioModelo.buscarPorId(Number(peticion.body.idServicio));
  if (!servicio) {
    return error(respuesta, 404, 'El servicio indicado no existe en el catálogo.');
  }
  if (!servicio.activo) {
    return error(respuesta, 409, 'El servicio indicado está desactivado y no admite solicitudes nuevas.');
  }

  const solicitud = solicitudModelo.crear({
    idUsuario: peticion.usuario.id,
    idServicio: servicio.id,
    descripcion: peticion.body.descripcion,
    direccion: peticion.body.direccion,
    prioridad: peticion.body.prioridad,
    fechaProgramada: peticion.body.fechaProgramada,
  });

  return exito(respuesta, 201, { solicitud }, 'Solicitud registrada correctamente.');
}

/** GET /api/solicitudes — listado filtrado según el rol de quien consulta. */
function listar(peticion, respuesta) {
  const filtros = {
    estado: peticion.query.estado,
    prioridad: peticion.query.prioridad,
    idServicio: peticion.query.idServicio,
    desde: peticion.query.desde,
    hasta: peticion.query.hasta,
    pagina: peticion.query.pagina,
    tamano: peticion.query.tamano,
  };

  // El rol acota el listado: el filtro no se puede sobrescribir desde la URL.
  if (peticion.usuario.rol === 'cliente') {
    filtros.idUsuario = peticion.usuario.id;
  } else if (peticion.usuario.rol === 'tecnico') {
    filtros.idTecnico = peticion.usuario.id;
  } else {
    filtros.idUsuario = peticion.query.idUsuario;
    filtros.idTecnico = peticion.query.idTecnico;
  }

  const resultado = solicitudModelo.listar(filtros);
  return exito(respuesta, 200, {
    total: resultado.total,
    pagina: resultado.pagina,
    tamano: resultado.tamano,
    solicitudes: resultado.registros,
  });
}

/** GET /api/solicitudes/:id */
function consultarPorId(peticion, respuesta) {
  const solicitud = solicitudModelo.buscarPorId(Number(peticion.params.id));
  if (!solicitud) return error(respuesta, 404, 'No existe una solicitud con ese identificador.');
  if (!puedeVer(peticion.usuario, solicitud)) {
    return error(respuesta, 403, 'Acceso denegado: esta solicitud no le pertenece.');
  }
  return exito(respuesta, 200, { solicitud });
}

/** PUT /api/solicitudes/:id — el cliente corrige su solicitud antes de que la asignen. */
function actualizar(peticion, respuesta) {
  const solicitud = solicitudModelo.buscarPorId(Number(peticion.params.id));
  if (!solicitud) return error(respuesta, 404, 'No existe una solicitud con ese identificador.');

  if (peticion.usuario.rol === 'cliente' && solicitud.id_usuario !== peticion.usuario.id) {
    return error(respuesta, 403, 'Acceso denegado: esta solicitud no le pertenece.');
  }
  if (solicitud.estado !== 'registrada') {
    return error(respuesta, 409,
      `Solo se puede editar una solicitud en estado "registrada"; esta se encuentra en "${solicitud.estado}".`);
  }

  const errores = validarSolicitud(peticion.body);
  if (errores.length) {
    return error(respuesta, 400, 'Los datos enviados no son válidos.', errores);
  }
  const servicio = servicioModelo.buscarPorId(Number(peticion.body.idServicio));
  if (!servicio) return error(respuesta, 404, 'El servicio indicado no existe en el catálogo.');

  const actualizada = solicitudModelo.actualizar(solicitud.id, {
    idServicio: servicio.id,
    descripcion: peticion.body.descripcion,
    direccion: peticion.body.direccion,
    prioridad: peticion.body.prioridad || solicitud.prioridad,
    fechaProgramada: peticion.body.fechaProgramada,
  });
  solicitudModelo.registrarBitacora({
    idSolicitud: solicitud.id,
    idUsuario: peticion.usuario.id,
    estadoAnterior: solicitud.estado,
    estadoNuevo: solicitud.estado,
    comentario: 'El cliente corrigió los datos de la solicitud.',
  });

  return exito(respuesta, 200, { solicitud: actualizada }, 'Solicitud actualizada correctamente.');
}

/** PATCH /api/solicitudes/:id/asignar — el administrador asigna un técnico. */
function asignarTecnico(peticion, respuesta) {
  const solicitud = solicitudModelo.buscarPorId(Number(peticion.params.id));
  if (!solicitud) return error(respuesta, 404, 'No existe una solicitud con ese identificador.');

  const idTecnico = Number((peticion.body || {}).idTecnico);
  if (!Number.isInteger(idTecnico) || idTecnico <= 0) {
    return error(respuesta, 400, 'El identificador del técnico es obligatorio y debe ser un entero positivo.');
  }

  const tecnico = usuarioModelo.buscarPorId(idTecnico);
  if (!tecnico) return error(respuesta, 404, 'No existe un usuario con ese identificador.');
  if (tecnico.rol !== 'tecnico') {
    return error(respuesta, 409, 'El usuario indicado no tiene el rol de técnico.');
  }
  if (tecnico.estado !== 'activo') {
    return error(respuesta, 409, 'El técnico indicado está inactivo.');
  }
  if (!transicionValida(solicitud.estado, 'asignada')) {
    return error(respuesta, 409,
      `No se puede asignar una solicitud que está en estado "${solicitud.estado}".`);
  }

  const actualizada = solicitudModelo.asignarTecnico(solicitud.id, idTecnico);
  solicitudModelo.registrarBitacora({
    idSolicitud: solicitud.id,
    idUsuario: peticion.usuario.id,
    estadoAnterior: solicitud.estado,
    estadoNuevo: 'asignada',
    comentario: `Solicitud asignada al técnico ${tecnico.nombre_completo}.`,
  });

  return exito(respuesta, 200, { solicitud: actualizada },
    'Solicitud asignada correctamente.');
}

/** PATCH /api/solicitudes/:id/estado — avanza el estado de la solicitud. */
function cambiarEstado(peticion, respuesta) {
  const solicitud = solicitudModelo.buscarPorId(Number(peticion.params.id));
  if (!solicitud) return error(respuesta, 404, 'No existe una solicitud con ese identificador.');

  const { estado, comentario } = peticion.body || {};
  if (!estado) {
    return error(respuesta, 400, 'El estado nuevo es obligatorio.');
  }
  if (peticion.usuario.rol === 'tecnico' && solicitud.id_tecnico !== peticion.usuario.id) {
    return error(respuesta, 403, 'Acceso denegado: esta solicitud no está asignada a usted.');
  }
  if (!transicionValida(solicitud.estado, estado)) {
    const permitidos = TRANSICIONES[solicitud.estado] || [];
    return error(respuesta, 409,
      `No se puede pasar de "${solicitud.estado}" a "${estado}". ` +
      (permitidos.length
        ? `Desde "${solicitud.estado}" solo se permite: ${permitidos.join(', ')}.`
        : `El estado "${solicitud.estado}" es final.`));
  }
  if (estado === 'cerrada' && peticion.usuario.rol === 'tecnico') {
    return error(respuesta, 403, 'El cierre de la solicitud lo realiza el administrador.');
  }

  const actualizada = solicitudModelo.cambiarEstado(solicitud.id, estado, comentario);
  solicitudModelo.registrarBitacora({
    idSolicitud: solicitud.id,
    idUsuario: peticion.usuario.id,
    estadoAnterior: solicitud.estado,
    estadoNuevo: estado,
    comentario: comentario || null,
  });

  return exito(respuesta, 200, { solicitud: actualizada },
    `La solicitud pasó de "${solicitud.estado}" a "${estado}".`);
}

/** GET /api/solicitudes/:id/bitacora — trazabilidad de la solicitud. */
function consultarBitacora(peticion, respuesta) {
  const solicitud = solicitudModelo.buscarPorId(Number(peticion.params.id));
  if (!solicitud) return error(respuesta, 404, 'No existe una solicitud con ese identificador.');
  if (!puedeVer(peticion.usuario, solicitud)) {
    return error(respuesta, 403, 'Acceso denegado: esta solicitud no le pertenece.');
  }

  const movimientos = solicitudModelo.listarBitacora(solicitud.id);
  return exito(respuesta, 200, {
    idSolicitud: solicitud.id,
    codigo: solicitud.codigo,
    total: movimientos.length,
    movimientos,
  });
}

/** DELETE /api/solicitudes/:id — borrado físico, reservado al administrador. */
function eliminar(peticion, respuesta) {
  const solicitud = solicitudModelo.buscarPorId(Number(peticion.params.id));
  if (!solicitud) return error(respuesta, 404, 'No existe una solicitud con ese identificador.');

  solicitudModelo.eliminar(solicitud.id);
  return exito(respuesta, 200, { idEliminado: solicitud.id },
    'Solicitud eliminada correctamente junto con su bitácora.');
}

module.exports = {
  crear, listar, consultarPorId, actualizar,
  asignarTecnico, cambiarEstado, consultarBitacora, eliminar,
};
