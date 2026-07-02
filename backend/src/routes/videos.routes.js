const express = require('express');
const { searchVideos } = require('../controllers/videos.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de protección a todas las rutas de videos
router.use(protect);

router.get('/search', searchVideos);

module.exports = router;
