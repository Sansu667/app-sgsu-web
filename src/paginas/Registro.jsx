/**
 * Módulo de autenticación — registro público de clientes.
 * La API siempre crea estos usuarios con el rol cliente.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { registrarUsuario } from '../servicios/autenticacionServicio.js';
import { validarRegistro, sinErrores } from '../utilidades/validaciones.js';
import Alerta from '../componentes/Alerta.jsx';
import Boton from '../componentes/Boton.jsx';
import CampoTexto from '../componentes/CampoTexto.jsx';

const INICIAL = {
  nombreCompleto: '', documento: '', correo: '',
  nombreUsuario: '', contrasena: '', confirmacion: '', telefono: '',
};

export default function Registro() {
  const navegar = useNavigate();
  const [datos, setDatos] = useState(INICIAL);
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setFallo(null);
    setDetalles([]);

    const encontrados = validarRegistro(datos);
    setErrores(encontrados);
    if (!sinErrores(encontrados)) return;

    setEnviando(true);
    try {
      const { confirmacion, ...cuerpo } = datos;
      await registrarUsuario(cuerpo);
      setListo(true);
      setTimeout(() => navegar('/entrar'), 2200);
    } catch (error) {
      setFallo(error.message);
      setDetalles(error.errores || []);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="acceso">
      <div className="acceso__panel acceso__panel--ancho">
        <h1 className="acceso__titulo">SGSU</h1>
        <p className="acceso__subtitulo">Crear una cuenta de cliente</p>

        <form className="acceso__formulario" onSubmit={enviar} noValidate>
          {listo && (
            <Alerta tipo="exito" titulo="Cuenta creada">
              Ya puede iniciar sesión. Lo estamos llevando al inicio de sesión…
            </Alerta>
          )}
          {fallo && <Alerta tipo="error" detalles={detalles}>{fallo}</Alerta>}

          <div className="rejilla rejilla--2">
            <CampoTexto
              etiqueta="Nombre completo" nombre="nombreCompleto" requerido
              valor={datos.nombreCompleto} onChange={cambiar} error={errores.nombreCompleto}
            />
            <CampoTexto
              etiqueta="Documento" nombre="documento" requerido
              valor={datos.documento} onChange={cambiar} error={errores.documento}
              ayuda="Solo números, entre 6 y 15 dígitos."
            />
            <CampoTexto
              etiqueta="Correo electrónico" nombre="correo" tipo="email" requerido
              valor={datos.correo} onChange={cambiar} error={errores.correo}
            />
            <CampoTexto
              etiqueta="Teléfono" nombre="telefono"
              valor={datos.telefono} onChange={cambiar} error={errores.telefono}
              ayuda="Opcional."
            />
            <CampoTexto
              etiqueta="Nombre de usuario" nombre="nombreUsuario" requerido
              valor={datos.nombreUsuario} onChange={cambiar} error={errores.nombreUsuario}
            />
            <div />
            <CampoTexto
              etiqueta="Contraseña" nombre="contrasena" tipo="password" requerido
              valor={datos.contrasena} onChange={cambiar} error={errores.contrasena}
              ayuda="Mínimo 8 caracteres."
            />
            <CampoTexto
              etiqueta="Confirmar contraseña" nombre="confirmacion" tipo="password" requerido
              valor={datos.confirmacion} onChange={cambiar} error={errores.confirmacion}
            />
          </div>

          <Boton tipo="submit" cargando={enviando} deshabilitado={listo} ancho>
            Crear cuenta
          </Boton>

          <p className="acceso__pie">
            ¿Ya tiene cuenta? <Link to="/entrar">Inicie sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
