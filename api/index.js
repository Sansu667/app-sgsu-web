/**
 * Punto de entrada de la API en el despliegue sin servidor (Vercel).
 *
 * vercel.json reescribe toda petición /api/<ruta> hacia esta función y le
 * pasa la ruta original en el parámetro __ruta. Aquí se reconstruye la URL
 * que pidió el navegador antes de entregársela a Express, de modo que el
 * enrutamiento interno funciona igual que en el ambiente de desarrollo. Así
 * no hay dos versiones de la API: es el mismo código de la carpeta servidor/.
 */
const aplicacion = require('../servidor/servidor.js');

module.exports = (peticion, respuesta) => {
  const url = new URL(peticion.url, 'http://localhost');
  const ruta = url.searchParams.get('__ruta');
  if (ruta !== null) {
    url.searchParams.delete('__ruta');
    const consulta = url.searchParams.toString();
    peticion.url = `/api/${ruta}${consulta ? `?${consulta}` : ''}`;
  }
  return aplicacion(peticion, respuesta);
};
