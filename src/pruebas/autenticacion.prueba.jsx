/**
 * Pruebas unitarias del módulo de autenticación:
 * el contexto de sesión y la vista de inicio de sesión.
 *
 * El servicio que habla con la API se reemplaza por un doble de prueba, de
 * modo que se prueba la lógica del front sin levantar el servidor.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { ProveedorSesion, useSesion } from '../contexto/ContextoSesion.jsx';
import { obtenerToken } from '../servicios/clienteHttp.js';
import { CLAVE_SESION } from '../configuracion/entorno.js';
import IniciarSesion from '../paginas/IniciarSesion.jsx';

vi.mock('../servicios/autenticacionServicio.js', () => ({
  iniciarSesion: vi.fn(),
  registrarUsuario: vi.fn(),
  consultarPerfil: vi.fn(),
  consultarSalud: vi.fn(),
}));

import * as autenticacion from '../servicios/autenticacionServicio.js';

const RESPUESTA = {
  token: 'jwt.de.prueba',
  usuario: { id: 1, nombre_completo: 'Edgar Santiago Suarez', rol: 'administrador' },
};

/** Componente auxiliar que expone el contexto para poder revisarlo. */
function Sonda() {
  const { autenticado, rol, usuario, entrar, salir } = useSesion();
  return (
    <div>
      <span data-testid="autenticado">{String(autenticado)}</span>
      <span data-testid="rol">{rol || 'sin rol'}</span>
      <span data-testid="usuario">{usuario ? usuario.nombre_completo : 'anónimo'}</span>
      <button type="button" onClick={() => entrar('admin', 'Admin2026*')}>entrar</button>
      <button type="button" onClick={salir}>salir</button>
    </div>
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe('ProveedorSesion', () => {
  it('arranca sin sesión cuando el navegador no tiene nada guardado', () => {
    render(<ProveedorSesion><Sonda /></ProveedorSesion>);
    expect(screen.getByTestId('autenticado')).toHaveTextContent('false');
    expect(screen.getByTestId('rol')).toHaveTextContent('sin rol');
  });

  it('guarda la sesión y el token cuando el inicio de sesión funciona', async () => {
    autenticacion.iniciarSesion.mockResolvedValue(RESPUESTA);

    render(<ProveedorSesion><Sonda /></ProveedorSesion>);
    await act(async () => { fireEvent.click(screen.getByText('entrar')); });

    expect(screen.getByTestId('autenticado')).toHaveTextContent('true');
    expect(screen.getByTestId('rol')).toHaveTextContent('administrador');
    expect(obtenerToken()).toBe('jwt.de.prueba');
    expect(JSON.parse(sessionStorage.getItem(CLAVE_SESION)).token).toBe('jwt.de.prueba');
  });

  it('borra la sesión y el token al salir', async () => {
    autenticacion.iniciarSesion.mockResolvedValue(RESPUESTA);

    render(<ProveedorSesion><Sonda /></ProveedorSesion>);
    await act(async () => { fireEvent.click(screen.getByText('entrar')); });
    await act(async () => { fireEvent.click(screen.getByText('salir')); });

    expect(screen.getByTestId('autenticado')).toHaveTextContent('false');
    expect(obtenerToken()).toBeNull();
    expect(sessionStorage.getItem(CLAVE_SESION)).toBeNull();
  });

  it('recupera la sesión guardada al recargar la página', () => {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(RESPUESTA));

    render(<ProveedorSesion><Sonda /></ProveedorSesion>);

    expect(screen.getByTestId('autenticado')).toHaveTextContent('true');
    expect(screen.getByTestId('usuario')).toHaveTextContent('Edgar Santiago Suarez');
    expect(obtenerToken()).toBe('jwt.de.prueba');
  });

  it('avisa cuando se usa el hook por fuera del proveedor', () => {
    const silencio = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Sonda />)).toThrow(/ProveedorSesion/);
    silencio.mockRestore();
  });
});

describe('Vista de inicio de sesión', () => {
  const montar = () => render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ProveedorSesion><IniciarSesion /></ProveedorSesion>
    </MemoryRouter>,
  );

  it('no llama a la API si los campos están vacíos', async () => {
    montar();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Entrar' })); });

    expect(screen.getByText('Escriba su nombre de usuario.')).toBeInTheDocument();
    expect(screen.getByText('Escriba su contraseña.')).toBeInTheDocument();
    expect(autenticacion.iniciarSesion).not.toHaveBeenCalled();
  });

  it('llena el formulario con la cuenta de demostración que se elija', () => {
    montar();
    fireEvent.click(screen.getByText('laura.tecnico'));
    expect(screen.getByLabelText(/Nombre de usuario/)).toHaveValue('laura.tecnico');
  });

  it('envía las credenciales a la API cuando el formulario está completo', async () => {
    autenticacion.iniciarSesion.mockResolvedValue(RESPUESTA);
    montar();

    fireEvent.click(screen.getByText('admin'));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Entrar' })); });

    expect(autenticacion.iniciarSesion).toHaveBeenCalledWith('admin', 'Admin2026*');
  });

  it('muestra el mensaje de la API cuando las credenciales no sirven', async () => {
    autenticacion.iniciarSesion.mockRejectedValue(new Error('Credenciales inválidas.'));
    montar();

    fireEvent.click(screen.getByText('admin'));
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Entrar' })); });

    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas.')).toBeInTheDocument();
    });
  });
});
