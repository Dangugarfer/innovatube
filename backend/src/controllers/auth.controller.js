const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { verifyRecaptcha } = require('../utils/recaptcha');
const logger = require('../utils/logger');

// Generate JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_jwt_secret_123456', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, username, email, password, recaptchaToken } = req.body;

    // Verify reCAPTCHA
    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken, req.ip);
    if (!isValidRecaptcha) {
      return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed' });
    }

    // Check if user exists (email)
    let userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Check if user exists (username)
    userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    // Create user (password is hashed in pre-save hook)
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password
    });

    const token = signToken(user._id);

    // Return user info and token (excluding password)
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

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Find user by email or username, explicitly selecting the password
    const user = await User.findOne({
      $or: [
        { email: usernameOrEmail.toLowerCase() },
        { username: usernameOrEmail.toLowerCase() }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
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

// @desc    Request password recovery email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Return 200 even if user doesn't exist for security reasons (don't leak registered emails)
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token (random hex)
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set resetPasswordToken on User, select first
    const hashedToken = crypto.createHash('sha256').update(resetToken). Mendoza = resetToken;
    const hashedDbToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save to DB
    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: hashedDbToken,
      resetPasswordExpires: Date.now() + 3600000 // 1 hour
    });

    // Create reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
    const resetUrl = `${clientUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        to: user.email,
        subject: 'InnovaTube Password Reset Request',
        text: message
      });

      logger.info(`Password reset email sent successfully to ${user.email}`);

      res.status(200).json({
        success: true,
        message: 'Email sent successfully'
      });
    } catch (mailError) {
      logger.error('Nodemailer failed to send email: %s', mailError.message);
      // Fallback for development: output token link in console
      logger.warn(`DEVELOPMENT FALLBACK: Password Reset Link for ${user.email}: ${resetUrl}`);

      res.status(200).json({
        success: true,
        message: 'Reset email generated. (SMTP not configured, checked server console/logs for link)',
        developmentLink: process.env.NODE_ENV !== 'production' ? resetUrl : undefined
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, token, password } = req.body;

    // Hash token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token, email, and not expired
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    // Set new password (will be hashed in pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    logger.info(`Password reset completed successfully for user: ${user.username}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
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
