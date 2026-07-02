const History = require('../models/History');
const Favorite = require('../models/Favorite');
const logger = require('../utils/logger');

// @desc    Registrar o actualizar reproducción de un video
// @route   POST /api/stats/history
// @access  Privado
const recordPlayback = async (req, res, next) => {
  try {
    const {
      videoId,
      title,
      description,
      thumbnailUrl,
      channelTitle,
      publishedAt,
      lastTimePosition = 0,
      watchTimeIncrement = 0,
      category = 'General',
      isNewSession = false
    } = req.body;

    if (!videoId || !title) {
      return res.status(400).json({ success: false, message: 'El ID del video y el título son obligatorios' });
    }

    // Buscar si ya existe el registro de historial
    let history = await History.findOne({ userId: req.user._id, videoId });

    if (!history) {
      // Crear nuevo registro en el historial
      history = await History.create({
        userId: req.user._id,
        videoId,
        title,
        description,
        thumbnailUrl,
        channelTitle,
        publishedAt,
        playCount: 1,
        lastTimePosition,
        watchTime: watchTimeIncrement,
        category: category || 'General',
        lastWatched: Date.now()
      });
      logger.info(`Nuevo historial de reproducción creado para el usuario ${req.user.username} y video ${videoId}`);
    } else {
      // Actualizar registro existente
      const updateData = {
        lastTimePosition,
        lastWatched: Date.now()
      };

      // Incrementar tiempo reproducido acumulado
      if (watchTimeIncrement > 0) {
        updateData.$inc = { watchTime: watchTimeIncrement };
      }

      // Incrementar contador de reproducciones si es una sesión nueva
      if (isNewSession) {
        if (!updateData.$inc) updateData.$inc = {};
        updateData.$inc.playCount = 1;
      }

      if (category && category !== 'General') {
        updateData.category = category;
      }

      history = await History.findOneAndUpdate(
        { userId: req.user._id, videoId },
        updateData,
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    logger.error('Error al registrar reproducción: %s', error.message);
    next(error);
  }
};

// @desc    Obtener historial de reproducción del usuario
// @route   GET /api/stats/history
// @access  Privado
const getPlaybackHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const history = await History.find({ userId: req.user._id })
      .sort({ lastWatched: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    logger.error('Error al obtener el historial de reproducción: %s', error.message);
    next(error);
  }
};

// @desc    Obtener el progreso (posición en segundos) de un video específico
// @route   GET /api/stats/progress/:videoId
// @access  Privado
const getVideoProgress = async (req, res, next) => {
  try {
    const { videoId } = req.params;
    const history = await History.findOne({ userId: req.user._id, videoId });

    res.status(200).json({
      success: true,
      progress: history ? { lastTimePosition: history.lastTimePosition } : { lastTimePosition: 0 }
    });
  } catch (error) {
    logger.error('Error al obtener el progreso del video: %s', error.message);
    next(error);
  }
};

// @desc    Obtener resumen de estadísticas y logros del usuario
// @route   GET /api/stats/summary
// @access  Privado
const getStatisticsSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Obtener todos los registros de historial del usuario
    const historyItems = await History.find({ userId });
    const favoritesCount = await Favorite.countDocuments({ userId });

    // 2. Calcular agregados generales
    const totalVideosWatched = historyItems.length; // Videos distintos reproducidos
    const totalPlays = historyItems.reduce((sum, item) => sum + item.playCount, 0);
    const totalWatchTime = historyItems.reduce((sum, item) => sum + (item.watchTime || 0), 0);

    // 3. Videos más vistos/reproducidos (ordenados por playCount desc, max 5)
    const mostPlayedVideos = [...historyItems]
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5)
      .map(item => ({
        videoId: item.videoId,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl,
        playCount: item.playCount,
        watchTime: item.watchTime
      }));

    // 4. Agrupar por categoría
    const categoriesMap = {};
    historyItems.forEach(item => {
      const cat = item.category || 'General';
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { category: cat, watchTime: 0, playCount: 0, videoCount: 0 };
      }
      categoriesMap[cat].watchTime += item.watchTime || 0;
      categoriesMap[cat].playCount += item.playCount;
      categoriesMap[cat].videoCount += 1;
    });

    const categoryBreakdown = Object.values(categoriesMap)
      .sort((a, b) => b.watchTime - a.watchTime);

    // 5. Actividad reciente (últimos 7 reproducidos)
    const recentActivity = [...historyItems]
      .sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched))
      .slice(0, 7)
      .map(item => ({
        videoId: item.videoId,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl,
        lastWatched: item.lastWatched,
        lastTimePosition: item.lastTimePosition
      }));

    res.status(200).json({
      success: true,
      summary: {
        totalVideosWatched,
        totalPlays,
        totalWatchTime,
        favoritesCount,
        mostPlayedVideos,
        categoryBreakdown,
        recentActivity
      }
    });
  } catch (error) {
    logger.error('Error al generar resumen de estadísticas: %s', error.message);
    next(error);
  }
};

module.exports = {
  recordPlayback,
  getPlaybackHistory,
  getVideoProgress,
  getStatisticsSummary
};
