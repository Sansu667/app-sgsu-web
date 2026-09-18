/**
 * Punto de entrada de la API en el despliegue sin servidor (Vercel).
 *
 * El nombre del archivo entre dobles corchetes hace que esta función atienda
 * todas las rutas que empiecen por /api, de modo que el enrutamiento interno
 * lo sigue resolviendo Express exactamente igual que en el ambiente de
 * desarrollo. Así no hay dos versiones de la API: es el mismo código de la
 * carpeta servidor/, montado de dos maneras distintas.
 */
const aplicacion = require('../servidor/servidor.js');

module.exports = aplicacion;
