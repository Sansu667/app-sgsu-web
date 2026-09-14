/** Servicios del módulo de reportes (rol administrador). */
import { obtener } from './clienteHttp.js';

export const solicitudesPorEstado = () => obtener('api/reportes/solicitudes-por-estado');
export const serviciosMasSolicitados = (limite = 5) =>
  obtener('api/reportes/servicios-mas-solicitados', { limite });
export const cargaPorTecnico = () => obtener('api/reportes/carga-por-tecnico');
