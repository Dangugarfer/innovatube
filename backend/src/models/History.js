const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
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
  },
  playCount: {
    type: Number,
    default: 1
  },
  lastTimePosition: {
    type: Number, // seconds
    default: 0
  },
  watchTime: {
    type: Number, // seconds, accumulated
    default: 0
  },
  category: {
    type: String,
    default: 'General'
  },
  lastWatched: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Asegurar que un usuario solo pueda tener un registro de historial por video
historySchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('History', historySchema);
