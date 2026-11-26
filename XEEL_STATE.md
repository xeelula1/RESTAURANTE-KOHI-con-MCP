# XEEL_STATE.md — Bitácora de Estado y Memoria del Proyecto

## 📌 Estado General
- **Proyecto:** Kōhi Cafetería (Web con Waitlist)
- **Rama Activa:** `feat/kohi-waitlist-app`
- **Fase Actual:** Módulos 1 (Backend API), 2 (Frontend UI) y 3 (E2E Playwright) completados y consolidados (Auto Dream)
- **Última Actualización:** 2026-11-26

## ⚡ Comandos Oficiales del Proyecto
- **Instalación:** `npm.cmd install`
- **Ejecución (Dev):** `node src/server.js`
- **Tests:** `node tests/api-test.js`
- **Build / Empaquetado:** N/A (Runtime Node.js directo + estáticos Vanilla HTML/CSS)

## 🧠 Stack Tecnológico y Justificación
- **Express (`4.22.3`):** API REST (`/api/register`, `/api/login`, `/api/me`) y servidor de estáticos (`public/`) en puerto `3000`.
- **better-sqlite3 (`13.2.0`):** Driver SQLite síncrono en modo `WAL` con transacciones atómicas para calcular `MAX(position) + 1`.
- **bcrypt (`6.0.0`):** Hashing criptográfico N-API de contraseñas (Zero-Leak Policy).
- **jsonwebtoken (`9.0.3`):** Autenticación stateless firmada con `JWT_SECRET`.
- **dotenv (`16.6.1`):** Carga segura de variables de entorno (`.env`).
- **Vanilla HTML5/CSS3/JS (`fetch`):** UI oscura minimalista japonesa sin dependencias de compilación.

## 📁 Estructura del Proyecto (Árbol de Archivos)
raiz/
├── .env.example                      — Plantilla de variables de entorno
├── .gitignore                        — Exclusión de node_modules, .env, *.db, *.log y .playwright-mcp/
├── Basekohistate.md                  — Bitácora inicial de la base de datos SQLite
├── XEEL_STATE.md                     — Bitácora de Estado y Memoria del Proyecto
├── package.json                      — Manifiesto con dependencias congeladas
├── public/
│   ├── styles.css                    — Paleta oscura japonesa (#0b0a09) con acentos dorado/ámbar (#d4a359)
│   ├── index.html                    — Landing page de Kōhi
│   ├── register.html                 — Formulario de registro en la waitlist
│   ├── login.html                    — Formulario de inicio de sesión
│   └── dashboard.html                — Panel privado con posición #N de M, barra de progreso y QR-[ID]
├── src/
│   ├── db.js                         — Conexión better-sqlite3 y transacciones de waitlist
│   ├── server.js                     — Servidor Express en puerto 3000
│   ├── middleware/
│   │   └── auth-middleware.js        — Middleware `authenticateJwt`
│   └── routes/
│       └── auth-routes.js            — Rutas `/api/register`, `/api/login` y `/api/me`
└── tests/
    └── api-test.js                   — Suite de pruebas unitarias y de integración

## 🗄️ Esquema de Datos / Persistencia
- **SQLite (`C:/Users/USER/Documents/bases de datos/kohi.db`):**
  - Tabla `waitlist`: `id (INTEGER PK AUTOINCREMENT)`, `name (TEXT NOT NULL)`, `email (TEXT UNIQUE NOT NULL)`, `password_hash (TEXT NOT NULL)`, `position (INTEGER)`, `created_at (DATETIME DEFAULT CURRENT_TIMESTAMP)`

## 🛠️ Módulos Completados y Verificados
- [x] **Base de Datos (`kohi.db`):** Tabla `waitlist` y semilla inicial creadas vía MCP `sqlite`.
- [x] **Módulo 1 (Backend API):** Endpoints `/api/register`, `/api/login`, `/api/me` y estáticos `public/`.
- [x] **Módulo 2 (Frontend UI):** Páginas `index.html`, `register.html`, `login.html`, `dashboard.html` y `styles.css`.
- [x] **Módulo 3 (Tests E2E Playwright MCP):** Flujo completo validado en navegador real.

## 📋 Contratos de Datos Vigentes (Firmas de Interfaz)
- **`POST /api/register`:** `{ name, email, password } -> 201 { success, message, position, user: { id, name, email, position } } | 400 | 409`
- **`POST /api/login`:** `{ email, password } -> 200 { success, token, user: { id, name, email, position } } | 400 | 401`
- **`GET /api/me`:** `Header Authorization: Bearer <token> -> 200 { id, name, email, position, total } | 401`
- **`src/db.js`:** `registerUserTransaction`, `findUserByEmail`, `getUserProfileWithTotal`

## 🔒 Dependencias Congeladas
- `bcrypt==6.0.0`
- `better-sqlite3==13.2.0`
- `dotenv==16.6.1`
- `express==4.22.3`
- `jsonwebtoken==9.0.3`

## 🎯 Siguiente Paso Pendiente
- Revisar y fusionar el Pull Request en GitHub.
