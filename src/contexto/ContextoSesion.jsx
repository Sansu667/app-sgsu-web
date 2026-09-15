/**
 * Contexto de sesión: estado global de autenticación de la aplicación.
 *
 * Aplica el patrón Provider de React. Cualquier componente del árbol puede
 * preguntar quién inició sesión y con qué rol, sin que haya que pasar esos
 * datos de padre a hijo por toda la jerarquía.
 *
 * El token se guarda en sessionStorage, no en localStorage, para que la
 * sesión muera al cerrar la pestaña.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { CLAVE_SESION } from '../configuracion/entorno.js';
import { definirToken } from '../servicios/clienteHttp.js';
import * as autenticacion from '../servicios/autenticacionServicio.js';

const ContextoSesion = createContext(null);

/** Lee la sesión guardada en el navegador, si existe. */
function leerSesionGuardada() {
  try {
    const crudo = sessionStorage.getItem(CLAVE_SESION);
    return crudo ? JSON.parse(crudo) : null;
  } catch (e) {
    return null;
  }
}

export function ProveedorSesion({ children }) {
  const [sesion, setSesion] = useState(() => leerSesionGuardada());
  const [cargando, setCargando] = useState(true);

  // Al montar la aplicación se reinyecta el token en el cliente HTTP.
  useEffect(() => {
    if (sesion && sesion.token) definirToken(sesion.token);
    setCargando(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function entrar(nombreUsuario, contrasena) {
    const respuesta = await autenticacion.iniciarSesion(nombreUsuario, contrasena);
    const nueva = { token: respuesta.token, usuario: respuesta.usuario };
    definirToken(nueva.token);
    try {
      sessionStorage.setItem(CLAVE_SESION, JSON.stringify(nueva));
    } catch (e) {
      // Si el navegador bloquea el almacenamiento, la sesión igual funciona
      // mientras la pestaña esté abierta.
    }
    setSesion(nueva);
    return nueva.usuario;
  }

  function salir() {
    definirToken(null);
    try {
      sessionStorage.removeItem(CLAVE_SESION);
    } catch (e) {
      // sin efecto
    }
    setSesion(null);
  }

  const valor = useMemo(() => ({
    sesion,
    cargando,
    usuario: sesion ? sesion.usuario : null,
    rol: sesion ? sesion.usuario.rol : null,
    autenticado: Boolean(sesion && sesion.token),
    entrar,
    salir,
  }), [sesion, cargando]);

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>;
}

/** Hook para consumir el contexto desde cualquier componente. */
export function useSesion() {
  const contexto = useContext(ContextoSesion);
  if (!contexto) {
    throw new Error('useSesion debe usarse dentro de un ProveedorSesion.');
  }
  return contexto;
}

export default ContextoSesion;
