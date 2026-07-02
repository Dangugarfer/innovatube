const Favorite = require('../models/Favorite');
const logger = require('../utils/logger');

// @desc    Obtener favoritos del usuario
// @route   GET /api/favorites
// @access  Privado
const getFavorites = async (req, res, next) => {
  try {
    const { q = '' } = req.query;
    
    let searchCriteria = { userId: req.user._id };
    
    if (q.trim()) {
      searchCriteria.title = { $regex: q, $options: 'i' };
    }

    const favorites = await Favorite.find(searchCriteria).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: favorites.length,
      favorites
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Añadir un video a favoritos
// @route   POST /api/favorites
// @access  Privado
const addFavorite = async (req, res, next) => {
  try {
    const { videoId, title, description, thumbnailUrl, channelTitle, publishedAt, category } = req.body;

    // Comprobar si ya está marcado como favorito
    let favorite = await Favorite.findOne({ userId: req.user._id, videoId });
    if (favorite) {
      return res.status(400).json({ success: false, message: 'El video ya está en favoritos' });
    }

    favorite = await Favorite.create({
      userId: req.user._id,
      videoId,
      title,
      description,
      thumbnailUrl,
      channelTitle,
      publishedAt,
      category: category || 'General'
    });

    res.status(201).json({
      success: true,
      favorite
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Eliminar un video de favoritos
// @route   DELETE /api/favorites/:videoId
// @access  Privado
const removeFavorite = async (req, res, next) => {
  try {
    const { videoId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      userId: req.user._id,
      videoId
    });

    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favorito no encontrado' });
    }

    res.status(200).json({
      success: true,
      message: 'Video eliminado de favoritos'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Actualizar la categoría de un video favorito
// @route   PUT /api/favorites/:videoId/category
// @access  Privado
const updateFavoriteCategory = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ success: false, message: 'La categoría es obligatoria' });
    }

    const favorite = await Favorite.findOneAndUpdate(
      { userId: req.user._id, videoId },
      { category },
      { new: true }
    );

    if (!favorite) {
      return res.status(404).json({ success: false, message: 'Favorito no encontrado' });
    }

    res.status(200).json({
      success: true,
      message: 'Categoría actualizada correctamente',
      favorite
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  updateFavoriteCategory
};
