/** Servicios del módulo de autenticación. */
import { enviar, obtener } from './clienteHttp.js';

export const iniciarSesion = (nombreUsuario, contrasena) =>
  enviar('api/autenticacion/login', { nombreUsuario, contrasena });

export const registrarUsuario = (datos) =>
  enviar('api/autenticacion/registro', datos);

export const consultarPerfil = () => obtener('api/autenticacion/perfil');

export const consultarSalud = () => obtener('api/salud');
