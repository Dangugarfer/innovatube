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
    const { videoId, title, description, thumbnailUrl, channelTitle, publishedAt } = req.body;

    // Comprobar si ya está marcado como favorito
    let favorite = await Favorite.findOne({ userId: req.user._id, videoId });
    if (favorite) {
      return res.status(400).json({ success: false, message: 'Video is already in favorites' });
    }

    favorite = await Favorite.create({
      userId: req.user._id,
      videoId,
      title,
      description,
      thumbnailUrl,
      channelTitle,
      publishedAt
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
      return res.status(404).json({ success: false, message: 'Favorite not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Video removed from favorites'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite
};
