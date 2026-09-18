/**
 * Validaciones de los datos que entran a la API.
 * Cada función devuelve un arreglo de errores; vacío significa que todo está bien.
 */

const EXPRESION_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EXPRESION_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const PRIORIDADES = ['baja', 'media', 'alta'];
const ESTADOS = ['registrada', 'asignada', 'en_proceso', 'resuelta', 'cerrada', 'cancelada'];

/**
 * Transiciones permitidas entre estados de una solicitud.
 * Es la regla de negocio central del proyecto: una solicitud no puede
 * saltar de "registrada" a "cerrada" sin pasar por el técnico.
 */
const TRANSICIONES = {
  registrada: ['asignada', 'cancelada'],
  asignada: ['en_proceso', 'cancelada'],
  en_proceso: ['resuelta', 'cancelada'],
  resuelta: ['cerrada', 'en_proceso'],
  cerrada: [],
  cancelada: [],
};

const texto = (valor) => (valor === undefined || valor === null ? '' : String(valor).trim());

/** Valida el registro de un usuario. */
function validarUsuario(cuerpo, { exigirContrasena = true } = {}) {
  const errores = [];
  const c = cuerpo || {};

  if (texto(c.nombreCompleto).length < 5) {
    errores.push('El nombre completo es obligatorio y debe tener al menos 5 caracteres.');
  }
  if (!/^\d{6,15}$/.test(texto(c.documento))) {
    errores.push('El documento es obligatorio y debe tener entre 6 y 15 dígitos.');
  }
  if (!EXPRESION_CORREO.test(texto(c.correo))) {
    errores.push('El correo electrónico es obligatorio y debe tener un formato válido.');
  }
  if (texto(c.nombreUsuario).length < 4) {
    errores.push('El nombre de usuario es obligatorio y debe tener al menos 4 caracteres.');
  }
  if (exigirContrasena && texto(c.contrasena).length < 8) {
    errores.push('La contraseña es obligatoria y debe tener al menos 8 caracteres.');
  }
  if (c.telefono && !/^\d{7,15}$/.test(texto(c.telefono))) {
    errores.push('El teléfono debe tener entre 7 y 15 dígitos.');
  }
  return errores;
}

/** Valida el inicio de sesión. */
function validarInicioSesion(cuerpo) {
  const errores = [];
  const c = cuerpo || {};
  if (!texto(c.nombreUsuario)) errores.push('El nombre de usuario es obligatorio.');
  if (!texto(c.contrasena)) errores.push('La contraseña es obligatoria.');
  return errores;
}

/** Valida un servicio del catálogo. */
function validarServicio(cuerpo) {
  const errores = [];
  const c = cuerpo || {};

  if (!/^[A-Z]{3}-\d{3}$/.test(texto(c.codigo))) {
    errores.push('El código es obligatorio y debe tener el formato AAA-000 (por ejemplo SOP-001).');
  }
  if (texto(c.nombre).length < 5) {
    errores.push('El nombre del servicio es obligatorio y debe tener al menos 5 caracteres.');
  }
  if (texto(c.descripcion).length < 10) {
    errores.push('La descripción es obligatoria y debe tener al menos 10 caracteres.');
  }
  if (!texto(c.categoria)) {
    errores.push('La categoría es obligatoria.');
  }
  if (!(Number(c.precioBase) >= 0)) {
    errores.push('El precio base es obligatorio y no puede ser negativo.');
  }
  if (!(Number(c.tiempoEstimadoHoras) > 0)) {
    errores.push('El tiempo estimado en horas es obligatorio y debe ser mayor que cero.');
  }
  return errores;
}

/** Valida la creación o edición de una solicitud. */
function validarSolicitud(cuerpo) {
  const errores = [];
  const c = cuerpo || {};

  if (!Number.isInteger(Number(c.idServicio)) || Number(c.idServicio) <= 0) {
    errores.push('El identificador del servicio es obligatorio y debe ser un entero positivo.');
  }
  if (texto(c.descripcion).length < 10) {
    errores.push('La descripción del caso es obligatoria y debe tener al menos 10 caracteres.');
  }
  if (texto(c.direccion).length < 5) {
    errores.push('La dirección es obligatoria y debe tener al menos 5 caracteres.');
  }
  if (c.prioridad && !PRIORIDADES.includes(texto(c.prioridad))) {
    errores.push(`La prioridad debe ser una de: ${PRIORIDADES.join(', ')}.`);
  }
  if (c.fechaProgramada && !EXPRESION_FECHA.test(texto(c.fechaProgramada))) {
    errores.push('La fecha programada debe venir en formato AAAA-MM-DD.');
  }
  return errores;
}

/** Comprueba si se puede pasar de un estado a otro. */
function transicionValida(estadoActual, estadoNuevo) {
  return (TRANSICIONES[estadoActual] || []).includes(estadoNuevo);
}

module.exports = {
  PRIORIDADES,
  ESTADOS,
  TRANSICIONES,
  validarUsuario,
  validarInicioSesion,
  validarServicio,
  validarSolicitud,
  transicionValida,
};
