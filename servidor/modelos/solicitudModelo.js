/**
 * Modelo de las solicitudes de servicio y de su bitácora de cambios.
 */
const { baseDatos } = require('../configuracion/baseDatos');

// Consulta base: la solicitud siempre viaja con el nombre del cliente,
// del servicio y del técnico, para que el cliente de la API no tenga
// que hacer una petición adicional por cada dato.
const SELECCION = `
  SELECT s.id, s.codigo, s.descripcion, s.direccion, s.prioridad, s.estado,
         s.fecha_creacion, s.fecha_programada, s.fecha_cierre, s.observacion_cierre,
         s.id_usuario, c.nombre_completo AS cliente,
         s.id_servicio, sv.nombre AS servicio, sv.categoria, sv.precio_base,
         s.id_tecnico, t.nombre_completo AS tecnico
    FROM solicitud s
    JOIN usuario c  ON c.id = s.id_usuario
    JOIN servicio sv ON sv.id = s.id_servicio
    LEFT JOIN usuario t ON t.id = s.id_tecnico
`;

/** Genera el consecutivo del código de la solicitud: SOL-2026-0001. */
function siguienteCodigo() {
  const anio = new Date().getFullYear();
  const fila = baseDatos
    .prepare("SELECT COUNT(*) AS n FROM solicitud WHERE codigo LIKE ?")
    .get(`SOL-${anio}-%`);
  return `SOL-${anio}-${String(fila.n + 1).padStart(4, '0')}`;
}

