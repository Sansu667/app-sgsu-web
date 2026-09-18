/** Rutas del módulo de autenticación. */
const express = require('express');

const controlador = require('../controladores/autenticacionControlador');
const { verificarToken } = require('../middleware/verificarToken');

const rutas = express.Router();

rutas.post('/registro', controlador.registrar);
rutas.post('/login', controlador.iniciarSesion);
rutas.get('/perfil', verificarToken, controlador.consultarPerfil);

module.exports = rutas;
