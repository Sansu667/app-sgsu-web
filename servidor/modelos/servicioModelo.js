/**
 * Modelo del catálogo de servicios que ofrece la empresa.
 */
const { baseDatos } = require('../configuracion/baseDatos');

/** Inserta un servicio nuevo y devuelve el registro creado. */
function crear(servicio) {
  const resultado = baseDatos.prepare(`
    INSERT INTO servicio (codigo, nombre, descripcion, categoria,
                          precio_base, tiempo_estimado_horas, activo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(servicio.codigo, servicio.nombre, servicio.descripcion, servicio.categoria,
         servicio.precioBase, servicio.tiempoEstimadoHoras,
         servicio.activo === false ? 0 : 1);
  return buscarPorId(Number(resultado.lastInsertRowid));
}

/** Busca un servicio por su identificador. */
function buscarPorId(id) {
  return baseDatos.prepare('SELECT * FROM servicio WHERE id = ?').get(id);
}

/** Busca un servicio por su código de catálogo. */
function buscarPorCodigo(codigo, idExcluido = 0) {
  return baseDatos
    .prepare('SELECT * FROM servicio WHERE codigo = ? AND id <> ?')
    .get(codigo, idExcluido);
}

/**
 * Lista servicios con filtros opcionales.
 * @param {{categoria?: string, activo?: string, busqueda?: string}} filtros
 */
function listar(filtros = {}) {
  const condiciones = [];
  const valores = [];

  if (filtros.categoria) {
    condiciones.push('categoria = ?');
    valores.push(filtros.categoria);
  }
  if (filtros.activo === 'true' || filtros.activo === 'false') {
    condiciones.push('activo = ?');
    valores.push(filtros.activo === 'true' ? 1 : 0);
  }
  if (filtros.busqueda) {
    condiciones.push('(nombre LIKE ? OR descripcion LIKE ? OR codigo LIKE ?)');
    const patron = `%${filtros.busqueda}%`;
    valores.push(patron, patron, patron);
  }

  const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  return baseDatos
    .prepare(`SELECT * FROM servicio ${donde} ORDER BY categoria, nombre`)
    .all(...valores);
}

/** Devuelve la lista de categorías distintas del catálogo. */
function listarCategorias() {
  return baseDatos
    .prepare('SELECT DISTINCT categoria FROM servicio ORDER BY categoria')
    .all()
    .map((fila) => fila.categoria);
}

/** Actualiza un servicio completo. */
function actualizar(id, servicio) {
  baseDatos.prepare(`
    UPDATE servicio
       SET codigo = ?, nombre = ?, descripcion = ?, categoria = ?,
           precio_base = ?, tiempo_estimado_horas = ?, activo = ?
     WHERE id = ?
  `).run(servicio.codigo, servicio.nombre, servicio.descripcion, servicio.categoria,
         servicio.precioBase, servicio.tiempoEstimadoHoras,
         servicio.activo === false ? 0 : 1, id);
  return buscarPorId(id);
}

/** Elimina un servicio. Devuelve cuántas filas se afectaron. */
function eliminar(id) {
  return Number(baseDatos.prepare('DELETE FROM servicio WHERE id = ?').run(id).changes);
}

/** Cuenta cuántas solicitudes usan un servicio, para no borrarlo si está en uso. */
function contarSolicitudes(id) {
  return baseDatos
    .prepare('SELECT COUNT(*) AS n FROM solicitud WHERE id_servicio = ?')
    .get(id).n;
}

module.exports = {
  crear,
  buscarPorId,
  buscarPorCodigo,
  listar,
  listarCategorias,
  actualizar,
  eliminar,
  contarSolicitudes,
};