/** Inserta una solicitud nueva y registra el primer movimiento en la bitácora. */
function crear(solicitud) {
  const codigo = siguienteCodigo();
  const resultado = baseDatos.prepare(`
    INSERT INTO solicitud (codigo, id_usuario, id_servicio, descripcion,
                           direccion, prioridad, fecha_programada)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(codigo, solicitud.idUsuario, solicitud.idServicio, solicitud.descripcion,
         solicitud.direccion, solicitud.prioridad || 'media',
         solicitud.fechaProgramada || null);

  const id = Number(resultado.lastInsertRowid);
  registrarBitacora({
    idSolicitud: id,
    idUsuario: solicitud.idUsuario,
    estadoAnterior: null,
    estadoNuevo: 'registrada',
    comentario: 'Solicitud creada por el cliente.',
  });
  return buscarPorId(id);
}

/** Busca una solicitud por su identificador. */
function buscarPorId(id) {
  return baseDatos.prepare(`${SELECCION} WHERE s.id = ?`).get(id);
}

/**
 * Lista solicitudes con filtros y paginación.
 * @param {{estado?: string, prioridad?: string, idServicio?: number,
 *          idUsuario?: number, idTecnico?: number, desde?: string, hasta?: string,
 *          pagina?: number, tamano?: number}} filtros
 */
function listar(filtros = {}) {
  const condiciones = [];
  const valores = [];

  const igual = (campo, valor) => {
    if (valor !== undefined && valor !== null && valor !== '') {
      condiciones.push(`${campo} = ?`);
      valores.push(valor);
    }
  };

  igual('s.estado', filtros.estado);
  igual('s.prioridad', filtros.prioridad);
  igual('s.id_servicio', filtros.idServicio);
  igual('s.id_usuario', filtros.idUsuario);
  igual('s.id_tecnico', filtros.idTecnico);

  if (filtros.desde) {
    condiciones.push('date(s.fecha_creacion) >= date(?)');
    valores.push(filtros.desde);
  }
  if (filtros.hasta) {
    condiciones.push('date(s.fecha_creacion) <= date(?)');
    valores.push(filtros.hasta);
  }

  const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const tamano = Math.min(Math.max(Number(filtros.tamano) || 20, 1), 100);
  const pagina = Math.max(Number(filtros.pagina) || 1, 1);

  const total = baseDatos
    .prepare(`SELECT COUNT(*) AS n FROM solicitud s ${donde}`)
    .get(...valores).n;

  const registros = baseDatos
    .prepare(`${SELECCION} ${donde} ORDER BY s.id DESC LIMIT ? OFFSET ?`)
    .all(...valores, tamano, (pagina - 1) * tamano);

  return { total, pagina, tamano, registros };
}

/** Actualiza los datos que el cliente puede corregir mientras está registrada. */
function actualizar(id, datos) {
  baseDatos.prepare(`
    UPDATE solicitud
       SET id_servicio = ?, descripcion = ?, direccion = ?,
           prioridad = ?, fecha_programada = ?
     WHERE id = ?
  `).run(datos.idServicio, datos.descripcion, datos.direccion,
         datos.prioridad, datos.fechaProgramada || null, id);
  return buscarPorId(id);
}

/** Asigna un técnico y deja la solicitud en estado "asignada". */
function asignarTecnico(id, idTecnico) {
  baseDatos
    .prepare("UPDATE solicitud SET id_tecnico = ?, estado = 'asignada' WHERE id = ?")
    .run(idTecnico, id);
  return buscarPorId(id);
}

/** Cambia el estado de la solicitud y cierra las fechas cuando corresponde. */
function cambiarEstado(id, estadoNuevo, observacion) {
  const cierra = estadoNuevo === 'cerrada' || estadoNuevo === 'cancelada';
  baseDatos.prepare(`
    UPDATE solicitud
       SET estado = ?,
           fecha_cierre = CASE WHEN ? = 1 THEN datetime('now','localtime') ELSE fecha_cierre END,
           observacion_cierre = COALESCE(?, observacion_cierre)
     WHERE id = ?
  `).run(estadoNuevo, cierra ? 1 : 0, observacion || null, id);
  return buscarPorId(id);
}

/** Elimina una solicitud junto con su bitácora. */
function eliminar(id) {
  baseDatos.prepare('DELETE FROM bitacora WHERE id_solicitud = ?').run(id);
  return Number(baseDatos.prepare('DELETE FROM solicitud WHERE id = ?').run(id).changes);
}

/** Agrega un movimiento a la bitácora de la solicitud. */
function registrarBitacora({ idSolicitud, idUsuario, estadoAnterior, estadoNuevo, comentario }) {
  baseDatos.prepare(`
    INSERT INTO bitacora (id_solicitud, id_usuario, estado_anterior, estado_nuevo, comentario)
    VALUES (?, ?, ?, ?, ?)
  `).run(idSolicitud, idUsuario, estadoAnterior, estadoNuevo, comentario || null);
}

/** Devuelve la bitácora completa de una solicitud, del movimiento más viejo al más nuevo. */
function listarBitacora(idSolicitud) {
  return baseDatos.prepare(`
    SELECT b.id, b.estado_anterior, b.estado_nuevo, b.comentario, b.fecha,
           b.id_usuario, u.nombre_completo AS usuario
      FROM bitacora b
      JOIN usuario u ON u.id = b.id_usuario
     WHERE b.id_solicitud = ?
     ORDER BY b.id
  `).all(idSolicitud);
}

// ---------------------------------------------------------------- reportes

/** Cuenta las solicitudes agrupadas por estado. */
function contarPorEstado() {
  return baseDatos.prepare(`
    SELECT estado, COUNT(*) AS total FROM solicitud GROUP BY estado ORDER BY total DESC
  `).all();
}

/** Devuelve los servicios más solicitados. */
function serviciosMasSolicitados(limite = 10) {
  return baseDatos.prepare(`
    SELECT sv.id, sv.codigo, sv.nombre, sv.categoria,
           COUNT(s.id) AS total_solicitudes,
           ROUND(SUM(sv.precio_base), 2) AS ingreso_estimado
      FROM solicitud s
      JOIN servicio sv ON sv.id = s.id_servicio
     GROUP BY sv.id
     ORDER BY total_solicitudes DESC, sv.nombre
     LIMIT ?
  `).all(limite);
}

/** Devuelve la carga de trabajo por técnico. */
function cargaPorTecnico() {
  return baseDatos.prepare(`
    SELECT t.id, t.nombre_completo AS tecnico,
           COUNT(s.id) AS total_asignadas,
           SUM(CASE WHEN s.estado IN ('asignada','en_proceso') THEN 1 ELSE 0 END) AS abiertas,
           SUM(CASE WHEN s.estado IN ('resuelta','cerrada') THEN 1 ELSE 0 END) AS finalizadas
      FROM usuario t
      JOIN rol r ON r.id = t.id_rol AND r.nombre = 'tecnico'
      LEFT JOIN solicitud s ON s.id_tecnico = t.id
     GROUP BY t.id
     ORDER BY abiertas DESC, t.nombre_completo
  `).all();
}

module.exports = {
  crear,
  buscarPorId,
  listar,
  actualizar,
  asignarTecnico,
  cambiarEstado,
  eliminar,
  registrarBitacora,
  listarBitacora,
  contarPorEstado,
  serviciosMasSolicitados,
  cargaPorTecnico,
};
