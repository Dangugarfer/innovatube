const express = require('express');
const { body, validationResult } = require('express-validator');
const { getFavorites, addFavorite, removeFavorite } = require('../controllers/favorites.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Protect all routes
router.use(protect);

router.route('/')
  .get(getFavorites)
  .post(
    [
      body('videoId').notEmpty().withMessage('Video ID is required').trim(),
      body('title').notEmpty().withMessage('Title is required').trim(),
      body('thumbnailUrl').notEmpty().withMessage('Thumbnail URL is required').trim()
    ],
    validate,
    addFavorite
  );

router.route('/:videoId')
  .delete(removeFavorite);

module.exports = router;
