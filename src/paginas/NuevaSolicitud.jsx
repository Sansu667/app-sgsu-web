/**
 * Módulo de solicitudes — radicación de una solicitud nueva.
 * Solo está disponible para el rol cliente.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { listarServicios } from '../servicios/catalogoServicio.js';
import { crearSolicitud } from '../servicios/solicitudServicio.js';
import { validarSolicitud, sinErrores } from '../utilidades/validaciones.js';
import { formatearMoneda, formatearDuracion } from '../utilidades/formato.js';
import Alerta from '../componentes/Alerta.jsx';
import Boton from '../componentes/Boton.jsx';
import CampoTexto from '../componentes/CampoTexto.jsx';
import Cargando from '../componentes/Cargando.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

const INICIAL = {
  idServicio: '', descripcion: '', direccion: '',
  prioridad: 'media', fechaProgramada: '',
};

export default function NuevaSolicitud() {
  const navegar = useNavigate();

  const [servicios, setServicios] = useState([]);
  const [datos, setDatos] = useState(INICIAL);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    listarServicios({ activo: 'true' })
      .then((r) => setServicios(r.servicios))
      .catch((e) => setFallo(e.message))
      .finally(() => setCargando(false));
  }, []);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });
  const elegido = servicios.find((s) => String(s.id) === String(datos.idServicio));

  async function enviar(e) {
    e.preventDefault();
    setFallo(null);
    setDetalles([]);

    const encontrados = validarSolicitud(datos);
    setErrores(encontrados);
    if (!sinErrores(encontrados)) return;

    setEnviando(true);
    try {
      const respuesta = await crearSolicitud({
        ...datos,
        idServicio: Number(datos.idServicio),
        fechaProgramada: datos.fechaProgramada || undefined,
      });
      navegar(`/solicitudes/${respuesta.solicitud.id}`, {
        state: { aviso: `Solicitud ${respuesta.solicitud.codigo} radicada correctamente.` },
      });
    } catch (error) {
      setFallo(error.message);
      setDetalles(error.errores || []);
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) return <Cargando texto="Cargando el catálogo…" />;

  return (
    <>
      <div className="pagina__cabecera">
        <h1 className="pagina__titulo">Nueva solicitud</h1>
        <p className="pagina__descripcion">
          Cuéntenos qué necesita. La solicitud queda en estado <em>registrada</em> hasta que el
          administrador le asigne un técnico.
        </p>
      </div>

      {fallo && <Alerta tipo="error" detalles={detalles}>{fallo}</Alerta>}

      <Tarjeta titulo="Datos de la solicitud">
        <form onSubmit={enviar} noValidate>
          <div className="rejilla rejilla--2">
            <CampoTexto
              etiqueta="Servicio" nombre="idServicio" requerido
              valor={datos.idServicio} onChange={cambiar} error={errores.idServicio}
              opciones={servicios.map((s) => ({
                valor: s.id, texto: `${s.codigo} — ${s.nombre}`,
              }))}
            />
            <CampoTexto
              etiqueta="Prioridad" nombre="prioridad"
              valor={datos.prioridad} onChange={cambiar}
              opciones={[
                { valor: 'baja', texto: 'Baja' },
                { valor: 'media', texto: 'Media' },
                { valor: 'alta', texto: 'Alta' },
              ]}
            />
          </div>

          {elegido && (
            <div className="resumen-servicio">
              <p className="resumen-servicio__descripcion">{elegido.descripcion}</p>
              <div className="resumen-servicio__datos">
                <span><strong>Precio base:</strong> {formatearMoneda(elegido.precio_base)}</span>
                <span><strong>Tiempo estimado:</strong> {formatearDuracion(elegido.tiempo_estimado_horas)}</span>
                <span><strong>Categoría:</strong> {elegido.categoria}</span>
              </div>
            </div>
          )}

          <CampoTexto
            etiqueta="Descripción del caso" nombre="descripcion" filas={4} requerido
            valor={datos.descripcion} onChange={cambiar} error={errores.descripcion}
            ayuda="Entre más detalle, más rápido lo puede resolver el técnico."
          />

          <div className="rejilla rejilla--2">
            <CampoTexto
              etiqueta="Dirección" nombre="direccion" requerido
              valor={datos.direccion} onChange={cambiar} error={errores.direccion}
            />
            <CampoTexto
              etiqueta="Fecha deseada" nombre="fechaProgramada" tipo="date"
              valor={datos.fechaProgramada} onChange={cambiar}
              ayuda="Opcional. Es una preferencia, no un compromiso."
            />
          </div>

          <div className="formulario__acciones">
            <Boton tipo="submit" cargando={enviando}>Radicar solicitud</Boton>
            <Boton variante="tenue" onClick={() => navegar('/solicitudes')}>Cancelar</Boton>
          </div>
        </form>
      </Tarjeta>
    </>
  );
}
