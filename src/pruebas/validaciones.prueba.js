/**
 * Pruebas unitarias del módulo de utilidades: validaciones de formularios.
 * Cada caso comprueba que la regla detecte el dato incorrecto y que deje
 * pasar el dato correcto.
 */
import { describe, expect, it } from 'vitest';

import {
  validarInicioSesion, validarRegistro, validarSolicitud,
  validarServicio, sinErrores,
} from '../utilidades/validaciones.js';

const REGISTRO_VALIDO = {
  nombreCompleto: 'Edgar Santiago Suarez Alzate',
  documento: '1032456789',
  correo: 'edgar.suarez@correo.com',
  nombreUsuario: 'edgar.suarez',
  contrasena: 'Clave2026*',
  telefono: '3115557788',
};

describe('validarInicioSesion', () => {
  it('no reporta errores cuando los dos campos vienen llenos', () => {
    expect(sinErrores(validarInicioSesion({ nombreUsuario: 'admin', contrasena: 'Admin2026*' })))
      .toBe(true);
  });

  it('reporta los campos vacíos', () => {
    const errores = validarInicioSesion({ nombreUsuario: '   ', contrasena: '' });
    expect(errores.nombreUsuario).toBeDefined();
    expect(errores.contrasena).toBeDefined();
  });
});

describe('validarRegistro', () => {
  it('acepta un registro completo y bien escrito', () => {
    expect(sinErrores(validarRegistro(REGISTRO_VALIDO))).toBe(true);
  });

  it('rechaza un documento con letras o demasiado corto', () => {
    expect(validarRegistro({ ...REGISTRO_VALIDO, documento: '12ab' }).documento).toBeDefined();
    expect(validarRegistro({ ...REGISTRO_VALIDO, documento: '123' }).documento).toBeDefined();
  });

  it('rechaza un correo sin arroba o sin dominio', () => {
    expect(validarRegistro({ ...REGISTRO_VALIDO, correo: 'edgar.correo.com' }).correo).toBeDefined();
    expect(validarRegistro({ ...REGISTRO_VALIDO, correo: 'edgar@correo' }).correo).toBeDefined();
  });

  it('exige una contraseña de al menos ocho caracteres', () => {
    expect(validarRegistro({ ...REGISTRO_VALIDO, contrasena: 'Clave1' }).contrasena).toBeDefined();
  });

  it('compara la confirmación solo cuando el formulario la incluye', () => {
    const distintas = validarRegistro({ ...REGISTRO_VALIDO, confirmacion: 'Otra2026*' });
    expect(distintas.confirmacion).toBeDefined();

    const iguales = validarRegistro({ ...REGISTRO_VALIDO, confirmacion: 'Clave2026*' });
    expect(iguales.confirmacion).toBeUndefined();
  });

  it('deja pasar el teléfono vacío porque es opcional', () => {
    expect(validarRegistro({ ...REGISTRO_VALIDO, telefono: '' }).telefono).toBeUndefined();
    expect(validarRegistro({ ...REGISTRO_VALIDO, telefono: '123' }).telefono).toBeDefined();
  });

  it('no se cae cuando no recibe datos', () => {
    expect(sinErrores(validarRegistro(undefined))).toBe(false);
  });
});

describe('validarSolicitud', () => {
  const VALIDA = {
    idServicio: 3,
    descripcion: 'El equipo no enciende después del corte de energía.',
    direccion: 'Calle 45 # 12-30, Medellín',
  };

  it('acepta una solicitud bien diligenciada', () => {
    expect(sinErrores(validarSolicitud(VALIDA))).toBe(true);
  });

  it('exige que se elija un servicio', () => {
    expect(validarSolicitud({ ...VALIDA, idServicio: '' }).idServicio).toBeDefined();
  });

  it('exige una descripción de al menos diez caracteres', () => {
    expect(validarSolicitud({ ...VALIDA, descripcion: 'no sirve' }).descripcion).toBeDefined();
  });

  it('exige la dirección', () => {
    expect(validarSolicitud({ ...VALIDA, direccion: 'x' }).direccion).toBeDefined();
  });
});

describe('validarServicio', () => {
  const VALIDO = {
    codigo: 'SOP-001',
    nombre: 'Soporte técnico en sitio',
    descripcion: 'Atención presencial de fallas de hardware y software.',
    categoria: 'Soporte',
    precioBase: 85000,
    tiempoEstimadoHoras: 2,
  };

  it('acepta un servicio bien definido', () => {
    expect(sinErrores(validarServicio(VALIDO))).toBe(true);
  });

  it('exige el formato AAA-000 en el código', () => {
    expect(validarServicio({ ...VALIDO, codigo: 'sop-001' }).codigo).toBeDefined();
    expect(validarServicio({ ...VALIDO, codigo: 'SOP01' }).codigo).toBeDefined();
  });

  it('rechaza precios negativos y tiempos en cero', () => {
    expect(validarServicio({ ...VALIDO, precioBase: -1 }).precioBase).toBeDefined();
    expect(validarServicio({ ...VALIDO, tiempoEstimadoHoras: 0 }).tiempoEstimadoHoras).toBeDefined();
  });

  it('acepta un precio base en cero porque hay servicios de garantía', () => {
    expect(validarServicio({ ...VALIDO, precioBase: 0 }).precioBase).toBeUndefined();
  });
});

describe('sinErrores', () => {
  it('reconoce un objeto vacío como válido', () => {
    expect(sinErrores({})).toBe(true);
    expect(sinErrores(null)).toBe(true);
    expect(sinErrores({ correo: 'mal escrito' })).toBe(false);
  });
});
