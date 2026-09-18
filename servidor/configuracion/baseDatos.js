/**
 * Creación y configuración de la base de datos del SGSU.
 *
 * Se usa SQLite a través del módulo nativo node:sqlite para que el proyecto
 * se pueda clonar y ejecutar sin instalar un motor de base de datos aparte.
 * El modelo relacional es el mismo que está documentado para el proyecto
 * formativo: rol, usuario, servicio, solicitud y bitacora.
 */
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

// La ruta se puede cambiar con la variable RUTA_BASE_DATOS. En el ambiente de
// desarrollo apunta a un archivo dentro del proyecto; en el despliegue sin
// servidor se usa ':memory:', porque allá el disco es de solo lectura.
const carpetaDatos = path.join(__dirname, '..', '..', 'datos');
const rutaBaseDatos = process.env.RUTA_BASE_DATOS || path.join(carpetaDatos, 'sgsu.db');
const enArchivo = rutaBaseDatos !== ':memory:';

if (enArchivo && !fs.existsSync(path.dirname(rutaBaseDatos))) {
  fs.mkdirSync(path.dirname(rutaBaseDatos), { recursive: true });
}
const baseDatos = new DatabaseSync(rutaBaseDatos);

// Las llaves foráneas no vienen activadas por defecto en SQLite.
baseDatos.exec('PRAGMA foreign_keys = ON;');

/** Crea todas las tablas del sistema si todavía no existen. */
function iniciarBaseDatos() {
  baseDatos.exec(`
    CREATE TABLE IF NOT EXISTS rol (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre      TEXT NOT NULL UNIQUE,
      descripcion TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS usuario (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_completo TEXT NOT NULL,
      documento       TEXT NOT NULL UNIQUE,
      correo          TEXT NOT NULL UNIQUE,
      nombre_usuario  TEXT NOT NULL UNIQUE,
      contrasena_hash TEXT NOT NULL,
      telefono        TEXT,
      id_rol          INTEGER NOT NULL REFERENCES rol(id),
      estado          TEXT NOT NULL DEFAULT 'activo'
                      CHECK (estado IN ('activo', 'inactivo')),
      fecha_registro  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS servicio (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo                 TEXT NOT NULL UNIQUE,
      nombre                 TEXT NOT NULL,
      descripcion            TEXT NOT NULL,
      categoria              TEXT NOT NULL,
      precio_base            REAL NOT NULL CHECK (precio_base >= 0),
      tiempo_estimado_horas  REAL NOT NULL CHECK (tiempo_estimado_horas > 0),
      activo                 INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS solicitud (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo              TEXT NOT NULL UNIQUE,
      id_usuario          INTEGER NOT NULL REFERENCES usuario(id),
      id_servicio         INTEGER NOT NULL REFERENCES servicio(id),
      id_tecnico          INTEGER REFERENCES usuario(id),
      descripcion         TEXT NOT NULL,
      direccion           TEXT NOT NULL,
      prioridad           TEXT NOT NULL DEFAULT 'media'
                          CHECK (prioridad IN ('baja', 'media', 'alta')),
      estado              TEXT NOT NULL DEFAULT 'registrada'
                          CHECK (estado IN ('registrada', 'asignada', 'en_proceso',
                                            'resuelta', 'cerrada', 'cancelada')),
      fecha_creacion      TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      fecha_programada    TEXT,
      fecha_cierre        TEXT,
      observacion_cierre  TEXT
    );

    CREATE TABLE IF NOT EXISTS bitacora (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      id_solicitud    INTEGER NOT NULL REFERENCES solicitud(id) ON DELETE CASCADE,
      id_usuario      INTEGER NOT NULL REFERENCES usuario(id),
      estado_anterior TEXT,
      estado_nuevo    TEXT NOT NULL,
      comentario      TEXT,
      fecha           TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_solicitud_usuario ON solicitud(id_usuario);
    CREATE INDEX IF NOT EXISTS idx_solicitud_estado  ON solicitud(estado);
    CREATE INDEX IF NOT EXISTS idx_bitacora_solicitud ON bitacora(id_solicitud);
  `);
}

/** Vacía todas las tablas. Se usa solo en modo de pruebas. */
function limpiarBaseDatos() {
  baseDatos.exec(`
    DELETE FROM bitacora;
    DELETE FROM solicitud;
    DELETE FROM servicio;
    DELETE FROM usuario;
    DELETE FROM rol;
    DELETE FROM sqlite_sequence;
  `);
}

module.exports = { baseDatos, iniciarBaseDatos, limpiarBaseDatos, rutaBaseDatos };
