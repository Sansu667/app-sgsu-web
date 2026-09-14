/** Servicios del módulo de solicitudes. */
import { obtener, enviar, reemplazar, modificar, eliminar } from './clienteHttp.js';

export const listarSolicitudes = (filtros) => obtener('api/solicitudes', filtros);
export const consultarSolicitud = (id) => obtener(`api/solicitudes/${id}`);
export const crearSolicitud = (datos) => enviar('api/solicitudes', datos);
export const actualizarSolicitud = (id, datos) => reemplazar(`api/solicitudes/${id}`, datos);
export const asignarTecnico = (id, idTecnico) =>
  modificar(`api/solicitudes/${id}/asignar`, { idTecnico: Number(idTecnico) });
export const cambiarEstado = (id, estado, comentario) =>
  modificar(`api/solicitudes/${id}/estado`, { estado, comentario });
export const consultarBitacora = (id) => obtener(`api/solicitudes/${id}/bitacora`);
export const eliminarSolicitud = (id) => eliminar(`api/solicitudes/${id}`);
