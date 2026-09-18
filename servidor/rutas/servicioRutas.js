/**
 * Rutas del catálogo de servicios.
 * Consultar: cualquier usuario autenticado. Modificar: solo administrador.
 */
const express = require('express');

const controlador = require('../controladores/servicioControlador');
const { verificarToken } = require('../middleware/verificarToken');
const verificarRol = require('../middleware/verificarRol');

const rutas = express.Router();

rutas.use(verificarToken);

rutas.get('/categorias', controlador.listarCategorias);
rutas.get('/', controlador.listar);
rutas.get('/:id', controlador.consultarPorId);

rutas.post('/', verificarRol('administrador'), controlador.crear);
rutas.put('/:id', verificarRol('administrador'), controlador.actualizar);
rutas.delete('/:id', verificarRol('administrador'), controlador.eliminar);

module.exports = rutas;
