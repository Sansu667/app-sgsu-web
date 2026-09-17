/**
 * Pruebas unitarias del módulo de utilidades: funciones de formato.
 * Se comprueban los valores normales y también los casos límite (nulos,
 * cadenas vacías y valores que no son números).
 */
import { describe, expect, it } from 'vitest';

import {
  formatearMoneda, formatearFechaHora, formatearFecha,
  formatearEstado, formatearDuracion, recortar,
} from '../utilidades/formato.js';

describe('formatearMoneda', () => {
  it('muestra el valor con el símbolo de pesos y sin decimales', () => {
    const resultado = formatearMoneda(85000);
    expect(resultado).toContain('85.000');
    expect(resultado).not.toContain(',00');
  });

  it('acepta números escritos como texto', () => {
    expect(formatearMoneda('120000')).toContain('120.000');
  });

  it('devuelve una raya cuando el valor no es un número', () => {
    expect(formatearMoneda('abc')).toBe('—');
    expect(formatearMoneda(null)).toContain('0');
  });
});

describe('formatearFechaHora', () => {
  it('convierte el formato de la base de datos al formato local', () => {
    expect(formatearFechaHora('2026-09-18 10:25:03')).toBe('18/09/2026, 10:25');
  });

  it('rellena con ceros los días y los meses de un dígito', () => {
    expect(formatearFechaHora('2026-01-05 08:07:00')).toBe('05/01/2026, 08:07');
  });

  it('devuelve una raya cuando no hay fecha', () => {
    expect(formatearFechaHora(null)).toBe('—');
    expect(formatearFechaHora('')).toBe('—');
  });

  it('devuelve el texto original cuando la fecha es inválida', () => {
    expect(formatearFechaHora('no es una fecha')).toBe('no es una fecha');
  });
});

describe('formatearFecha', () => {
  it('deja solo la parte de la fecha', () => {
    expect(formatearFecha('2026-09-18 10:25:03')).toBe('18/09/2026');
  });

  it('respeta la raya cuando no hay dato', () => {
    expect(formatearFecha(null)).toBe('—');
  });
});

describe('formatearEstado', () => {
  it('cambia el guion bajo por espacio y pone la primera letra en mayúscula', () => {
    expect(formatearEstado('en_proceso')).toBe('En proceso');
    expect(formatearEstado('registrada')).toBe('Registrada');
  });

  it('devuelve una raya cuando no hay estado', () => {
    expect(formatearEstado(undefined)).toBe('—');
  });
});

describe('formatearDuracion', () => {
  it('muestra horas y minutos', () => {
    expect(formatearDuracion(1.5)).toBe('1 h 30 min');
  });

  it('muestra solo horas cuando no hay minutos', () => {
    expect(formatearDuracion(3)).toBe('3 h');
  });

  it('muestra solo minutos cuando es menos de una hora', () => {
    expect(formatearDuracion(0.75)).toBe('45 min');
  });

  it('devuelve una raya para cero o valores inválidos', () => {
    expect(formatearDuracion(0)).toBe('—');
    expect(formatearDuracion('x')).toBe('—');
  });
});

describe('recortar', () => {
  it('deja intacto un texto más corto que el límite', () => {
    expect(recortar('Mantenimiento', 30)).toBe('Mantenimiento');
  });

  it('corta y agrega puntos suspensivos cuando el texto es largo', () => {
    const resultado = recortar('Mantenimiento preventivo de equipos de cómputo', 20);
    expect(resultado).toHaveLength(20);
    expect(resultado.endsWith('…')).toBe(true);
  });

  it('convierte los valores nulos en cadena vacía', () => {
    expect(recortar(null)).toBe('');
  });
});
