/**
 * Cliente HTTP de la aplicación.
 *
 * Es el único punto del front-end que sabe cómo hablar con la API: arma la
 * URL, pone el encabezado de autorización, serializa el cuerpo y traduce
 * cualquier falla a un error con un mensaje entendible. El resto de los
 * servicios se apoyan en él, de modo que un cambio en la forma de autenticar
 * se hace en un solo archivo.
 */
import { URL_API } from '../configuracion/entorno.js';

/** Error propio de la aplicación: guarda el código HTTP y los errores de validación. */
export class ErrorApi extends Error {
  constructor(mensaje, codigo, errores) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.codigo = codigo;
    this.errores = errores || [];
  }
}

// El token vive en memoria; el contexto de sesión lo inyecta aquí al iniciar
// sesión y lo limpia al cerrarla.
let tokenActual = null;

export function definirToken(token) {
  tokenActual = token || null;
}

export function obtenerToken() {
  return tokenActual;
}

/**
 * Ejecuta una petición contra la API.
 * @param {string} ruta      ruta relativa, por ejemplo 'api/solicitudes'
 * @param {object} opciones  { metodo, cuerpo, parametros }
 */
export async function peticion(ruta, opciones = {}) {
  const { metodo = 'GET', cuerpo, parametros } = opciones;

  let url = `${URL_API}/${ruta.replace(/^\//, '')}`;
  if (parametros) {
    const consulta = new URLSearchParams();
    Object.entries(parametros).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') {
        consulta.append(clave, valor);
      }
    });
    const texto = consulta.toString();
    if (texto) url += `?${texto}`;
  }

  const encabezados = {};
  if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';
  if (tokenActual) encabezados.Authorization = `Bearer ${tokenActual}`;

  let respuesta;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: encabezados,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch (e) {
    throw new ErrorApi('No se pudo conectar con el servidor. Verifique que la API esté arriba.', 0);
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch (e) {
    datos = null;
  }

  if (!respuesta.ok) {
    const mensaje = (datos && datos.mensaje) || `Error ${respuesta.status} en la petición.`;
    throw new ErrorApi(mensaje, respuesta.status, datos && datos.errores);
  }
  return datos;
}

export const obtener = (ruta, parametros) => peticion(ruta, { metodo: 'GET', parametros });
export const enviar = (ruta, cuerpo) => peticion(ruta, { metodo: 'POST', cuerpo });
export const reemplazar = (ruta, cuerpo) => peticion(ruta, { metodo: 'PUT', cuerpo });
export const modificar = (ruta, cuerpo) => peticion(ruta, { metodo: 'PATCH', cuerpo });
export const eliminar = (ruta) => peticion(ruta, { metodo: 'DELETE' });
