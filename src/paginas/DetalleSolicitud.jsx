/**
 * Módulo de solicitudes — detalle, avance del flujo y bitácora.
 *
 * Es la vista donde se integran varios módulos: consulta la solicitud, el
 * listado de técnicos (módulo de usuarios) para poder asignarla, y la bitácora
 * con la trazabilidad. Las acciones que se muestran dependen del rol y del
 * estado en el que esté la solicitud.
 */
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useSesion } from '../contexto/ContextoSesion.jsx';
import * as solicitudes from '../servicios/solicitudServicio.js';
import { listarUsuarios } from '../servicios/usuarioServicio.js';
import { formatearFechaHora, formatearMoneda, formatearEstado } from '../utilidades/formato.js';
import Alerta from '../componentes/Alerta.jsx';
import Boton from '../componentes/Boton.jsx';
import CampoTexto from '../componentes/CampoTexto.jsx';
import Cargando from '../componentes/Cargando.jsx';
import Insignia from '../componentes/Insignia.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

/** Mismas transiciones que valida la API; aquí solo deciden qué botones se ven. */
const TRANSICIONES = {
  registrada: ['asignada', 'cancelada'],
  asignada: ['en_proceso', 'cancelada'],
  en_proceso: ['resuelta', 'cancelada'],
  resuelta: ['cerrada', 'en_proceso'],
  cerrada: [],
  cancelada: [],
};

/** Devuelve los estados a los que el rol puede mover la solicitud. */
export function accionesDisponibles(estado, rol) {
  const posibles = (TRANSICIONES[estado] || []).filter((e) => e !== 'asignada');
  if (rol === 'administrador') return posibles;
  if (rol === 'tecnico') return posibles.filter((e) => e !== 'cerrada');
  return [];
}

