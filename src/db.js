const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(__dirname, '../../../bases de datos/kohi.db');

const db = new Database(dbPath);

// Pragmas para concurrencia e integridad ACID
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

// Garantizar existencia de tabla waitlist respetando el contrato del Módulo 1
db.exec(`
  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    position INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

/**
 * Inserta un nuevo usuario en la waitlist calculando atómicamente MAX(position) + 1.
 * @param {{ name: string, email: string, passwordHash: string }} params
 * @returns {{ id: number, name: string, email: string, position: number }}
 */
const registerUserTransaction = db.transaction(({ name, email, passwordHash }) => {
  const existing = db.prepare('SELECT id FROM waitlist WHERE LOWER(email) = LOWER(?)').get(email);
  if (existing) {
    const conflictError = new Error('El email ya está registrado en la waitlist');
    conflictError.code = 'EMAIL_DUPLICATE';
    throw conflictError;
  }

  const maxRow = db.prepare('SELECT COALESCE(MAX(position), 0) AS maxPos FROM waitlist').get();
  const nextPosition = Number(maxRow.maxPos) + 1;

  const insertStmt = db.prepare(`
    INSERT INTO waitlist (name, email, password_hash, position)
    VALUES (?, ?, ?, ?)
  `);

  const info = insertStmt.run(name, email, passwordHash, nextPosition);

  return {
    id: Number(info.lastInsertRowid),
    name,
    email,
    position: nextPosition
  };
});

/**
 * Busca un usuario por email (case-insensitive).
 * @param {string} email
 */
function findUserByEmail(email) {
  return db
    .prepare('SELECT id, name, email, password_hash, position, created_at FROM waitlist WHERE LOWER(email) = LOWER(?)')
    .get(email);
}

/**
 * Obtiene el perfil del usuario por ID junto con el total de registrados en la waitlist.
 * @param {number} userId
 */
function getUserProfileWithTotal(userId) {
  const user = db
    .prepare('SELECT id, name, email, position, created_at FROM waitlist WHERE id = ?')
    .get(userId);

  if (!user) {
    return null;
  }

  const countRow = db.prepare('SELECT COUNT(*) AS total FROM waitlist').get();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    position: user.position,
    total: Number(countRow.total)
  };
}

module.exports = {
  db,
  registerUserTransaction,
  findUserByEmail,
  getUserProfileWithTotal
};
