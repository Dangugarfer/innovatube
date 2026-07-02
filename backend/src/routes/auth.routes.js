const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { register, login, forgotPassword, resetPassword } = require('../controllers/auth.controller');

const router = express.Router();

// Middleware para ejecutar la validación de entrada
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: errors.array()[0].msg, // Devolver el primer mensaje de error para simplificar
      errors: errors.array() 
    });
  }
  next();
};

// Limitador de tasa para el inicio de sesión: 10 intentos por cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Por favor, inténtelo de nuevo después de 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Ruta de registro
router.post(
  '/register',
  [
    body('firstName').notEmpty().withMessage('El nombre es obligatorio').trim(),
    body('lastName').notEmpty().withMessage('El apellido es obligatorio').trim(),
    body('username')
      .notEmpty().withMessage('El nombre de usuario es obligatorio')
      .isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres')
      .trim(),
    body('email').isEmail().withMessage('Debe ser una dirección de correo electrónico válida').normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
    body('recaptchaToken').notEmpty().withMessage('El token de reCAPTCHA es obligatorio')
  ],
  validate,
  register
);

// Ruta de inicio de sesión (Login)
router.post(
  '/login',
  loginLimiter,
  [
    body('usernameOrEmail').notEmpty().withMessage('El nombre de usuario o correo electrónico es obligatorio').trim(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria')
  ],
  validate,
  login
);

// Ruta de recuperación de contraseña (Forgot Password)
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Debe ser una dirección de correo electrónico válida').normalizeEmail()
  ],
  validate,
  forgotPassword
);

// Ruta de restablecimiento de contraseña (Reset Password)
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Debe ser una dirección de correo electrónico válida').normalizeEmail(),
    body('token').notEmpty().withMessage('El token de restablecimiento es obligatorio').trim(),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ],
  validate,
  resetPassword
);

module.exports = router;
