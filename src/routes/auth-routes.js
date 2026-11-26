const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {
  registerUserTransaction,
  findUserByEmail,
  getUserProfileWithTotal
} = require('../db');
const { authenticateJwt } = require('../middleware/auth-middleware');

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sanitiza y valida un string de entrada
 * @param {unknown} value
 * @returns {string}
 */
function sanitizeString(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

/**
 * 1. POST /api/register
 * Recibe name, email y password. Hashea el password con bcrypt,
 * calcula la posición (MAX(position)+1), guarda en SQLite y devuelve éxito con la posición asignada.
 */
router.post('/register', async (req, res) => {
  try {
    const rawName = sanitizeString(req.body?.name);
    const rawEmail = sanitizeString(req.body?.email).toLowerCase();
    const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!rawName || !rawEmail || !rawPassword.trim()) {
      return res.status(400).json({
        error: 'Campos obligatorios faltantes: se requiere name, email y password'
      });
    }

    if (!EMAIL_REGEX.test(rawEmail)) {
      return res.status(400).json({
        error: 'Formato de email inválido'
      });
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

    const createdUser = registerUserTransaction({
      name: rawName,
      email: rawEmail,
      passwordHash
    });

    return res.status(201).json({
      success: true,
      message: 'Registro exitoso en la waitlist de Kōhi',
      position: createdUser.position,
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        position: createdUser.position
      }
    });
  } catch (err) {
    if (
      err.code === 'EMAIL_DUPLICATE' ||
      (typeof err.code === 'string' && err.code.startsWith('SQLITE_CONSTRAINT'))
    ) {
      return res.status(409).json({
        error: 'El email ya se encuentra registrado'
      });
    }

    return res.status(500).json({
      error: 'Error interno al procesar el registro'
    });
  }
});

/**
 * 2. POST /api/login
 * Verifica credenciales y devuelve JWT.
 */
router.post('/login', async (req, res) => {
  try {
    const rawEmail = sanitizeString(req.body?.email).toLowerCase();
    const rawPassword = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!rawEmail || !rawPassword.trim()) {
      return res.status(400).json({
        error: 'Campos obligatorios faltantes: se requiere email y password'
      });
    }

    const user = findUserByEmail(rawEmail);
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(rawPassword, user.password_hash);
    } catch (_bcryptErr) {
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        error: 'Error de configuración del servidor'
      });
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      secret,
      { expiresIn }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        position: user.position
      }
    });
  } catch (_err) {
    return res.status(500).json({
      error: 'Error interno al iniciar sesión'
    });
  }
});

/**
 * 3. GET /api/me
 * Protegido con middleware JWT. Devuelve name, email, position y total de personas en la waitlist.
 */
router.get('/me', authenticateJwt, (req, res) => {
  try {
    const profile = getUserProfileWithTotal(req.user.id);
    if (!profile) {
      return res.status(401).json({
        error: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      position: profile.position,
      total: profile.total
    });
  } catch (_err) {
    return res.status(500).json({
      error: 'Error interno al obtener el perfil'
    });
  }
});

module.exports = router;
