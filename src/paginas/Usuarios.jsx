/**
 * Módulo de gestión de usuarios. Solo para el rol administrador.
 */
import { useEffect, useState } from 'react';

import * as usuarios from '../servicios/usuarioServicio.js';
import { validarRegistro, sinErrores } from '../utilidades/validaciones.js';
import { formatearFecha } from '../utilidades/formato.js';
import Alerta from '../componentes/Alerta.jsx';
import Boton from '../componentes/Boton.jsx';
import CampoTexto from '../componentes/CampoTexto.jsx';
import Cargando from '../componentes/Cargando.jsx';
import Tabla from '../componentes/Tabla.jsx';
import Tarjeta from '../componentes/Tarjeta.jsx';

const FORMULARIO_VACIO = {
  nombreCompleto: '', documento: '', correo: '', nombreUsuario: '',
  contrasena: '', telefono: '', rol: 'cliente',
};

export default function Usuarios() {
  const [lista, setLista] = useState({ usuarios: [], total: 0 });
  const [roles, setRoles] = useState([]);
  const [filtro, setFiltro] = useState({ rol: '', estado: '', busqueda: '' });
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [aviso, setAviso] = useState(null);

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errores, setErrores] = useState({});
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setCargando(true);
    setFallo(null);
    try {
      const [datos, catalogoRoles] = await Promise.all([
        usuarios.listarUsuarios({ ...filtro, tamano: 50 }),
        usuarios.listarRoles(),
      ]);
      setLista(datos);
      setRoles(catalogoRoles.roles);
    } catch (error) {
      setFallo(error.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, [filtro.rol, filtro.estado]); // eslint-disable-line react-hooks/exhaustive-deps

  const cambiarFormulario = (e) =>
    setFormulario({ ...formulario, [e.target.name]: e.target.value });

  async function crear(e) {
    e.preventDefault();
    setFallo(null);
    setDetalles([]);

    const encontrados = validarRegistro(formulario);
    setErrores(encontrados);
    if (!sinErrores(encontrados)) return;

    setGuardando(true);
    try {
      await usuarios.crearUsuario(formulario);
      setAviso(`Usuario ${formulario.nombreUsuario} creado con rol ${formulario.rol}.`);
      setFormulario(FORMULARIO_VACIO);
      setAbierto(false);
      await cargar();
    } catch (error) {
      setFallo(error.message);
      setDetalles(error.errores || []);
    } finally {
      setGuardando(false);
    }
  }

  async function alternarEstado(usuario) {
    const nuevo = usuario.estado === 'activo' ? 'inactivo' : 'activo';
    setFallo(null);
    setAviso(null);
    try {
      await usuarios.cambiarEstadoUsuario(usuario.id, nuevo);
      setAviso(`La cuenta de ${usuario.nombre_completo} quedó ${nuevo}.`);
      await cargar();
    } catch (error) {
      setFallo(error.message);
    }
  }

  async function borrar(usuario) {
    setFallo(null);
    setAviso(null);
    try {
      await usuarios.eliminarUsuario(usuario.id);
      setAviso(`El usuario ${usuario.nombre_usuario} fue eliminado.`);
      await cargar();
    } catch (error) {
      setFallo(error.message);
    }
  }

  const columnas = [
    { clave: 'nombre_completo', titulo: 'Nombre' },
    { clave: 'documento', titulo: 'Documento' },
    { clave: 'correo', titulo: 'Correo' },
    { clave: 'nombre_usuario', titulo: 'Usuario' },
    { clave: 'rol', titulo: 'Rol', centrado: true },
    {
      clave: 'estado', titulo: 'Estado', centrado: true,
      dibujar: (f) => (
        <span className={`insignia insignia--${f.estado === 'activo' ? 'verde' : 'gris'}`}>
          {f.estado}
        </span>
      ),
    },
    {
      clave: 'fecha_registro', titulo: 'Registro',
      dibujar: (f) => formatearFecha(f.fecha_registro),
    },
    {
      clave: 'acciones', titulo: 'Acciones', centrado: true,
      dibujar: (f) => (
        <div className="acciones-fila">
          <button type="button" className="enlace" onClick={() => alternarEstado(f)}>
            {f.estado === 'activo' ? 'Inactivar' : 'Activar'}
          </button>
          <button type="button" className="enlace enlace--peligro" onClick={() => borrar(f)}>
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="pagina__cabecera">
        <h1 className="pagina__titulo">Usuarios</h1>
        <p className="pagina__descripcion">
          Administración de las cuentas del sistema. Los técnicos y los administradores
          solo se crean desde aquí.
        </p>
      </div>

      {fallo && <Alerta tipo="error" detalles={detalles}>{fallo}</Alerta>}
      {aviso && <Alerta tipo="exito">{aviso}</Alerta>}

      <Tarjeta
        titulo={`${lista.total} usuario${lista.total === 1 ? '' : 's'}`}
        acciones={<Boton onClick={() => setAbierto(!abierto)}>
          {abierto ? 'Cerrar formulario' : 'Nuevo usuario'}
        </Boton>}
      >
        <div className="filtros">
          <CampoTexto
            etiqueta="Rol" nombre="rol" id="filtro-rol" valor={filtro.rol}
            onChange={(e) => setFiltro({ ...filtro, rol: e.target.value })}
            opciones={roles.map((r) => ({ valor: r.nombre, texto: r.nombre }))}
          />
          <CampoTexto
            etiqueta="Estado" nombre="estado" id="filtro-estado" valor={filtro.estado}
            onChange={(e) => setFiltro({ ...filtro, estado: e.target.value })}
            opciones={[
              { valor: 'activo', texto: 'Activo' },
              { valor: 'inactivo', texto: 'Inactivo' },
            ]}
          />
          <div className="filtros__accion">
            <Boton variante="tenue" onClick={cargar}>Actualizar</Boton>
          </div>
        </div>

        {cargando ? <Cargando /> : (
          <Tabla columnas={columnas} filas={lista.usuarios} vacio="No hay usuarios que coincidan." />
        )}
      </Tarjeta>

      {abierto && (
        <Tarjeta titulo="Nuevo usuario">
          <form onSubmit={crear} noValidate>
            <div className="rejilla rejilla--2">
              <CampoTexto
                etiqueta="Nombre completo" nombre="nombreCompleto" requerido
                valor={formulario.nombreCompleto} onChange={cambiarFormulario}
                error={errores.nombreCompleto}
              />
              <CampoTexto
                etiqueta="Documento" nombre="documento" requerido
                valor={formulario.documento} onChange={cambiarFormulario} error={errores.documento}
              />
              <CampoTexto
                etiqueta="Correo electrónico" nombre="correo" tipo="email" requerido
                valor={formulario.correo} onChange={cambiarFormulario} error={errores.correo}
              />
              <CampoTexto
                etiqueta="Teléfono" nombre="telefono"
                valor={formulario.telefono} onChange={cambiarFormulario} error={errores.telefono}
              />
              <CampoTexto
                etiqueta="Nombre de usuario" nombre="nombreUsuario" requerido
                valor={formulario.nombreUsuario} onChange={cambiarFormulario}
                error={errores.nombreUsuario}
              />
              <CampoTexto
                etiqueta="Contraseña" nombre="contrasena" tipo="password" requerido
                valor={formulario.contrasena} onChange={cambiarFormulario} error={errores.contrasena}
              />
              <CampoTexto
                etiqueta="Rol" nombre="rol" requerido
                valor={formulario.rol} onChange={cambiarFormulario}
                opciones={roles.map((r) => ({ valor: r.nombre, texto: r.nombre }))}
              />
            </div>

            <div className="formulario__acciones">
              <Boton tipo="submit" cargando={guardando}>Crear usuario</Boton>
              <Boton variante="tenue" onClick={() => setAbierto(false)}>Cancelar</Boton>
            </div>
          </form>
        </Tarjeta>
      )}
    </>
  );
}
