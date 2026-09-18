/**
 * Controlador de reportes. Son las consultas agregadas que alimentan el
 * tablero del administrador.
 */
const solicitudModelo = require('../modelos/solicitudModelo');
const { exito } = require('../utilidades/respuestas');
const { ESTADOS } = require('../utilidades/validaciones');

/** GET /api/reportes/solicitudes-por-estado */
function solicitudesPorEstado(peticion, respuesta) {
  const conteo = solicitudModelo.contarPorEstado();
  const mapa = Object.fromEntries(conteo.map((f) => [f.estado, f.total]));

  // Se devuelven todos los estados, incluso los que están en cero, para que
  // el tablero no tenga que rellenar los faltantes.
  const resultado = ESTADOS.map((estado) => ({ estado, total: mapa[estado] || 0 }));
  const total = resultado.reduce((suma, f) => suma + f.total, 0);

  return exito(respuesta, 200, { total, porEstado: resultado });
}

/** GET /api/reportes/servicios-mas-solicitados */
function serviciosMasSolicitados(peticion, respuesta) {
  const limite = Math.min(Math.max(Number(peticion.query.limite) || 10, 1), 50);
  return exito(respuesta, 200, {
    limite,
    servicios: solicitudModelo.serviciosMasSolicitados(limite),
  });
}

/** GET /api/reportes/carga-por-tecnico */
function cargaPorTecnico(peticion, respuesta) {
  const tecnicos = solicitudModelo.cargaPorTecnico();
  return exito(respuesta, 200, { total: tecnicos.length, tecnicos });
}

module.exports = { solicitudesPorEstado, serviciosMasSolicitados, cargaPorTecnico };
