/**
 * Funciones de formato que usan las vistas.
 * Están aparte de los componentes para poder probarlas por separado.
 */

/** Formatea un valor numérico como moneda colombiana. */
export function formatearMoneda(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(numero);
}

/** Convierte "2026-09-18 10:25:03" en "18/09/2026, 10:25". */
export function formatearFechaHora(texto) {
  if (!texto) return '—';
  const fecha = new Date(String(texto).replace(' ', 'T'));
  if (Number.isNaN(fecha.getTime())) return String(texto);
  const dd = String(fecha.getDate()).padStart(2, '0');
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const hh = String(fecha.getHours()).padStart(2, '0');
  const mi = String(fecha.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${fecha.getFullYear()}, ${hh}:${mi}`;
}

/** Devuelve solo la fecha: "18/09/2026". */
export function formatearFecha(texto) {
  const completa = formatearFechaHora(texto);
  return completa === '—' ? completa : completa.split(',')[0];
}

/** Convierte "en_proceso" en "En proceso". */
export function formatearEstado(estado) {
  if (!estado) return '—';
  const texto = String(estado).replace(/_/g, ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Convierte horas decimales en "1 h 30 min". */
export function formatearDuracion(horas) {
  const numero = Number(horas);
  if (!Number.isFinite(numero) || numero <= 0) return '—';
  const h = Math.floor(numero);
  const m = Math.round((numero - h) * 60);
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}

/** Recorta un texto largo para mostrarlo en una tabla. */
export function recortar(texto, largo = 60) {
  const valor = String(texto || '');
  return valor.length <= largo ? valor : `${valor.slice(0, largo - 1)}…`;
}
