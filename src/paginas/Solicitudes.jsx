/**
 * Módulo de solicitudes — listado.
 * La API ya acota lo que devuelve según el rol; aquí solo se agregan filtros
 * y paginación sobre ese resultado.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useSesion } from '../contexto/ContextoSesion.jsx';
import { listarSolicitudes } from '../servicios/solicitudServicio.js';
import { formatearFechaHora, recortar } from '../utilidades/formato.js';
import Alerta from '../componentes/Alerta.jsx';
import Boton from '../componentes/Boton.jsx';
import CampoTexto from '../componentes/CampoTexto.jsx';
import Cargando from '../componentes/Cargando.jsx';
import Insignia from '../componentes/Insignia.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

const ESTADOS = ['registrada', 'asignada', 'en_proceso', 'resuelta', 'cerrada', 'cancelada'];

const DESCRIPCION = {
  administrador: 'Todas las solicitudes del sistema.',
  tecnico: 'Las solicitudes que le han asignado.',
  cliente: 'Las solicitudes que usted ha radicado.',
};

export default function Solicitudes() {
  const { rol } = useSesion();

  const [datos, setDatos] = useState({ solicitudes: [], total: 0, pagina: 1, tamano: 10 });
  const [filtro, setFiltro] = useState({ estado: '', prioridad: '', pagina: 1, tamano: 10 });
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(null);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setFallo(null);

    listarSolicitudes(filtro)
      .then((r) => { if (vigente) setDatos(r); })
      .catch((e) => { if (vigente) setFallo(e.message); })
      .finally(() => { if (vigente) setCargando(false); });

    return () => { vigente = false; };
  }, [filtro]);

  const cambiarFiltro = (e) =>
    setFiltro({ ...filtro, [e.target.name]: e.target.value, pagina: 1 });

  const totalPaginas = Math.max(1, Math.ceil(datos.total / (datos.tamano || 10)));

  const columnas = [
    { clave: 'codigo', titulo: 'Código' },
    { clave: 'servicio', titulo: 'Servicio', dibujar: (f) => recortar(f.servicio, 30) },
    ...(rol !== 'cliente'
      ? [{ clave: 'cliente', titulo: 'Cliente', dibujar: (f) => recortar(f.cliente, 24) }]
      : []),
    ...(rol !== 'tecnico'
      ? [{ clave: 'tecnico', titulo: 'Técnico', dibujar: (f) => f.tecnico || '— sin asignar —' }]
      : []),
    {
      clave: 'prioridad', titulo: 'Prioridad', centrado: true,
      dibujar: (f) => <Insignia valor={f.prioridad} tipo="prioridad" />,
    },
    {
      clave: 'estado', titulo: 'Estado', centrado: true,
      dibujar: (f) => <Insignia valor={f.estado} />,
    },
    {
      clave: 'fecha_creacion', titulo: 'Radicada',
      dibujar: (f) => formatearFechaHora(f.fecha_creacion),
    },
    {
      clave: 'ver', titulo: '', centrado: true,
      dibujar: (f) => <Link className="enlace" to={`/solicitudes/${f.id}`}>Ver</Link>,
    },
  ];

  return (
    <>
      <div className="pagina__cabecera">
        <h1 className="pagina__titulo">Solicitudes</h1>
        <p className="pagina__descripcion">{DESCRIPCION[rol]}</p>
      </div>

      {fallo && <Alerta tipo="error">{fallo}</Alerta>}

      <Tarjeta
        titulo={`${datos.total} solicitud${datos.total === 1 ? '' : 'es'}`}
        acciones={rol === 'cliente' && (
          <Link className="boton boton--primario" to="/solicitudes/nueva">Nueva solicitud</Link>
        )}
      >
        <div className="filtros">
          <CampoTexto
            etiqueta="Estado" nombre="estado" valor={filtro.estado} onChange={cambiarFiltro}
            opciones={ESTADOS.map((e) => ({ valor: e, texto: e.replace('_', ' ') }))}
          />
          <CampoTexto
            etiqueta="Prioridad" nombre="prioridad" valor={filtro.prioridad} onChange={cambiarFiltro}
            opciones={[
              { valor: 'baja', texto: 'Baja' },
              { valor: 'media', texto: 'Media' },
              { valor: 'alta', texto: 'Alta' },
            ]}
          />
          <div className="filtros__accion">
            <Boton
              variante="tenue"
              onClick={() => setFiltro({ estado: '', prioridad: '', pagina: 1, tamano: 10 })}
            >
              Limpiar filtros
            </Boton>
          </div>
        </div>

        {cargando ? <Cargando /> : (
          <>
            <Tabla columnas={columnas} filas={datos.solicitudes} vacio="No hay solicitudes que coincidan." />

            {totalPaginas > 1 && (
              <div className="paginacion">
                <Boton
                  variante="tenue" deshabilitado={filtro.pagina <= 1}
                  onClick={() => setFiltro({ ...filtro, pagina: filtro.pagina - 1 })}
                >
                  Anterior
                </Boton>
                <span className="paginacion__texto">
                  Página {datos.pagina} de {totalPaginas}
                </span>
                <Boton
                  variante="tenue" deshabilitado={filtro.pagina >= totalPaginas}
                  onClick={() => setFiltro({ ...filtro, pagina: filtro.pagina + 1 })}
                >
                  Siguiente
                </Boton>
              </div>
            )}
          </>
        )}
      </Tarjeta>
    </>
  );
}
