/**
 * Datos iniciales del sistema: roles, usuarios de ejemplo, catálogo de
 * servicios y algunas solicitudes, para que la API se pueda probar apenas
 * se clona el proyecto.
 *
 * Se puede ejecutar aparte con:  npm run sembrar
 */
const bcrypt = require('bcryptjs');

const { baseDatos, iniciarBaseDatos, limpiarBaseDatos } = require('./baseDatos');
const usuarioModelo = require('../modelos/usuarioModelo');
const servicioModelo = require('../modelos/servicioModelo');
const solicitudModelo = require('../modelos/solicitudModelo');

const ROLES = [
  ['administrador', 'Administra usuarios, catálogo, asignaciones y reportes.'],
  ['tecnico', 'Atiende las solicitudes que le asignan y reporta su avance.'],
  ['cliente', 'Registra solicitudes de servicio y consulta su estado.'],
];

const USUARIOS = [
  ['Edgar Santiago Suarez Alzate', '1001234567', 'admin@sgsu.co', 'admin', 'Admin2026*', '3001112233', 'administrador'],
  ['Laura Restrepo Ossa', '1002345678', 'laura.restrepo@sgsu.co', 'laura.tecnico', 'Tecnico2026*', '3002223344', 'tecnico'],
  ['Julián Mejía Cardona', '1003456789', 'julian.mejia@sgsu.co', 'julian.tecnico', 'Tecnico2026*', '3003334455', 'tecnico'],
  ['Ana Gómez Rivera', '1004567890', 'ana.gomez@ejemplo.com', 'ana.gomez', 'Usuario2026*', '3104445566', 'cliente'],
  ['Carlos Pérez Ruiz', '1005678901', 'carlos.perez@ejemplo.com', 'carlos.perez', 'Usuario2026*', '3115556677', 'cliente'],
];

const SERVICIOS = [
  ['SOP-001', 'Soporte técnico en sitio', 'Revisión y reparación de equipos de cómputo en las instalaciones del cliente.', 'Soporte', 120000, 3, 1],
  ['SOP-002', 'Soporte técnico remoto', 'Atención de fallas de software por conexión remota asistida.', 'Soporte', 60000, 1.5, 1],
  ['RED-001', 'Instalación de red cableada', 'Tendido, canalización y certificación de puntos de red.', 'Redes', 450000, 8, 1],
  ['RED-002', 'Configuración de red inalámbrica', 'Instalación y aseguramiento de puntos de acceso Wi-Fi.', 'Redes', 260000, 4, 1],
  ['DES-001', 'Desarrollo de sitio web informativo', 'Diseño y publicación de un sitio web de hasta cinco secciones.', 'Desarrollo', 1800000, 40, 1],
  ['DES-002', 'Mantenimiento de aplicación web', 'Correcciones, respaldos y actualizaciones mensuales.', 'Desarrollo', 320000, 6, 1],
  ['SEG-001', 'Instalación de cámaras de seguridad', 'Montaje y configuración de sistema de videovigilancia.', 'Seguridad', 980000, 12, 1],
  ['CAP-001', 'Capacitación ofimática', 'Sesión de capacitación en herramientas de oficina para equipos de trabajo.', 'Capacitación', 380000, 4, 0],
];

/** Indica si la base ya tiene datos sembrados. */
function hayDatos() {
  try {
    return baseDatos.prepare('SELECT COUNT(*) AS n FROM rol').get().n > 0;
  } catch (e) {
    return false;
  }
}

/** Inserta los datos iniciales. Con reiniciar=true vacía todo antes. */
function sembrarDatos({ reiniciar = false, silencioso = true } = {}) {
  iniciarBaseDatos();
  if (reiniciar) limpiarBaseDatos();
  if (hayDatos() && !reiniciar) return;

  const insertarRol = baseDatos.prepare('INSERT INTO rol (nombre, descripcion) VALUES (?, ?)');
  ROLES.forEach(([nombre, descripcion]) => insertarRol.run(nombre, descripcion));

  const creados = {};
  USUARIOS.forEach(([nombreCompleto, documento, correo, nombreUsuario, clave, telefono, rol]) => {
    const rolFila = usuarioModelo.buscarRolPorNombre(rol);
    creados[nombreUsuario] = usuarioModelo.crear({
      nombreCompleto, documento, correo, nombreUsuario, telefono,
      contrasenaHash: bcrypt.hashSync(clave, 10),
      idRol: rolFila.id,
    });
  });

  SERVICIOS.forEach(([codigo, nombre, descripcion, categoria, precioBase, horas, activo]) => {
    servicioModelo.crear({
      codigo, nombre, descripcion, categoria,
      precioBase, tiempoEstimadoHoras: horas, activo: activo === 1,
    });
  });

  // Tres solicitudes de ejemplo, una en cada punto del flujo.
  const ana = creados['ana.gomez'];
  const carlos = creados['carlos.perez'];
  const laura = creados['laura.tecnico'];
  const admin = creados['admin'];

  const s1 = solicitudModelo.crear({
    idUsuario: ana.id, idServicio: 1, prioridad: 'alta',
    descripcion: 'El equipo de la recepción no enciende desde ayer en la mañana.',
    direccion: 'Carrera 45 #12-30, oficina 201, Medellín',
  });

  const s2 = solicitudModelo.crear({
    idUsuario: carlos.id, idServicio: 4, prioridad: 'media',
    descripcion: 'Se necesita ampliar la cobertura Wi-Fi al segundo piso de la bodega.',
    direccion: 'Calle 10 #5-22, bodega 4, Envigado',
  });
  solicitudModelo.asignarTecnico(s2.id, laura.id);
  solicitudModelo.registrarBitacora({
    idSolicitud: s2.id, idUsuario: admin.id,
    estadoAnterior: 'registrada', estadoNuevo: 'asignada',
    comentario: `Solicitud asignada al técnico ${laura.nombre_completo}.`,
  });

  const s3 = solicitudModelo.crear({
    idUsuario: ana.id, idServicio: 6, prioridad: 'baja',
    descripcion: 'Mantenimiento mensual del portal de la empresa y respaldo de la base.',
    direccion: 'Carrera 45 #12-30, oficina 201, Medellín',
  });
  solicitudModelo.asignarTecnico(s3.id, laura.id);
  solicitudModelo.registrarBitacora({
    idSolicitud: s3.id, idUsuario: admin.id,
    estadoAnterior: 'registrada', estadoNuevo: 'asignada',
    comentario: `Solicitud asignada al técnico ${laura.nombre_completo}.`,
  });
  solicitudModelo.cambiarEstado(s3.id, 'en_proceso');
  solicitudModelo.registrarBitacora({
    idSolicitud: s3.id, idUsuario: laura.id,
    estadoAnterior: 'asignada', estadoNuevo: 'en_proceso',
    comentario: 'El técnico inició el mantenimiento.',
  });

  if (!silencioso) {
    console.log('Datos iniciales sembrados:');
    console.log(`  ${ROLES.length} roles, ${USUARIOS.length} usuarios, ` +
                `${SERVICIOS.length} servicios y 3 solicitudes.`);
    console.log('  Usuario administrador: admin / Admin2026*');
  }
  return { s1: s1.id, s2: s2.id, s3: s3.id };
}

module.exports = { sembrarDatos, hayDatos, ROLES, USUARIOS, SERVICIOS };

// Permite ejecutarlo directamente con: npm run sembrar
if (require.main === module) {
  sembrarDatos({ reiniciar: true, silencioso: false });
}