export default function DetalleSolicitud() {
  const { id } = useParams();
  const { rol, usuario } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [solicitud, setSolicitud] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(null);
  const [aviso, setAviso] = useState(ubicacion.state?.aviso || null);
  const [procesando, setProcesando] = useState(false);
  const [comentario, setComentario] = useState('');
  const [tecnicoElegido, setTecnicoElegido] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setFallo(null);
    try {
      const [detalle, bitacora] = await Promise.all([
        solicitudes.consultarSolicitud(id),
        solicitudes.consultarBitacora(id),
      ]);
      setSolicitud(detalle.solicitud);
      setMovimientos(bitacora.movimientos);

      if (rol === 'administrador' && detalle.solicitud.estado === 'registrada') {
        const lista = await listarUsuarios({ rol: 'tecnico', estado: 'activo' });
        setTecnicos(lista.usuarios);
      }
    } catch (error) {
      setFallo(error.message);
    } finally {
      setCargando(false);
    }
  }, [id, rol]);

  useEffect(() => { cargar(); }, [cargar]);

  async function ejecutar(accion, mensajeExito) {
    setProcesando(true);
    setFallo(null);
    setAviso(null);
    try {
      await accion();
      setAviso(mensajeExito);
      setComentario('');
      await cargar();
    } catch (error) {
      setFallo(error.message);
    } finally {
      setProcesando(false);
    }
  }

  const asignar = () => ejecutar(
    () => solicitudes.asignarTecnico(id, tecnicoElegido),
    'La solicitud quedó asignada al técnico.',
  );

  const mover = (estado) => ejecutar(
    () => solicitudes.cambiarEstado(id, estado, comentario || undefined),
    `La solicitud pasó a "${formatearEstado(estado)}".`,
  );

  const borrar = () => ejecutar(
    async () => {
      await solicitudes.eliminarSolicitud(id);
      navegar('/solicitudes', { replace: true });
    },
    'Solicitud eliminada.',
  );

  if (cargando) return <Cargando texto="Cargando la solicitud…" />;
  if (fallo && !solicitud) return <Alerta tipo="error" titulo="No se pudo abrir la solicitud">{fallo}</Alerta>;
  if (!solicitud) return null;

  const acciones = accionesDisponibles(solicitud.estado, rol);
  const puedeAsignar = rol === 'administrador' && solicitud.estado === 'registrada';
  const puedeEditar = rol === 'cliente'
    && solicitud.estado === 'registrada'
    && solicitud.id_usuario === usuario.id;

  return (
    <>
      <div className="pagina__cabecera">
        <button type="button" className="enlace" onClick={() => navegar('/solicitudes')}>
          ← Volver al listado
        </button>
        <h1 className="pagina__titulo">
          {solicitud.codigo} <Insignia valor={solicitud.estado} />
        </h1>
        <p className="pagina__descripcion">{solicitud.servicio}</p>
      </div>

      {fallo && <Alerta tipo="error">{fallo}</Alerta>}
      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}

      <div className="rejilla rejilla--detalle">
        <Tarjeta titulo="Datos de la solicitud">
          <dl className="definiciones">
            <div><dt>Cliente</dt><dd>{solicitud.cliente}</dd></div>
            <div><dt>Servicio</dt><dd>{solicitud.servicio} ({solicitud.categoria})</dd></div>
            <div><dt>Precio base</dt><dd>{formatearMoneda(solicitud.precio_base)}</dd></div>
            <div><dt>Prioridad</dt><dd><Insignia valor={solicitud.prioridad} tipo="prioridad" /></dd></div>
            <div><dt>Técnico</dt><dd>{solicitud.tecnico || '— sin asignar —'}</dd></div>
            <div><dt>Dirección</dt><dd>{solicitud.direccion}</dd></div>
            <div><dt>Radicada</dt><dd>{formatearFechaHora(solicitud.fecha_creacion)}</dd></div>
            <div><dt>Fecha deseada</dt><dd>{solicitud.fecha_programada || '—'}</dd></div>
            {solicitud.fecha_cierre && (
              <div><dt>Cerrada</dt><dd>{formatearFechaHora(solicitud.fecha_cierre)}</dd></div>
            )}
          </dl>

          <h3 className="subtitulo">Descripción del caso</h3>
          <p className="texto-largo">{solicitud.descripcion}</p>

          {solicitud.observacion_cierre && (
            <>
              <h3 className="subtitulo">Observación de cierre</h3>
              <p className="texto-largo">{solicitud.observacion_cierre}</p>
            </>
          )}
        </Tarjeta>

        <div>
          {(puedeAsignar || acciones.length > 0 || puedeEditar || rol === 'administrador') && (
            <Tarjeta titulo="Acciones">
              {puedeAsignar && (
                <div className="bloque-accion">
                  <CampoTexto
                    etiqueta="Asignar a un técnico" nombre="tecnico"
                    valor={tecnicoElegido} onChange={(e) => setTecnicoElegido(e.target.value)}
                    opciones={tecnicos.map((t) => ({ valor: t.id, texto: t.nombre_completo }))}
                  />
                  <Boton
                    onClick={asignar} cargando={procesando}
                    deshabilitado={!tecnicoElegido} ancho
                  >
                    Asignar solicitud
                  </Boton>
                </div>
              )}

              {acciones.length > 0 && (
                <div className="bloque-accion">
                  <CampoTexto
                    etiqueta="Comentario" nombre="comentario" filas={2}
                    valor={comentario} onChange={(e) => setComentario(e.target.value)}
                    ayuda="Queda registrado en la bitácora."
                  />
                  <div className="botones-columna">
                    {acciones.map((estado) => (
                      <Boton
                        key={estado} cargando={procesando}
                        variante={estado === 'cancelada' ? 'peligro' : 'primario'}
                        onClick={() => mover(estado)} ancho
                      >
                        Pasar a {formatearEstado(estado)}
                      </Boton>
                    ))}
                  </div>
                </div>
              )}

              {puedeEditar && (
                <p className="nota">
                  Mientras la solicitud esté en estado registrada, usted puede corregir sus
                  datos. Una vez asignada, quedan congelados.
                </p>
              )}

              {rol === 'administrador' && (
                <div className="bloque-accion">
                  <Boton variante="peligro" onClick={borrar} cargando={procesando} ancho>
                    Eliminar solicitud
                  </Boton>
                </div>
              )}
            </Tarjeta>
          )}
        </div>
      </div>

      <Tarjeta
        titulo="Bitácora"
        descripcion="Trazabilidad completa: quién hizo cada cambio y cuándo."
      >
        <ol className="linea-tiempo">
          {movimientos.map((m) => (
            <li key={m.id} className="linea-tiempo__paso">
              <span className={`linea-tiempo__punto linea-tiempo__punto--${m.estado_nuevo}`} />
              <div className="linea-tiempo__contenido">
                <p className="linea-tiempo__titulo">
                  {m.estado_anterior
                    ? <>De <Insignia valor={m.estado_anterior} /> a <Insignia valor={m.estado_nuevo} /></>
                    : <>Solicitud creada <Insignia valor={m.estado_nuevo} /></>}
                </p>
                {m.comentario && <p className="linea-tiempo__comentario">{m.comentario}</p>}
                <p className="linea-tiempo__meta">
                  {m.usuario} · {formatearFechaHora(m.fecha)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Tarjeta>
    </>
  );
}
