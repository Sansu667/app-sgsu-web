/** Rutas de las solicitudes de servicio. */
const express = require('express');

const controlador = require('../controladores/solicitudControlador');
const { verificarToken } = require('../middleware/verificarToken');
const verificarRol = require('../middleware/verificarRol');

const rutas = express.Router();

rutas.use(verificarToken);

rutas.post('/', verificarRol('cliente'), controlador.crear);
rutas.get('/', controlador.listar);
rutas.get('/:id', controlador.consultarPorId);
rutas.get('/:id/bitacora', controlador.consultarBitacora);
rutas.put('/:id', verificarRol('cliente', 'administrador'), controlador.actualizar);
rutas.patch('/:id/asignar', verificarRol('administrador'), controlador.asignarTecnico);
rutas.patch('/:id/estado', verificarRol('tecnico', 'administrador'), controlador.cambiarEstado);
rutas.delete('/:id', verificarRol('administrador'), controlador.eliminar);

module.exports = rutas;
