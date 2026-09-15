/**
 * Panel de inicio. Lo que muestra depende del rol de quien entra:
 * el administrador ve el tablero del sistema, el técnico su carga de trabajo
 * y el cliente el estado de sus propias solicitudes.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useSesion } from '../contexto/ContextoSesion.jsx';
import { listarSolicitudes } from '../servicios/solicitudServicio.js';
import { solicitudesPorEstado } from '../servicios/reporteServicio.js';
import { formatearFechaHora, recortar } from '../utilidades/formato.js';
import Alerta from '../componentes/Alerta.jsx';
import Cargando from '../componentes/Cargando.jsx';
import Insignia from '../componentes/Insignia.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

const SALUDO = {
  administrador: 'Este es el estado general del sistema.',
  tecnico: 'Estas son las solicitudes que tiene asignadas.',
  cliente: 'Este es el estado de las solicitudes que ha radicado.',
};

export default function Panel() {
  const { usuario, rol } = useSesion();

  const [solicitudes, setSolicitudes] = useState([]);
  const [porEstado, setPorEstado] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(null);

  useEffect(() => {
    let vigente = true;

    async function cargar() {
      setCargando(true);
      setFallo(null);
      try {
        const peticiones = [listarSolicitudes({ tamano: 5 })];
        if (rol === 'administrador') peticiones.push(solicitudesPorEstado());

        const [listado, reporte] = await Promise.all(peticiones);
        if (!vigente) return;
        setSolicitudes(listado.solicitudes);
        if (reporte) setPorEstado(reporte.porEstado);
      } catch (error) {
        if (vigente) setFallo(error.message);
      } finally {
        if (vigente) setCargando(false);
      }
    }

    cargar();
    return () => { vigente = false; };
  }, [rol]);

  const columnas = [
    { clave: 'codigo', titulo: 'Código' },
    { clave: 'servicio', titulo: 'Servicio', dibujar: (f) => recortar(f.servicio, 34) },
    { clave: 'estado', titulo: 'Estado', centrado: true, dibujar: (f) => <Insignia valor={f.estado} /> },
    { clave: 'fecha_creacion', titulo: 'Radicada', dibujar: (f) => formatearFechaHora(f.fecha_creacion) },
    {
      clave: 'ver', titulo: '', centrado: true,
      dibujar: (f) => <Link className="enlace" to={`/solicitudes/${f.id}`}>Ver</Link>,
    },
  ];

  return (
    <>
      <div className="pagina__cabecera">
        <h1 className="pagina__titulo">Hola, {usuario?.nombre_completo.split(' ')[0]}</h1>
        <p className="pagina__descripcion">{SALUDO[rol]}</p>
      </div>

      {fallo && <Alerta tipo="error" titulo="No se pudo cargar el panel">{fallo}</Alerta>}
      {cargando && <Cargando />}

      {!cargando && rol === 'administrador' && porEstado.length > 0 && (
        <div className="indicadores">
          {porEstado.map((e) => (
            <article key={e.estado} className={`indicador indicador--${e.estado}`}>
              <p className="indicador__valor">{e.total}</p>
              <p className="indicador__etiqueta"><Insignia valor={e.estado} /></p>
            </article>
          ))}
        </div>
      )}

      {!cargando && (
        <Tarjeta
          titulo="Últimas solicitudes"
          descripcion={rol === 'cliente'
            ? 'Las cinco más recientes que usted radicó.'
            : rol === 'tecnico'
              ? 'Las cinco más recientes que le asignaron.'
              : 'Las cinco más recientes del sistema.'}
          acciones={<Link className="boton boton--tenue" to="/solicitudes">Ver todas</Link>}
        >
          <Tabla
            columnas={columnas}
            filas={solicitudes}
            vacio={rol === 'cliente'
              ? 'Todavía no ha radicado ninguna solicitud.'
              : 'No hay solicitudes para mostrar.'}
          />
        </Tarjeta>
      )}
    </>
  );
}
