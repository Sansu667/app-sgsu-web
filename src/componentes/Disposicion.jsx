/** Estructura común de las páginas con sesión iniciada. */
import { Outlet } from 'react-router-dom';

import Encabezado from './Encabezado.jsx';

export default function Disposicion() {
  return (
    <div className="disposicion">
      <Encabezado />
      <main className="disposicion__contenido">
        <Outlet />
      </main>
      <footer className="disposicion__pie">
        SGSU 1.0.0 · Evidencia GA8-220501096-AA1-EV01 · Edgar Santiago Suarez Alzate — Ficha 3186595
      </footer>
    </div>
  );
}
