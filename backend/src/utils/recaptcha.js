const axios = require('axios');
const logger = require('./logger');

const verifyRecaptcha = async (token, remoteIp) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    logger.warn('RECAPTCHA_SECRET_KEY no está definida. Omitiendo validación (permitiendo petición).');
    return true;
  }

  if (!token) {
    logger.error('Falta el token de reCAPTCHA');
    return false;
  }

  try {
    const url = 'https://www.google.com/recaptcha/api/siteverify';
    const response = await axios.post(
      url,
      null,
      {
        params: {
          secret: secretKey,
          response: token,
          remoteip: remoteIp
        }
      }
    );

    const { success, score, 'error-codes': errorCodes } = response.data;
    if (!success) {
      logger.error('Fallo en la verificación de reCAPTCHA. Códigos de error: %o', errorCodes);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error en la petición de verificación de reCAPTCHA: %s', error.message);
    return false;
  }
};

module.exports = { verifyRecaptcha };
