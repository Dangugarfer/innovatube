const express = require('express');
const {
  recordPlayback,
  getPlaybackHistory,
  getVideoProgress,
  getStatisticsSummary
} = require('../controllers/stats.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Proteger todas las rutas de estadísticas e historial
router.use(protect);

// Rutas de historial y estadísticas
router.post('/history', recordPlayback);
router.get('/history', getPlaybackHistory);
router.get('/progress/:videoId', getVideoProgress);
router.get('/summary', getStatisticsSummary);

module.exports = router;
