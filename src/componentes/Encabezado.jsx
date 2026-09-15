/** Encabezado con el nombre del sistema, el usuario en sesión y la salida. */
import { useNavigate } from 'react-router-dom';

import { NOMBRE_APLICACION, DESCRIPCION_APLICACION } from '../configuracion/entorno.js';
import { useSesion } from '../contexto/ContextoSesion.jsx';
import Navegacion from './Navegacion.jsx';

export default function Encabezado() {
  const { usuario, rol, salir } = useSesion();
  const navegar = useNavigate();

  function cerrarSesion() {
    salir();
    navegar('/entrar', { replace: true });
  }

  return (
    <header className="encabezado">
      <div className="encabezado__marca">
        <span className="encabezado__logo" aria-hidden="true">SG</span>
        <div>
          <p className="encabezado__nombre">{NOMBRE_APLICACION}</p>
          <p className="encabezado__descripcion">{DESCRIPCION_APLICACION}</p>
        </div>
      </div>

      <Navegacion />

      <div className="encabezado__sesion">
        <div className="encabezado__usuario">
          <span className="encabezado__usuario-nombre">{usuario?.nombre_completo}</span>
          <span className="encabezado__usuario-rol">{rol}</span>
        </div>
        <button type="button" className="boton boton--tenue" onClick={cerrarSesion}>
          Salir
        </button>
      </div>
    </header>
  );
}
