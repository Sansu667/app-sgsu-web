/**
 * Pruebas unitarias de las reglas de negocio que viven en el front:
 * qué acciones puede ejecutar cada rol sobre una solicitud (módulo de
 * solicitudes) y el cálculo de proporciones del módulo de reportes.
 *
 * Estas reglas también están en la API; aquí se prueban porque son las que
 * deciden qué botones ve el usuario.
 */
import { describe, expect, it } from 'vitest';

import { accionesDisponibles } from '../paginas/DetalleSolicitud.jsx';
import { porcentaje } from '../paginas/Reportes.jsx';

describe('accionesDisponibles — administrador', () => {
  it('puede cancelar una solicitud recién registrada', () => {
    expect(accionesDisponibles('registrada', 'administrador')).toEqual(['cancelada']);
  });

  it('puede iniciar el trabajo de una solicitud asignada', () => {
    expect(accionesDisponibles('asignada', 'administrador')).toEqual(['en_proceso', 'cancelada']);
  });

  it('puede cerrar una solicitud resuelta o devolverla a proceso', () => {
    expect(accionesDisponibles('resuelta', 'administrador')).toEqual(['cerrada', 'en_proceso']);
  });

  it('no ofrece ninguna acción sobre una solicitud cerrada o cancelada', () => {
    expect(accionesDisponibles('cerrada', 'administrador')).toEqual([]);
    expect(accionesDisponibles('cancelada', 'administrador')).toEqual([]);
  });
});

describe('accionesDisponibles — técnico', () => {
  it('puede mover una solicitud asignada a en proceso', () => {
    expect(accionesDisponibles('asignada', 'tecnico')).toContain('en_proceso');
  });

  it('puede marcar como resuelta una solicitud en proceso', () => {
    expect(accionesDisponibles('en_proceso', 'tecnico')).toContain('resuelta');
  });

  it('no puede cerrar la solicitud, porque el cierre lo hace el administrador', () => {
    expect(accionesDisponibles('resuelta', 'tecnico')).not.toContain('cerrada');
  });
});

describe('accionesDisponibles — cliente', () => {
  it('no puede cambiar el estado de ninguna solicitud', () => {
    ['registrada', 'asignada', 'en_proceso', 'resuelta'].forEach((estado) => {
      expect(accionesDisponibles(estado, 'cliente')).toEqual([]);
    });
  });
});

describe('accionesDisponibles — casos límite', () => {
  it('nunca ofrece "asignada" como cambio de estado, porque eso se hace asignando un técnico', () => {
    ['registrada', 'asignada', 'en_proceso', 'resuelta'].forEach((estado) => {
      expect(accionesDisponibles(estado, 'administrador')).not.toContain('asignada');
    });
  });

  it('devuelve una lista vacía si el estado no existe', () => {
    expect(accionesDisponibles('inventado', 'administrador')).toEqual([]);
  });
});

describe('porcentaje', () => {
  it('calcula la proporción y la redondea', () => {
    expect(porcentaje(25, 100)).toBe(25);
    expect(porcentaje(1, 3)).toBe(33);
  });

  it('devuelve cero cuando no hay solicitudes, sin dividir por cero', () => {
    expect(porcentaje(0, 0)).toBe(0);
    expect(porcentaje(5, undefined)).toBe(0);
  });

  it('llega a cien cuando todas las solicitudes están en el mismo estado', () => {
    expect(porcentaje(12, 12)).toBe(100);
  });
});
