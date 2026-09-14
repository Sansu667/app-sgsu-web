/** Servicios del módulo de catálogo. */
import { obtener, enviar, reemplazar, eliminar } from './clienteHttp.js';

export const listarServicios = (filtros) => obtener('api/servicios', filtros);
export const listarCategorias = () => obtener('api/servicios/categorias');
export const consultarServicio = (id) => obtener(`api/servicios/${id}`);
export const crearServicio = (datos) => enviar('api/servicios', datos);
export const actualizarServicio = (id, datos) => reemplazar(`api/servicios/${id}`, datos);
export const eliminarServicio = (id) => eliminar(`api/servicios/${id}`);
