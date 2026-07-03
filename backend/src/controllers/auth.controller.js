const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { verifyRecaptcha } = require('../utils/recaptcha');
const logger = require('../utils/logger');

//  Generar un token JWT
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_jwt_secret_123456', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// Crear un transportador de correo electrónico
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Público
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, username, email, password, recaptchaToken } = req.body;

    // Verificar reCAPTCHA
    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken, req.ip);
    if (!isValidRecaptcha) {
      return res.status(400).json({ success: false, message: 'Verificación de reCAPTCHA fallida' });
    }

    // Verificar si el usuario existe (email)
    let userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado' });
    }

    // Verificar si el usuario existe (username)
    userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'El nombre de usuario ya está en uso' });
    }

    // Crear usuario (la contraseña se cifra en el hook «pre-save»)
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password
    });

    const token = signToken(user._id);

    // Devuelve la información del usuario y el token (excluyendo la contraseña)
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Iniciar sesión de usuario
// @route   POST /api/auth/login
// @access  Público
const login = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Buscar usuario por correo electrónico o nombre de usuario, seleccionando explícitamente la contraseña
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { username: usernameOrEmail.toLowerCase() }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales no válidas' });
    }

    // Comprobar si la contraseña coincide
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales no válidas' });
    }

    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Solicitar correo electrónico de recuperación de contraseña
// @route   POST /api/auth/forgot-password
// @access  Público
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Devolver 200 incluso si el usuario no existe por seguridad (no filtrar correos registrados)
      return res.status(200).json({
        success: true,
        message: 'Si la dirección de correo electrónico existe, se te ha enviado un enlace para restablecer la contraseña.'
      });
    }

    // Generar token de restablecimiento (hex aleatorio)
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hashear el token y guardar en el modelo User
    const hashedDbToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Guardar en la base de datos
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: hashedDbToken,
      resetPasswordExpires: Date.now() + 3600000 // 1 hour
    });

    // Crear URL de restablecimiento
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
    const resetUrl = `${clientUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    const message = `
Has recibido este correo porque tú, o alguien más, solicitó restablecer la contraseña de tu cuenta.
Para crear una nueva contraseña, haz clic en el siguiente enlace:
${resetUrl}
Si no realizaste esta solicitud, puedes ignorar este mensaje de forma segura. Tu contraseña actual permanecerá sin cambios.
`;

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        to: user.email,
        subject: 'InnovaTube Solicitud de restablecimiento de contraseña',
        text: message
      });

      logger.info(`Correo electrónico de restablecimiento de contraseña enviado correctamente a ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Correo electrónico enviado correctamente'
      });
    } catch (mailError) {
      logger.error('Nodemailer no ha podido enviar el correo electrónico: %s', mailError.message);
      // Alternativa para desarrollo: imprimir el enlace del token en la consola/logs
      logger.warn(`OPCIÓN DE RESERVA DE DESARROLLO: Enlace para restablecer la contraseña de ${user.email}: ${resetUrl}`);

      res.status(200).json({
        success: true,
        message: 'Se ha generado un correo electrónico de restablecimiento. (SMTP no configurado; se han comprobado la consola y los registros del servidor en busca de un enlace)',
        developmentLink: process.env.NODE_ENV !== 'production' ? resetUrl : undefined
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Restablecer la contraseña
// @route   POST /api/auth/reset-password
// @access  Público
const resetPassword = async (req, res, next) => {
  try {
    const { email, token, password } = req.body;

    // Hashear token para comparar con la base de datos
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Buscar usuario con token y correo coincidentes, y que no haya expirado
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token no válido o caducado' });
    }

    // Establecer nueva contraseña (se hasheará en el hook pre-save)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    logger.info(`Se ha completado correctamente el restablecimiento de la contraseña del usuario: ${user.username}`);

    res.status(200).json({
      success: true,
      message: 'Contraseña restablecida correctamente'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
};
