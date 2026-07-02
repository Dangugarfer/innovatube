const express = require('express');
const { body, validationResult } = require('express-validator');
const { getFavorites, addFavorite, removeFavorite, updateFavoriteCategory } = require('../controllers/favorites.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// Proteger todas las rutas
router.use(protect);

router.route('/')
  .get(getFavorites)
  .post(
    [
      body('videoId').notEmpty().withMessage('El ID del video es obligatorio').trim(),
      body('title').notEmpty().withMessage('El título es obligatorio').trim(),
      body('thumbnailUrl').notEmpty().withMessage('La URL de la miniatura es obligatoria').trim()
    ],
    validate,
    addFavorite
  );

router.route('/:videoId')
  .delete(removeFavorite);

router.route('/:videoId/category')
  .put(
    [
      body('category').notEmpty().withMessage('La categoría es obligatoria').trim()
    ],
    validate,
    updateFavoriteCategory
  );

module.exports = router;
