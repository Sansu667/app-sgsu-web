/**
 * Módulo de catálogo de servicios.
 * Todos los roles pueden consultarlo; el administrador además puede crear,
 * editar y eliminar servicios desde esta misma vista.
 */
import { useEffect, useState } from 'react';

import { useSesion } from '../contexto/ContextoSesion.jsx';
import * as catalogo from '../servicios/catalogoServicio.js';
import { validarServicio, sinErrores } from '../utilidades/validaciones.js';
import { formatearMoneda, formatearDuracion, recortar } from '../utilidades/formato.js';
import Alerta from '../componentes/Alerta.jsx';
import Boton from '../componentes/Boton.jsx';
import CampoTexto from '../componentes/CampoTexto.jsx';
import Cargando from '../componentes/Cargando.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

const FORMULARIO_VACIO = {
  codigo: '', nombre: '', descripcion: '', categoria: '',
  precioBase: '', tiempoEstimadoHoras: '', activo: true,
};

export default function Catalogo() {
  const { rol } = useSesion();
  const esAdministrador = rol === 'administrador';

  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtro, setFiltro] = useState({ categoria: '', busqueda: '' });
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(null);
  const [aviso, setAviso] = useState(null);

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [editando, setEditando] = useState(null);
  const [errores, setErrores] = useState({});
  const [detalles, setDetalles] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [abierto, setAbierto] = useState(false);

  async function cargar() {
    setCargando(true);
    setFallo(null);
    try {
      const [lista, cats] = await Promise.all([
        catalogo.listarServicios(filtro),
        catalogo.listarCategorias(),
      ]);
      setServicios(lista.servicios);
      setCategorias(cats.categorias);
    } catch (error) {
      setFallo(error.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [filtro.categoria]); // eslint-disable-line react-hooks/exhaustive-deps

  const cambiarFormulario = (e) => {
    const { name, value, type, checked } = e.target;
    setFormulario({ ...formulario, [name]: type === 'checkbox' ? checked : value });
  };

  function abrirNuevo() {
    setFormulario(FORMULARIO_VACIO);
    setEditando(null);
    setErrores({});
    setDetalles([]);
    setAbierto(true);
  }

  function abrirEdicion(servicio) {
    setFormulario({
      codigo: servicio.codigo,
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      categoria: servicio.categoria,
      precioBase: String(servicio.precio_base),
      tiempoEstimadoHoras: String(servicio.tiempo_estimado_horas),
      activo: Boolean(servicio.activo),
    });
    setEditando(servicio.id);
    setErrores({});
    setDetalles([]);
    setAbierto(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setFallo(null);
    setDetalles([]);

    const encontrados = validarServicio(formulario);
    setErrores(encontrados);
    if (!sinErrores(encontrados)) return;

    const cuerpo = {
      ...formulario,
      precioBase: Number(formulario.precioBase),
      tiempoEstimadoHoras: Number(formulario.tiempoEstimadoHoras),
    };

    setGuardando(true);
    try {
      if (editando) {
        await catalogo.actualizarServicio(editando, cuerpo);
        setAviso('Servicio actualizado correctamente.');
      } else {
        await catalogo.crearServicio(cuerpo);
        setAviso('Servicio creado correctamente.');
      }
      setAbierto(false);
      await cargar();
    } catch (error) {
      setFallo(error.message);
      setDetalles(error.errores || []);
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(servicio) {
    setFallo(null);
    setAviso(null);
    try {
      await catalogo.eliminarServicio(servicio.id);
      setAviso(`El servicio ${servicio.codigo} fue eliminado.`);
      await cargar();
    } catch (error) {
      setFallo(error.message);
    }
  }

  const columnas = [
    { clave: 'codigo', titulo: 'Código' },
    { clave: 'nombre', titulo: 'Servicio' },
    { clave: 'categoria', titulo: 'Categoría' },
    {
      clave: 'descripcion', titulo: 'Descripción',
      dibujar: (f) => recortar(f.descripcion, 70),
    },
    { clave: 'precio_base', titulo: 'Precio base', dibujar: (f) => formatearMoneda(f.precio_base) },
    {
      clave: 'tiempo_estimado_horas', titulo: 'Tiempo', centrado: true,
      dibujar: (f) => formatearDuracion(f.tiempo_estimado_horas),
    },
    {
      clave: 'activo', titulo: 'Estado', centrado: true,
      dibujar: (f) => (
        <span className={`insignia insignia--${f.activo ? 'verde' : 'gris'}`}>
          {f.activo ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ];

  if (esAdministrador) {
    columnas.push({
      clave: 'acciones', titulo: 'Acciones', centrado: true,
      dibujar: (f) => (
        <div className="acciones-fila">
          <button type="button" className="enlace" onClick={() => abrirEdicion(f)}>Editar</button>
          <button type="button" className="enlace enlace--peligro" onClick={() => borrar(f)}>
            Eliminar
          </button>
        </div>
      ),
    });
  }

  return (
    <>
      <div className="pagina__cabecera">
        <h1 className="pagina__titulo">Catálogo de servicios</h1>
        <p className="pagina__descripcion">
          {esAdministrador
            ? 'Servicios que la empresa ofrece. Desde aquí se crean, se editan y se desactivan.'
            : 'Servicios disponibles para solicitar.'}
        </p>
      </div>

      {fallo && <Alerta tipo="error" detalles={detalles}>{fallo}</Alerta>}
      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}

      <Tarjeta
        titulo="Servicios"
        acciones={esAdministrador && (
          <Boton variante="primario" onClick={abrirNuevo}>Nuevo servicio</Boton>
        )}
      >
        <div className="filtros">
          <CampoTexto
            etiqueta="Categoría" nombre="categoria" id="filtro-categoria" valor={filtro.categoria}
            onChange={(e) => setFiltro({ ...filtro, categoria: e.target.value })}
            opciones={categorias.map((c) => ({ valor: c, texto: c }))}
          />
          <div className="filtros__accion">
            <Boton variante="tenue" onClick={cargar}>Actualizar</Boton>
          </div>
        </div>

        {cargando ? <Cargando /> : (
          <Tabla columnas={columnas} filas={servicios} vacio="No hay servicios en el catálogo." />
        )}
      </Tarjeta>

      {abierto && esAdministrador && (
        <Tarjeta
          titulo={editando ? 'Editar servicio' : 'Nuevo servicio'}
          acciones={<Boton variante="tenue" onClick={() => setAbierto(false)}>Cerrar</Boton>}
        >
          <form onSubmit={guardar} noValidate>
            <div className="rejilla rejilla--2">
              <CampoTexto
                etiqueta="Código" nombre="codigo" requerido
                valor={formulario.codigo} onChange={cambiarFormulario} error={errores.codigo}
                ayuda="Formato AAA-000, por ejemplo SOP-001."
              />
              <CampoTexto
                etiqueta="Categoría" nombre="categoria" requerido
                valor={formulario.categoria} onChange={cambiarFormulario} error={errores.categoria}
              />
              <CampoTexto
                etiqueta="Nombre" nombre="nombre" requerido
                valor={formulario.nombre} onChange={cambiarFormulario} error={errores.nombre}
              />
              <CampoTexto
                etiqueta="Precio base" nombre="precioBase" tipo="number" requerido
                valor={formulario.precioBase} onChange={cambiarFormulario} error={errores.precioBase}
              />
              <CampoTexto
                etiqueta="Tiempo estimado (horas)" nombre="tiempoEstimadoHoras" tipo="number" requerido
                valor={formulario.tiempoEstimadoHoras} onChange={cambiarFormulario}
                error={errores.tiempoEstimadoHoras}
              />
              <div className="campo campo--casilla">
                <label htmlFor="campo-activo">
                  <input
                    id="campo-activo" type="checkbox" name="activo"
                    checked={formulario.activo} onChange={cambiarFormulario}
                  />
                  {' '}Servicio activo (admite solicitudes nuevas)
                </label>
              </div>
            </div>

            <CampoTexto
              etiqueta="Descripción" nombre="descripcion" filas={3} requerido
              valor={formulario.descripcion} onChange={cambiarFormulario} error={errores.descripcion}
            />

            <div className="formulario__acciones">
              <Boton tipo="submit" cargando={guardando}>
                {editando ? 'Guardar cambios' : 'Crear servicio'}
              </Boton>
              <Boton variante="tenue" onClick={() => setAbierto(false)}>Cancelar</Boton>
            </div>
          </form>
        </Tarjeta>
      )}
    </>
  );
}
