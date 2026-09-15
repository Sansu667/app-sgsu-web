/**
 * Módulo de autenticación — vista de inicio de sesión.
 */
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useSesion } from '../contexto/ContextoSesion.jsx';
import { validarInicioSesion, sinErrores } from '../utilidades/validaciones.js';
import Alerta from '../componentes/Alerta.jsx';
import Boton from '../componentes/Boton.jsx';
import CampoTexto from '../componentes/CampoTexto.jsx';

const CUENTAS_DEMO = [
  ['admin', 'Admin2026*', 'administrador'],
  ['laura.tecnico', 'Tecnico2026*', 'técnico'],
  ['ana.gomez', 'Usuario2026*', 'cliente'],
];

export default function IniciarSesion() {
  const { entrar, autenticado } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();

  const [datos, setDatos] = useState({ nombreUsuario: '', contrasena: '' });
  const [errores, setErrores] = useState({});
  const [fallo, setFallo] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (autenticado) return <Navigate to="/panel" replace />;

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setFallo(null);

    const encontrados = validarInicioSesion(datos);
    setErrores(encontrados);
    if (!sinErrores(encontrados)) return;

    setEnviando(true);
    try {
      await entrar(datos.nombreUsuario.trim(), datos.contrasena);
      navegar(ubicacion.state?.desde || '/panel', { replace: true });
    } catch (error) {
      setFallo(error.mensaje || error.message);
    } finally {
      setEnviando(false);
    }
  }

  function usarCuenta(usuario, clave) {
    setDatos({ nombreUsuario: usuario, contrasena: clave });
    setErrores({});
  }

  return (
    <div className="acceso">
      <div className="acceso__panel">
        <h1 className="acceso__titulo">SGSU</h1>
        <p className="acceso__subtitulo">Sistema de Gestión de Solicitudes de Servicios</p>

        <form className="acceso__formulario" onSubmit={enviar} noValidate>
          <h2 className="acceso__encabezado">Iniciar sesión</h2>

          {fallo && <Alerta tipo="error">{fallo}</Alerta>}

          <CampoTexto
            etiqueta="Nombre de usuario" nombre="nombreUsuario" requerido
            valor={datos.nombreUsuario} onChange={cambiar} error={errores.nombreUsuario}
          />
          <CampoTexto
            etiqueta="Contraseña" nombre="contrasena" tipo="password" requerido
            valor={datos.contrasena} onChange={cambiar} error={errores.contrasena}
          />

          <Boton tipo="submit" cargando={enviando} ancho>Entrar</Boton>

          <p className="acceso__pie">
            ¿No tiene cuenta? <Link to="/registro">Regístrese como cliente</Link>
          </p>
        </form>

        <div className="acceso__demo">
          <p className="acceso__demo-titulo">Cuentas de demostración</p>
          {CUENTAS_DEMO.map(([usuario, clave, rol]) => (
            <button
              key={usuario} type="button" className="acceso__demo-boton"
              onClick={() => usarCuenta(usuario, clave)}
            >
              <span className="acceso__demo-rol">{rol}</span>
              <span className="acceso__demo-usuario">{usuario}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
