const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  videoId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  thumbnailUrl: {
    type: String,
    required: true
  },
  channelTitle: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'General'
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Asegurar que un usuario solo pueda marcar un video como favorito una vez
favoriteSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
