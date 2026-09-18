/** Rutas de reportes. Uso exclusivo del administrador. */
const express = require('express');

const controlador = require('../controladores/reporteControlador');
const { verificarToken } = require('../middleware/verificarToken');
const verificarRol = require('../middleware/verificarRol');

const rutas = express.Router();

rutas.use(verificarToken, verificarRol('administrador'));

rutas.get('/solicitudes-por-estado', controlador.solicitudesPorEstado);
rutas.get('/servicios-mas-solicitados', controlador.serviciosMasSolicitados);
rutas.get('/carga-por-tecnico', controlador.cargaPorTecnico);

module.exports = rutas;
