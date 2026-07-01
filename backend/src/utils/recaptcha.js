const axios = require('axios');
const logger = require('./logger');

const verifyRecaptcha = async (token, remoteIp) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    logger.warn('RECAPTCHA_SECRET_KEY is not defined. Skipping validation (allowing request).');
    return true;
  }

  if (!token) {
    logger.error('reCAPTCHA token is missing');
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
      logger.error('reCAPTCHA verification failed. Error codes: %o', errorCodes);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('reCAPTCHA verification request error: %s', error.message);
    return false;
  }
};

module.exports = { verifyRecaptcha };
