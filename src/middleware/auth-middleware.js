const jwt = require('jsonwebtoken');

/**
 * Middleware que valida el token JWT en el header Authorization: Bearer <token>
 */
function authenticateJwt(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No autorizado: token JWT faltante o formato inválido'
      });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({
        error: 'No autorizado: token JWT vacío'
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        error: 'Error de configuración del servidor'
      });
    }

    const decoded = jwt.verify(token, secret);
    req.user = {
      id: decoded.id,
      email: decoded.email
    };
    return next();
  } catch (err) {
    return res.status(401).json({
      error: 'No autorizado: token JWT inválido o expirado'
    });
  }
}

module.exports = {
  authenticateJwt
};
