/**
 * Límite de intentos fallidos de inicio de sesión (NF-02, versión 1.2).
 *
 * Después de LIMITE_INTENTOS fallos seguidos (5 por defecto) desde la misma IP
 * y para el mismo nombre de usuario, el inicio de sesión se bloquea durante
 * VENTANA_INTENTOS_MS (15 minutos por defecto) y responde 429.
 *
 * Decisión de diseño: la clave es IP + usuario y no solo la IP. Si fuera solo
 * la IP, un atacante bloquearía a todas las personas que comparten una misma
 * red (por ejemplo, un ambiente de formación). Así, un usuario bloqueado no
 * afecta a los demás.
 *
 * Los contadores viven en memoria. En el despliegue sin servidor cada instancia
 * tiene los suyos; para varias instancias habría que llevarlos a un almacén común.
 */
const LIMITE = Number(process.env.LIMITE_INTENTOS) || 5;
const VENTANA_MS = Number(process.env.VENTANA_INTENTOS_MS) || 15 * 60 * 1000;

const registros = new Map();

const clave = (ip, usuario) => `${ip}|${String(usuario || '').trim().toLowerCase()}`;

function vigente(registro, ahora) {
  return registro && ahora - registro.desde < VENTANA_MS;
}

/** Devuelve los segundos que faltan si la combinación está bloqueada, o 0 si no. */
function segundosBloqueo(ip, usuario, ahora = Date.now()) {
  const r = registros.get(clave(ip, usuario));
  if (!vigente(r, ahora)) return 0;
  if (r.fallos < LIMITE) return 0;
  return Math.ceil((r.desde + VENTANA_MS - ahora) / 1000);
}

function registrarFallo(ip, usuario, ahora = Date.now()) {
  // Limpieza de registros vencidos para que el mapa no crezca sin control.
  if (registros.size > 10000) {
    for (const [k, r] of registros) if (!vigente(r, ahora)) registros.delete(k);
  }
  const k = clave(ip, usuario);
  const r = registros.get(k);
  if (!vigente(r, ahora)) registros.set(k, { fallos: 1, desde: ahora });
  else r.fallos += 1;
  return registros.get(k).fallos;
}

function reiniciar(ip, usuario) {
  registros.delete(clave(ip, usuario));
}

function limpiarTodo() {
  registros.clear();
}

module.exports = { segundosBloqueo, registrarFallo, reiniciar, limpiarTodo, LIMITE, VENTANA_MS };
