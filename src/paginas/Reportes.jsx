/**
 * Módulo de reportes. Solo el administrador entra aquí.
 *
 * Las tres consultas agregadas las resuelve la API; el front únicamente las
 * pide en paralelo y las dibuja. La barra de proporción se arma con CSS, sin
 * librerías de gráficas, para no cargar dependencias que no se necesitan.
 */
import { useEffect, useState } from 'react';

import * as reportes from '../servicios/reporteServicio.js';
import { formatearMoneda, formatearEstado } from '../utilidades/formato.js';
import { colorDeEstado } from '../componentes/Insignia.jsx';
import Alerta from '../componentes/Alerta.jsx';
import Boton from '../componentes/Boton.jsx';
import Cargando from '../componentes/Cargando.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

/** Calcula el porcentaje que representa un valor dentro de un total. */
export function porcentaje(valor, total) {
  if (!total || total <= 0) return 0;
  return Math.round((valor / total) * 100);
}

export default function Reportes() {
  const [estados, setEstados] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(null);

  async function cargar() {
    setCargando(true);
    setFallo(null);
    try {
      const [porEstado, masSolicitados, carga] = await Promise.all([
        reportes.solicitudesPorEstado(),
        reportes.serviciosMasSolicitados(5),
        reportes.cargaPorTecnico(),
      ]);
      setEstados(porEstado);
      setServicios(masSolicitados.servicios);
      setTecnicos(carga.tecnicos);
    } catch (error) {
      setFallo(error.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  const columnasServicios = [
    { clave: 'codigo', titulo: 'Código' },
    { clave: 'nombre', titulo: 'Servicio' },
    { clave: 'categoria', titulo: 'Categoría' },
    { clave: 'total_solicitudes', titulo: 'Solicitudes', centrado: true },
    {
      clave: 'ingreso_estimado', titulo: 'Ingreso estimado',
      dibujar: (f) => formatearMoneda(f.ingreso_estimado),
    },
  ];

  const columnasTecnicos = [
    { clave: 'tecnico', titulo: 'Técnico' },
    { clave: 'total_asignadas', titulo: 'Asignadas', centrado: true },
    { clave: 'abiertas', titulo: 'Abiertas', centrado: true },
    { clave: 'finalizadas', titulo: 'Finalizadas', centrado: true },
  ];

  return (
    <>
      <div className="pagina__cabecera">
        <h1 className="pagina__titulo">Reportes</h1>
        <p className="pagina__descripcion">
          Consultas agregadas sobre la operación. Los datos se toman en el momento
          en que se abre la página.
        </p>
      </div>

      {fallo && <Alerta tipo="error">{fallo}</Alerta>}

      {cargando ? <Cargando texto="Consultando los reportes…" /> : (
        <>
          <Tarjeta
            titulo="Solicitudes por estado"
            descripcion={`${estados?.total || 0} solicitudes registradas en total.`}
            acciones={<Boton variante="tenue" onClick={cargar}>Actualizar</Boton>}
          >
            <ul className="barras">
              {(estados?.porEstado || []).map((f) => (
                <li key={f.estado} className="barras__fila">
                  <span className="barras__etiqueta">{formatearEstado(f.estado)}</span>
                  <span className="barras__pista">
                    <span
                      className={`barras__valor barras__valor--${colorDeEstado(f.estado)}`}
                      style={{ width: `${porcentaje(f.total, estados.total)}%` }}
                    />
                  </span>
                  <span className="barras__numero">
                    {f.total} ({porcentaje(f.total, estados.total)}%)
                  </span>
                </li>
              ))}
            </ul>
          </Tarjeta>

          <Tarjeta
            titulo="Servicios más solicitados"
            descripcion="Los cinco servicios con mayor demanda y el ingreso que representan."
          >
            <Tabla
              columnas={columnasServicios}
              filas={servicios}
              vacio="Todavía no hay solicitudes para calcular el reporte."
            />
          </Tarjeta>

          <Tarjeta
            titulo="Carga por técnico"
            descripcion="Sirve para repartir las solicitudes nuevas entre los técnicos con menos casos abiertos."
          >
            <Tabla
              columnas={columnasTecnicos}
              filas={tecnicos}
              vacio="No hay técnicos registrados."
            />
          </Tarjeta>
        </>
      )}
    </>
  );
}
