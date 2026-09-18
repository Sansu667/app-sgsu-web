/** Rutas de gestión de usuarios. Todas exigen rol administrador. */
const express = require('express');

const controlador = require('../controladores/usuarioControlador');
const { verificarToken } = require('../middleware/verificarToken');
const verificarRol = require('../middleware/verificarRol');

const rutas = express.Router();

rutas.use(verificarToken, verificarRol('administrador'));

rutas.get('/roles', controlador.listarRoles);
rutas.get('/', controlador.listar);
rutas.post('/', controlador.crear);
rutas.get('/:id', controlador.consultarPorId);
rutas.put('/:id', controlador.actualizar);
rutas.patch('/:id/estado', controlador.cambiarEstado);
rutas.delete('/:id', controlador.eliminar);

module.exports = rutas;
