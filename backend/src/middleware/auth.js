const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Obtener el token del encabezado
      token = req.headers.authorization.split(' ')[1];

      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret_123456');

      // Obtener el usuario a partir del token (el campo password ya está excluido por defecto en el modelo)
      req.user = await User.findById(decoded.id);

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'No autorizado, usuario no encontrado' });
      }

      next();
    } catch (error) {
      logger.error('Error de verificación de token: %s', error.message);
      return res.status(401).json({ success: false, message: 'No autorizado, verificación de token fallida' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No autorizado, no se proporcionó ningún token' });
  }
};

module.exports = { protect };
