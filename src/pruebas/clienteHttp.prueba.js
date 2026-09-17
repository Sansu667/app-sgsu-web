/**
 * Pruebas unitarias del módulo de servicios: cliente HTTP.
 *
 * Se reemplaza fetch por un doble de prueba para verificar la petición que
 * arma el cliente sin necesidad de tener la API arriba; así la prueba es
 * unitaria de verdad y no depende de la red.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  peticion, obtener, enviar, eliminar,
  definirToken, obtenerToken, ErrorApi,
} from '../servicios/clienteHttp.js';

/** Construye una respuesta falsa con la forma que devuelve fetch. */
function respuestaFalsa(cuerpo, ok = true, status = 200) {
  return { ok, status, json: async () => cuerpo };
}

beforeEach(() => {
  definirToken(null);
  global.fetch = vi.fn();
});

describe('manejo del token', () => {
  it('guarda y limpia el token en memoria', () => {
    definirToken('abc.def.ghi');
    expect(obtenerToken()).toBe('abc.def.ghi');
    definirToken(null);
    expect(obtenerToken()).toBeNull();
  });

  it('agrega el encabezado Authorization cuando hay token', async () => {
    definirToken('token-de-prueba');
    global.fetch.mockResolvedValue(respuestaFalsa({ solicitudes: [] }));

    await obtener('api/solicitudes');

    const [, opciones] = global.fetch.mock.calls[0];
    expect(opciones.headers.Authorization).toBe('Bearer token-de-prueba');
  });

  it('no agrega el encabezado cuando no hay sesión', async () => {
    global.fetch.mockResolvedValue(respuestaFalsa({ servicios: [] }));

    await obtener('api/servicios');

    const [, opciones] = global.fetch.mock.calls[0];
    expect(opciones.headers.Authorization).toBeUndefined();
  });
});

describe('armado de la petición', () => {
  it('convierte los parámetros en una cadena de consulta', async () => {
    global.fetch.mockResolvedValue(respuestaFalsa({ solicitudes: [] }));

    await obtener('api/solicitudes', { estado: 'registrada', pagina: 2 });

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain('api/solicitudes?');
    expect(url).toContain('estado=registrada');
    expect(url).toContain('pagina=2');
  });

  it('descarta los parámetros vacíos para no ensuciar la URL', async () => {
    global.fetch.mockResolvedValue(respuestaFalsa({ solicitudes: [] }));

    await obtener('api/solicitudes', { estado: '', prioridad: null, pagina: 1 });

    const [url] = global.fetch.mock.calls[0];
    expect(url).not.toContain('estado=');
    expect(url).not.toContain('prioridad=');
    expect(url).toContain('pagina=1');
  });

  it('envía el cuerpo en JSON y declara el tipo de contenido', async () => {
    global.fetch.mockResolvedValue(respuestaFalsa({ solicitud: { id: 9 } }, true, 201));

    await enviar('api/solicitudes', { idServicio: 3, descripcion: 'Falla de red' });

    const [, opciones] = global.fetch.mock.calls[0];
    expect(opciones.method).toBe('POST');
    expect(opciones.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(opciones.body)).toEqual({ idServicio: 3, descripcion: 'Falla de red' });
  });

  it('usa el método DELETE y no manda cuerpo al eliminar', async () => {
    global.fetch.mockResolvedValue(respuestaFalsa({ mensaje: 'Eliminada' }));

    await eliminar('api/solicitudes/7');

    const [, opciones] = global.fetch.mock.calls[0];
    expect(opciones.method).toBe('DELETE');
    expect(opciones.body).toBeUndefined();
  });

  it('no duplica la barra cuando la ruta empieza con /', async () => {
    global.fetch.mockResolvedValue(respuestaFalsa({}));

    await peticion('/api/salud');

    const [url] = global.fetch.mock.calls[0];
    expect(url).not.toContain('//api/salud');
  });
});

describe('manejo de errores', () => {
  it('lanza ErrorApi con el mensaje que devuelve la API', async () => {
    global.fetch.mockResolvedValue(
      respuestaFalsa({ mensaje: 'Credenciales inválidas.' }, false, 401),
    );

    await expect(enviar('api/autenticacion/iniciar-sesion', {}))
      .rejects.toThrow('Credenciales inválidas.');
  });

  it('conserva el código HTTP y la lista de errores de validación', async () => {
    global.fetch.mockResolvedValue(respuestaFalsa(
      { mensaje: 'Datos inválidos.', errores: ['El correo es obligatorio.'] },
      false, 422,
    ));

    try {
      await enviar('api/usuarios', {});
      throw new Error('La petición debió fallar.');
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorApi);
      expect(error.codigo).toBe(422);
      expect(error.errores).toEqual(['El correo es obligatorio.']);
    }
  });

  it('avisa con un mensaje entendible cuando el servidor no responde', async () => {
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(obtener('api/solicitudes')).rejects.toThrow(/no se pudo conectar/i);
  });

  it('arma un mensaje propio cuando el error no trae cuerpo', async () => {
    global.fetch.mockResolvedValue({
      ok: false, status: 500, json: async () => { throw new Error('sin cuerpo'); },
    });

    await expect(obtener('api/reportes/carga-por-tecnico')).rejects.toThrow('Error 500');
  });
});
