/**
 * Validaciones de los formularios.
 *
 * Repiten las reglas que la API aplica del lado del servidor. No reemplazan
 * esa validación —el servidor sigue siendo la autoridad—, pero le evitan al
 * usuario esperar una respuesta para enterarse de que le faltó un campo.
 */

const EXPRESION_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const texto = (valor) => String(valor ?? '').trim();

/** Valida el formulario de inicio de sesión. */
export function validarInicioSesion({ nombreUsuario, contrasena }) {
  const errores = {};
  if (!texto(nombreUsuario)) errores.nombreUsuario = 'Escriba su nombre de usuario.';
  if (!texto(contrasena)) errores.contrasena = 'Escriba su contraseña.';
  return errores;
}

/** Valida el formulario de registro de un cliente. */
export function validarRegistro(datos) {
  const errores = {};
  const d = datos || {};

  if (texto(d.nombreCompleto).length < 5) {
    errores.nombreCompleto = 'El nombre completo debe tener al menos 5 caracteres.';
  }
  if (!/^\d{6,15}$/.test(texto(d.documento))) {
    errores.documento = 'El documento debe tener entre 6 y 15 dígitos.';
  }
  if (!EXPRESION_CORREO.test(texto(d.correo))) {
    errores.correo = 'Escriba un correo electrónico válido.';
  }
  if (texto(d.nombreUsuario).length < 4) {
    errores.nombreUsuario = 'El nombre de usuario debe tener al menos 4 caracteres.';
  }
  if (texto(d.contrasena).length < 8) {
    errores.contrasena = 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (d.confirmacion !== undefined && texto(d.contrasena) !== texto(d.confirmacion)) {
    errores.confirmacion = 'Las dos contraseñas no coinciden.';
  }
  if (texto(d.telefono) && !/^\d{7,15}$/.test(texto(d.telefono))) {
    errores.telefono = 'El teléfono debe tener entre 7 y 15 dígitos.';
  }
  return errores;
}

/** Valida el formulario de una solicitud de servicio. */
export function validarSolicitud(datos) {
  const errores = {};
  const d = datos || {};

  if (!Number(d.idServicio)) errores.idServicio = 'Seleccione el servicio que necesita.';
  if (texto(d.descripcion).length < 10) {
    errores.descripcion = 'Describa el caso con al menos 10 caracteres.';
  }
  if (texto(d.direccion).length < 5) {
    errores.direccion = 'Escriba la dirección donde se prestará el servicio.';
  }
  return errores;
}

/** Valida el formulario de un servicio del catálogo. */
export function validarServicio(datos) {
  const errores = {};
  const d = datos || {};

  if (!/^[A-Z]{3}-\d{3}$/.test(texto(d.codigo))) {
    errores.codigo = 'El código debe tener el formato AAA-000, por ejemplo SOP-001.';
  }
  if (texto(d.nombre).length < 5) errores.nombre = 'El nombre debe tener al menos 5 caracteres.';
  if (texto(d.descripcion).length < 10) {
    errores.descripcion = 'La descripción debe tener al menos 10 caracteres.';
  }
  if (!texto(d.categoria)) errores.categoria = 'Escriba la categoría del servicio.';
  if (!(Number(d.precioBase) >= 0)) errores.precioBase = 'El precio no puede ser negativo.';
  if (!(Number(d.tiempoEstimadoHoras) > 0)) {
    errores.tiempoEstimadoHoras = 'El tiempo estimado debe ser mayor que cero.';
  }
  return errores;
}

/** Indica si un objeto de errores está vacío. */
export const sinErrores = (errores) => Object.keys(errores || {}).length === 0;
