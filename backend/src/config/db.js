const mongoose = require('mongoose');
const dns = require('dns');
const logger = require('../utils/logger');

//  Configurar servidores DNS de reserva
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  logger.warn(`Failed to set DNS servers: ${dnsErr.message}`);
}


const connectDB = async () => {
  try {
    const connString = process.env.MONGO_URI || 'mongodb://localhost:27017/innovatube';
    logger.info('Connecting to MongoDB...');
    const conn = await mongoose.connect(connString);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
