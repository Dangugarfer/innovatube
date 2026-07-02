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
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Ruta de registro
router.post(
  '/register',
  [
    body('firstName').notEmpty().withMessage('First name is required').trim(),
    body('lastName').notEmpty().withMessage('Last name is required').trim(),
    body('username')
      .notEmpty().withMessage('Username is required')
      .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long')
      .trim(),
    body('email').isEmail().withMessage('Must be a valid email address').normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
    body('recaptchaToken').notEmpty().withMessage('reCAPTCHA token is required')
  ],
  validate,
  register
);

// Ruta de inicio de sesión (Login)
router.post(
  '/login',
  loginLimiter,
  [
    body('usernameOrEmail').notEmpty().withMessage('Username or Email is required').trim(),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validate,
  login
);

// Ruta de recuperación de contraseña (Forgot Password)
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Must be a valid email address').normalizeEmail()
  ],
  validate,
  forgotPassword
);

// Ruta de restablecimiento de contraseña (Reset Password)
router.post(
  '/reset-password',
  [
    body('email').isEmail().withMessage('Must be a valid email address').normalizeEmail(),
    body('token').notEmpty().withMessage('Reset token is required').trim(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  validate,
  resetPassword
);

module.exports = router;
