const express = require('express');
const { searchVideos } = require('../controllers/videos.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply protection middleware to all video routes
router.use(protect);

router.get('/search', searchVideos);

module.exports = router;
