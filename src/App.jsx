/**
 * Integración de los módulos.
 *
 * Este archivo es el punto donde se unen todos los módulos que se
 * desarrollaron por separado: cada página es un módulo y aquí se les asigna
 * una ruta, se envuelven en el control de acceso por rol y se comparte la
 * sesión mediante el proveedor de contexto.
 */
import { Navigate, Route, Routes } from 'react-router-dom';

import { ProveedorSesion } from './contexto/ContextoSesion.jsx';
import Disposicion from './componentes/Disposicion.jsx';
import RutaProtegida from './componentes/RutaProtegida.jsx';

import IniciarSesion from './paginas/IniciarSesion.jsx';
import Registro from './paginas/Registro.jsx';
import Panel from './paginas/Panel.jsx';
import Catalogo from './paginas/Catalogo.jsx';
import Solicitudes from './paginas/Solicitudes.jsx';
import NuevaSolicitud from './paginas/NuevaSolicitud.jsx';
import DetalleSolicitud from './paginas/DetalleSolicitud.jsx';
import Usuarios from './paginas/Usuarios.jsx';
import Reportes from './paginas/Reportes.jsx';

/** Envuelve una vista con la verificación de sesión y de rol. */
function Protegida({ roles, children }) {
  return <RutaProtegida roles={roles}>{children}</RutaProtegida>;
}

export default function App() {
  return (
    <ProveedorSesion>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/entrar" element={<IniciarSesion />} />
        <Route path="/registro" element={<Registro />} />

        {/* Rutas con sesión iniciada */}
        <Route
          element={(
            <Protegida>
              <Disposicion />
            </Protegida>
          )}
        >
          <Route path="/panel" element={<Panel />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/solicitudes" element={<Solicitudes />} />
          <Route
            path="/solicitudes/nueva"
            element={<Protegida roles={['cliente']}><NuevaSolicitud /></Protegida>}
          />
          <Route path="/solicitudes/:id" element={<DetalleSolicitud />} />
          <Route
            path="/usuarios"
            element={<Protegida roles={['administrador']}><Usuarios /></Protegida>}
          />
          <Route
            path="/reportes"
            element={<Protegida roles={['administrador']}><Reportes /></Protegida>}
          />
        </Route>

        <Route path="/" element={<Navigate to="/panel" replace />} />
        <Route path="*" element={<Navigate to="/panel" replace />} />
      </Routes>
    </ProveedorSesion>
  );
}
