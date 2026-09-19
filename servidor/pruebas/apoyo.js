/**
 * Apoyo para las pruebas del servidor (versión 1.2).
 * Levanta la API en un puerto libre con base de datos en memoria y ofrece
 * una función corta para hacer peticiones.
 */
process.env.RUTA_BASE_DATOS = ':memory:';
process.env.MODO_PRUEBAS = '1';
process.env.REGISTRO_PETICIONES = '0'; // sin el registro de cada petición en la consola

const aplicacion = require('../servidor.js');

async function levantar() {
  const servidor = await new Promise((resolver) => {
    const s = aplicacion.listen(0, '127.0.0.1', () => resolver(s));
  });
  const base = `http://127.0.0.1:${servidor.address().port}/api`;

  async function pedir(metodo, ruta, { cuerpo, token, ip } = {}) {
    const cabeceras = { 'Content-Type': 'application/json' };
    if (token) cabeceras.Authorization = `Bearer ${token}`;
    if (ip) cabeceras['X-Forwarded-For'] = ip; // simula clientes distintos detrás del proxy
    const r = await fetch(base + ruta, {
      method: metodo, headers: cabeceras, body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    return { estado: r.status, cabeceras: r.headers, datos: await r.json().catch(() => ({})) };
  }

  async function iniciar(usuario, contrasena, ip) {
    const r = await pedir('POST', '/autenticacion/login', {
      cuerpo: { nombreUsuario: usuario, contrasena }, ip,
    });
    return r;
  }

  const cerrar = () => new Promise((resolver) => servidor.close(resolver));
  return { base, pedir, iniciar, cerrar };
}

module.exports = { levantar };
