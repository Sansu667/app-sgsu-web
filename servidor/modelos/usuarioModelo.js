/**
 * Modelo de usuario y de rol.
 * Concentra las consultas SQL sobre las tablas usuario y rol.
 */
const { baseDatos } = require('../configuracion/baseDatos');

// Campos que se pueden devolver hacia afuera: nunca incluyen la contraseña.
const CAMPOS_PUBLICOS = `
  u.id, u.nombre_completo, u.documento, u.correo, u.nombre_usuario,
  u.telefono, u.id_rol, r.nombre AS rol, u.estado, u.fecha_registro
`;

/** Devuelve todos los roles definidos en el sistema. */
function listarRoles() {
  return baseDatos.prepare('SELECT * FROM rol ORDER BY id').all();
}

/** Busca un rol por su nombre (administrador, tecnico o cliente). */
function buscarRolPorNombre(nombre) {
  return baseDatos.prepare('SELECT * FROM rol WHERE nombre = ?').get(nombre);
}

/** Inserta un usuario y devuelve el registro creado. */
function crear(usuario) {
  const sentencia = baseDatos.prepare(`
    INSERT INTO usuario (nombre_completo, documento, correo, nombre_usuario,
                         contrasena_hash, telefono, id_rol)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const resultado = sentencia.run(
    usuario.nombreCompleto, usuario.documento, usuario.correo,
    usuario.nombreUsuario, usuario.contrasenaHash,
    usuario.telefono || null, usuario.idRol
  );
  return buscarPorId(Number(resultado.lastInsertRowid));
}

/** Busca un usuario por su identificador, sin exponer la contraseña. */
function buscarPorId(id) {
  return baseDatos
    .prepare(`SELECT ${CAMPOS_PUBLICOS} FROM usuario u
              JOIN rol r ON r.id = u.id_rol WHERE u.id = ?`)
    .get(id);
}

/** Busca un usuario por nombre de usuario. Incluye el hash, para el login. */
function buscarPorNombreUsuarioConClave(nombreUsuario) {
  return baseDatos
    .prepare(`SELECT u.*, r.nombre AS rol FROM usuario u
              JOIN rol r ON r.id = u.id_rol WHERE u.nombre_usuario = ?`)
    .get(nombreUsuario);
}

/** Comprueba si ya existe un usuario con ese correo, documento o usuario. */
function existeDuplicado({ correo, documento, nombreUsuario, idExcluido = 0 }) {
  return baseDatos
    .prepare(`SELECT id, correo, documento, nombre_usuario FROM usuario
              WHERE (correo = ? OR documento = ? OR nombre_usuario = ?) AND id <> ?`)
    .get(correo, documento, nombreUsuario, idExcluido);
}

/**
 * Lista usuarios con filtros opcionales y paginación.
 * @param {{rol?: string, estado?: string, busqueda?: string,
 *          pagina?: number, tamano?: number}} filtros
 */
function listar(filtros = {}) {
  const condiciones = [];
  const valores = [];

  if (filtros.rol) {
    condiciones.push('r.nombre = ?');
    valores.push(filtros.rol);
  }
  if (filtros.estado) {
    condiciones.push('u.estado = ?');
    valores.push(filtros.estado);
  }
  if (filtros.busqueda) {
    condiciones.push('(u.nombre_completo LIKE ? OR u.correo LIKE ? OR u.documento LIKE ?)');
    const patron = `%${filtros.busqueda}%`;
    valores.push(patron, patron, patron);
  }

  const donde = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const tamano = Math.min(Math.max(Number(filtros.tamano) || 20, 1), 100);
  const pagina = Math.max(Number(filtros.pagina) || 1, 1);

  const total = baseDatos
    .prepare(`SELECT COUNT(*) AS n FROM usuario u JOIN rol r ON r.id = u.id_rol ${donde}`)
    .get(...valores).n;

  const registros = baseDatos
    .prepare(`SELECT ${CAMPOS_PUBLICOS} FROM usuario u JOIN rol r ON r.id = u.id_rol
              ${donde} ORDER BY u.id LIMIT ? OFFSET ?`)
    .all(...valores, tamano, (pagina - 1) * tamano);

  return { total, pagina, tamano, registros };
}

/** Actualiza los datos editables de un usuario. */
function actualizar(id, datos) {
  baseDatos.prepare(`
    UPDATE usuario
       SET nombre_completo = ?, correo = ?, telefono = ?, id_rol = ?
     WHERE id = ?
  `).run(datos.nombreCompleto, datos.correo, datos.telefono || null, datos.idRol, id);
  return buscarPorId(id);
}

/** Activa o inactiva un usuario. */
function cambiarEstado(id, estado) {
  baseDatos.prepare('UPDATE usuario SET estado = ? WHERE id = ?').run(estado, id);
  return buscarPorId(id);
}

/** Elimina un usuario. Devuelve cuántas filas se afectaron. */
function eliminar(id) {
  return Number(baseDatos.prepare('DELETE FROM usuario WHERE id = ?').run(id).changes);
}

/** Cuenta las solicitudes en las que el usuario participa como cliente o técnico. */
function contarSolicitudesRelacionadas(id) {
  return baseDatos
    .prepare('SELECT COUNT(*) AS n FROM solicitud WHERE id_usuario = ? OR id_tecnico = ?')
    .get(id, id).n;
}

module.exports = {
  listarRoles,
  buscarRolPorNombre,
  crear,
  buscarPorId,
  buscarPorNombreUsuarioConClave,
  existeDuplicado,
  listar,
  actualizar,
  cambiarEstado,
  eliminar,
  contarSolicitudesRelacionadas,
};
