/** Servicios del módulo de gestión de usuarios (rol administrador). */
import { obtener, enviar, reemplazar, modificar, eliminar } from './clienteHttp.js';

export const listarUsuarios = (filtros) => obtener('api/usuarios', filtros);
export const listarRoles = () => obtener('api/usuarios/roles');
export const consultarUsuario = (id) => obtener(`api/usuarios/${id}`);
export const crearUsuario = (datos) => enviar('api/usuarios', datos);
export const actualizarUsuario = (id, datos) => reemplazar(`api/usuarios/${id}`, datos);
export const cambiarEstadoUsuario = (id, estado) =>
  modificar(`api/usuarios/${id}/estado`, { estado });
export const eliminarUsuario = (id) => eliminar(`api/usuarios/${id}`);
