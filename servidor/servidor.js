/**
 * API REST del Sistema de Gestión de Solicitudes de Servicios (SGSU).
 * Es la capa de negocio y de datos de la aplicación web: se construyó en la
 * evidencia GA7-220501096-AA5-EV03 y aquí queda integrada con la capa de
 * presentación desarrollada en React.
 *
 * Autor: Edgar Santiago Suarez Alzate — Ficha 3186595.
 */
const express = require('express');
const path = require('node:path');
const fs = require('node:fs');

const { iniciarBaseDatos } = require('./configuracion/baseDatos');
const { sembrarDatos, hayDatos } = require('./configuracion/datosIniciales');

const autenticacionRutas = require('./rutas/autenticacionRutas');
const usuarioRutas = require('./rutas/usuarioRutas');
const servicioRutas = require('./rutas/servicioRutas');
const solicitudRutas = require('./rutas/solicitudRutas');
const reporteRutas = require('./rutas/reporteRutas');
const { rutaNoEncontrada, manejadorErrores } = require('./middleware/manejadorErrores');

const aplicacion = express();
const PUERTO = process.env.PUERTO || 3000;
const CARPETA_DOCS = path.join(__dirname, '..', 'documentacion');

aplicacion.use(express.json({ limit: '1mb' }));

// Registro de cada petición: ayuda a seguir lo que pasa durante las pruebas.
aplicacion.use((peticion, respuesta, siguiente) => {
  const marca = new Date().toISOString().slice(11, 19);
  console.log(`[${marca}] ${peticion.method} ${peticion.originalUrl}`);
  siguiente();
});

/** GET /api/salud — comprueba que el servicio esté operativo. */
aplicacion.get('/api/salud', (peticion, respuesta) => {
  respuesta.status(200).json({
    exito: true,
    servicio: 'API SGSU — Sistema de Gestión de Solicitudes de Servicios',
    version: '1.0.0',
    estado: 'operativo',
    fechaHora: new Date().toISOString(),
  });
});

// Documentación de los servicios.
aplicacion.get('/api/docs', (peticion, respuesta) =>
  respuesta.sendFile(path.join(CARPETA_DOCS, 'api-sgsu.html')));
aplicacion.get('/api/docs/openapi.json', (peticion, respuesta) =>
  respuesta.sendFile(path.join(CARPETA_DOCS, 'openapi.json')));
aplicacion.get('/api/docs/openapi.yaml', (peticion, respuesta) =>
  respuesta.type('text/yaml').sendFile(path.join(CARPETA_DOCS, 'openapi.yaml')));

// Módulos de la API.
aplicacion.use('/api/autenticacion', autenticacionRutas);
aplicacion.use('/api/usuarios', usuarioRutas);
aplicacion.use('/api/servicios', servicioRutas);
aplicacion.use('/api/solicitudes', solicitudRutas);
aplicacion.use('/api/reportes', reporteRutas);

aplicacion.use(rutaNoEncontrada);
aplicacion.use(manejadorErrores);

// Preparación de la base de datos antes de atender peticiones.
iniciarBaseDatos();
if (process.env.MODO_PRUEBAS === '1' || !hayDatos()) {
  sembrarDatos({ reiniciar: process.env.MODO_PRUEBAS === '1' });
}

if (require.main === module) {
  aplicacion.listen(PUERTO, () => {
    const docs = fs.existsSync(path.join(CARPETA_DOCS, 'api-sgsu.html'));
    console.log('================================================================');
    console.log('  API SGSU — Sistema de Gestión de Solicitudes de Servicios');
    console.log('  Evidencia GA8-220501096-AA1-EV01');
    console.log('  Edgar Santiago Suarez Alzate — Ficha 3186595');
    console.log('================================================================');
    console.log(`  Servidor escuchando en  http://localhost:${PUERTO}`);
    if (docs) console.log(`  Documentación en        http://localhost:${PUERTO}/api/docs`);
    console.log('  Módulos:');
    console.log('    /api/salud            estado del servicio');
    console.log('    /api/autenticacion    registro, login y perfil');
    console.log('    /api/usuarios         gestión de usuarios (administrador)');
    console.log('    /api/servicios        catálogo de servicios');
    console.log('    /api/solicitudes      solicitudes y su bitácora');
    console.log('    /api/reportes         reportes del tablero (administrador)');
    console.log('================================================================');
  });
}

module.exports = aplicacion;
