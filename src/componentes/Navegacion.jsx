/**
 * Barra de navegación. El menú se arma según el rol del usuario, de modo que
 * cada perfil solo ve las opciones que puede usar.
 */
import { NavLink } from 'react-router-dom';

import { useSesion } from '../contexto/ContextoSesion.jsx';

const MENU = [
  { ruta: '/panel', texto: 'Panel', roles: ['administrador', 'tecnico', 'cliente'] },
  { ruta: '/catalogo', texto: 'Catálogo', roles: ['administrador', 'tecnico', 'cliente'] },
  { ruta: '/solicitudes', texto: 'Solicitudes', roles: ['administrador', 'tecnico', 'cliente'] },
  { ruta: '/solicitudes/nueva', texto: 'Nueva solicitud', roles: ['cliente'] },
  { ruta: '/usuarios', texto: 'Usuarios', roles: ['administrador'] },
  { ruta: '/reportes', texto: 'Reportes', roles: ['administrador'] },
];

export default function Navegacion() {
  const { rol } = useSesion();
  const opciones = MENU.filter((o) => o.roles.includes(rol));

  return (
    <nav className="navegacion" aria-label="Menú principal">
      {opciones.map((o) => (
        <NavLink
          key={o.ruta}
          to={o.ruta}
          end={o.ruta === '/solicitudes'}
          className={({ isActive }) =>
            `navegacion__enlace${isActive ? ' navegacion__enlace--activo' : ''}`}
        >
          {o.texto}
        </NavLink>
      ))}
    </nav>
  );
}
