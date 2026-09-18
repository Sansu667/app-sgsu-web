/**
 * Controlador del catálogo de servicios.
 * La consulta la puede hacer cualquier usuario autenticado; crear, editar
 * y eliminar es exclusivo del administrador.
 */
const servicioModelo = require('../modelos/servicioModelo');
const { validarServicio } = require('../utilidades/validaciones');
const { exito, error } = require('../utilidades/respuestas');

/** GET /api/servicios — catálogo con filtros. */
function listar(peticion, respuesta) {
  const { categoria, activo, busqueda } = peticion.query;
  const servicios = servicioModelo.listar({ categoria, activo, busqueda });
  return exito(respuesta, 200, { total: servicios.length, servicios });
}

/** GET /api/servicios/categorias — categorías disponibles. */
function listarCategorias(peticion, respuesta) {
  return exito(respuesta, 200, { categorias: servicioModelo.listarCategorias() });
}

/** GET /api/servicios/:id */
function consultarPorId(peticion, respuesta) {
  const servicio = servicioModelo.buscarPorId(Number(peticion.params.id));
  if (!servicio) return error(respuesta, 404, 'No existe un servicio con ese identificador.');
  return exito(respuesta, 200, { servicio });
}

/** POST /api/servicios — crea un servicio del catálogo. */
function crear(peticion, respuesta) {
  const errores = validarServicio(peticion.body);
  if (errores.length) {
    return error(respuesta, 400, 'Los datos enviados no son válidos.', errores);
  }
  if (servicioModelo.buscarPorCodigo(peticion.body.codigo)) {
    return error(respuesta, 409, 'Ya existe un servicio con ese código.');
  }

  const servicio = servicioModelo.crear(peticion.body);
  return exito(respuesta, 201, { servicio }, 'Servicio creado correctamente.');
}

/** PUT /api/servicios/:id — actualiza un servicio completo. */
function actualizar(peticion, respuesta) {
  const id = Number(peticion.params.id);
  if (!servicioModelo.buscarPorId(id)) {
    return error(respuesta, 404, 'No existe un servicio con ese identificador.');
  }

  const errores = validarServicio(peticion.body);
  if (errores.length) {
    return error(respuesta, 400, 'Los datos enviados no son válidos.', errores);
  }
  if (servicioModelo.buscarPorCodigo(peticion.body.codigo, id)) {
    return error(respuesta, 409, 'Otro servicio ya usa ese código.');
  }

  const servicio = servicioModelo.actualizar(id, peticion.body);
  return exito(respuesta, 200, { servicio }, 'Servicio actualizado correctamente.');
}

/** DELETE /api/servicios/:id — solo si ninguna solicitud lo usa. */
function eliminar(peticion, respuesta) {
  const id = Number(peticion.params.id);
  if (!servicioModelo.buscarPorId(id)) {
    return error(respuesta, 404, 'No existe un servicio con ese identificador.');
  }

  const usos = servicioModelo.contarSolicitudes(id);
  if (usos > 0) {
    return error(respuesta, 409,
      `No se puede eliminar: el servicio está usado por ${usos} solicitud(es). ` +
      'Desactívelo en lugar de borrarlo.');
  }

  servicioModelo.eliminar(id);
  return exito(respuesta, 200, { idEliminado: id }, 'Servicio eliminado correctamente.');
}

module.exports = { listar, listarCategorias, consultarPorId, crear, actualizar, eliminar };
