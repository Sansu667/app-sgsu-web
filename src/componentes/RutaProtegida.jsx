/**
 * Control de acceso del lado del cliente.
 *
 * Si no hay sesión, devuelve al inicio de sesión. Si hay sesión pero el rol
 * no está entre los permitidos, muestra un aviso en lugar de la vista.
 *
 * Es una comodidad para el usuario, no un mecanismo de seguridad: quien
 * decide de verdad es la API, que vuelve a comprobar el token y el rol en
 * cada petición.
 */
import { Navigate, useLocation } from 'react-router-dom';

import { useSesion } from '../contexto/ContextoSesion.jsx';
import Alerta from './Alerta.jsx';
import Cargando from './Cargando.jsx';

export default function RutaProtegida({ roles, children }) {
  const { autenticado, rol, cargando } = useSesion();
  const ubicacion = useLocation();

  if (cargando) return <Cargando />;

  if (!autenticado) {
    return <Navigate to="/entrar" state={{ desde: ubicacion.pathname }} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(rol)) {
    return (
      <Alerta tipo="error" titulo="Acceso denegado">
        Esta sección está reservada para el rol {roles.join(' o ')}. Su cuenta tiene el rol {rol}.
      </Alerta>
    );
  }

  return children;
}
