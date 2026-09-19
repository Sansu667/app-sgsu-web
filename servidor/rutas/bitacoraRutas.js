/** Rutas del sello de integridad de la bitácora. Uso exclusivo del administrador. */
const express = require('express');

const controlador = require('../controladores/bitacoraControlador');
const { verificarToken } = require('../middleware/verificarToken');
const verificarRol = require('../middleware/verificarRol');

const rutas = express.Router();

rutas.use(verificarToken, verificarRol('administrador'));

rutas.post('/sellos', controlador.sellar);
rutas.get('/sellos', controlador.listar);
rutas.get('/verificacion', controlador.verificar);

module.exports = rutas;
