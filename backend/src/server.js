// Cargar variables de entorno
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');

// Archivos de rutas
const authRoutes = require('./routes/auth.routes');
const videoRoutes = require('./routes/videos.routes');
const favoriteRoutes = require('./routes/favorites.routes');
const statsRoutes = require('./routes/stats.routes');

// Conectar a la base de datos
connectDB();

const app = express();

// Middlewares de seguridad
app.use(helmet());

// Configuración de CORS - restringido a CLIENT_URL
const clientUrl = process.env.CLIENT_URL || 'http://localhost:4200';
logger.info(`CORS configurado para permitir el origen: ${clientUrl}`);
app.use(cors({
  origin: clientUrl,
  credentials: true
}));

// Analizador del cuerpo de la petición (Body parser)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Registro de peticiones HTTP con Morgan redirigido a Winston
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  }
};
app.use(morgan('combined', { stream: morganStream }));

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/stats', statsRoutes);

// Endpoint de verificación de estado (Health check)
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'El servidor está sano' });
});

// Ruta raíz - mensaje/redirección
app.get('/', (req, res) => {
  res.send('La API de InnovaTube está en ejecución...');
});

// Middleware de manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Servidor ejecutándose en modo ${process.env.NODE_ENV || 'desarrollo'} en el puerto ${PORT}`);
});

// Manejar rechazos de promesas no controlados
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Error: ${err.message}`);
  // Cerrar servidor y salir del proceso
  server.close(() => process.exit(1));
});
