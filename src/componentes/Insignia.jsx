/**
 * Insignia de color para los estados y las prioridades de una solicitud.
 * Centraliza el color de cada estado para que todas las vistas lo muestren igual.
 */
import { formatearEstado } from '../utilidades/formato.js';

const COLOR_ESTADO = {
  registrada: 'gris',
  asignada: 'azul',
  en_proceso: 'ambar',
  resuelta: 'verde',
  cerrada: 'verde-oscuro',
  cancelada: 'rojo',
};

const COLOR_PRIORIDAD = { baja: 'gris', media: 'azul', alta: 'rojo' };

export function colorDeEstado(estado) {
  return COLOR_ESTADO[estado] || 'gris';
}

export default function Insignia({ valor, tipo = 'estado' }) {
  const color = tipo === 'prioridad'
    ? (COLOR_PRIORIDAD[valor] || 'gris')
    : colorDeEstado(valor);
  return <span className={`insignia insignia--${color}`}>{formatearEstado(valor)}</span>;
}
