# SGSU — Aplicación web

Sistema de Gestión de Solicitudes de Servicios. Es la aplicación web que integra
los módulos del proyecto formativo: autenticación, usuarios, catálogo de
servicios, solicitudes con su bitácora y reportes.

Evidencia **GA8-220501096-AA1-EV01 — Desarrollar software a partir de la
integración de sus módulos componentes**.
Edgar Santiago Suarez Alzate — Ficha 3186595 — Tecnólogo en Análisis y
Desarrollo de Software.

---

## Qué hay en el repositorio

| Carpeta            | Qué contiene                                                          |
|--------------------|-----------------------------------------------------------------------|
| `src/`             | Capa de presentación: componentes, páginas, contexto, servicios y pruebas |
| `servidor/`        | Capa de negocio y de datos: la API REST por capas (rutas, controladores, modelos) |
| `api/`             | Punto de entrada de la API cuando se despliega sin servidor            |
| `documentacion/`   | Especificación OpenAPI y página de referencia de los servicios         |
| `src/pruebas/`     | Pruebas unitarias de cada módulo                                       |

## Arquitectura en capas

```
Navegador
   │
   ├─ Presentación .............. src/paginas, src/componentes
   ├─ Estado de sesión .......... src/contexto
   ├─ Acceso a servicios ........ src/servicios  (único punto que habla HTTP)
   │
   ▼  HTTP / JSON  (JWT en el encabezado Authorization)
   │
   ├─ Rutas ..................... servidor/rutas
   ├─ Middleware ................ servidor/middleware (token, roles, errores)
   ├─ Controladores ............. servidor/controladores
   ├─ Modelos ................... servidor/modelos
   └─ Datos ..................... SQLite (node:sqlite)
```

## Cómo ejecutarlo

Se necesita Node.js 22 o superior.

```bash
npm install

# Terminal 1 — API en http://localhost:3000
npm run api

# Terminal 2 — aplicación web en http://localhost:5173
npm run dev
```

El servidor de desarrollo redirige `/api` al puerto 3000, así que en el código
todas las rutas son relativas y no hay que configurar CORS.

## Pruebas unitarias

```bash
npm run prueba       # ejecuta la suite completa una vez
npm run prueba:ver   # queda observando los archivos
npm run prueba:servidor  # pruebas de la API con node:test (versión 1.2)
npm run prueba:e2e   # pruebas de extremo a extremo con Playwright
npm run prueba:api   # colección de Postman con Newman (necesita la API en el puerto 3000)
```

## Cambios de la versión 1.2

- **Inicio de sesión sin bloquear el servidor (NF-01).** bcrypt se ejecuta en un grupo de
  hilos de trabajo (`servidor/utilidades/contrasenas.js`); el hilo principal sigue atendiendo
  las demás peticiones mientras se comparan contraseñas.
- **Límite de intentos (NF-02).** Después de 5 intentos fallidos con el mismo usuario desde la
  misma IP, el inicio de sesión responde 429 durante 15 minutos (`servidor/middleware/limiteIntentos.js`).
- **Sello de integridad de la bitácora (NF-03).** `POST /api/bitacora/sellos` guarda el hash
  SHA-256 de los movimientos de un día encadenado con el sello anterior, y
  `GET /api/bitacora/verificacion` dice si la bitácora sigue íntegra. Solo administrador.

## Compilar

```bash
npm run build        # deja los archivos compilados en dist/
npm run preview      # sirve dist/ para revisarlo antes de publicar
```

## Cuentas de demostración

| Rol           | Usuario         | Contraseña     |
|---------------|-----------------|----------------|
| Administrador | `admin`         | `Admin2026*`   |
| Técnico       | `laura.tecnico` | `Tecnico2026*` |
| Técnico       | `julian.tecnico`| `Tecnico2026*` |
| Cliente       | `ana.gomez`     | `Usuario2026*` |
| Cliente       | `carlos.perez`  | `Usuario2026*` |

Son cuentas de demostración creadas por el sembrado inicial de la base de datos;
no corresponden a personas reales.

## Variables de entorno

| Variable           | Para qué sirve                                      | Valor por defecto |
|--------------------|-----------------------------------------------------|-------------------|
| `VITE_URL_API`     | URL de la API. Vacía = rutas relativas              | vacía             |
| `PUERTO`           | Puerto de la API                                    | `3000`            |
| `RUTA_BASE_DATOS`  | Archivo SQLite; `:memory:` para base en memoria     | `datos/sgsu.db`   |
| `LLAVE_SECRETA`    | Llave con la que se firman los tokens JWT           | valor de desarrollo |
| `DURACION_TOKEN`   | Vigencia del token                                  | `4h`              |
| `MODO_PRUEBAS`     | En `1` reinicia y vuelve a sembrar la base de datos | sin definir       |
| `LIMITE_INTENTOS`  | Intentos fallidos antes del bloqueo (v1.2)          | `5`               |
| `VENTANA_INTENTOS_MS` | Duración del bloqueo en milisegundos (v1.2)      | `900000`          |
| `REGISTRO_PETICIONES` | En `0` no escribe cada petición en la consola    | sin definir       |

## Licencia

MIT.
