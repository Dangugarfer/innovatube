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
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure a user can only favorite a specific video once
favoriteSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
