/**
 * Configuración del entorno de la aplicación.
 *
 * En desarrollo la variable queda vacía y las peticiones salen como rutas
 * relativas (/api/...), que el proxy de Vite redirige al servidor de la API.
 * En producción se define VITE_URL_API en el momento de compilar.
 */
export const URL_API = import.meta.env.VITE_URL_API || '';

export const NOMBRE_APLICACION = 'SGSU';
export const DESCRIPCION_APLICACION = 'Sistema de Gestión de Solicitudes de Servicios';
export const CLAVE_SESION = 'sgsu.sesion';
