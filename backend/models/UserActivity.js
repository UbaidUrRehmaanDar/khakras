const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    activityType: {
        type: String,
        enum: ['play', 'pause', 'skip', 'like', 'unlike', 'playlist_create', 'playlist_add', 'search'],
        required: true
    },
    songId: {
        type: String,
        required: function() {
            return ['play', 'pause', 'skip', 'like', 'unlike'].includes(this.activityType);
        }
    },
    songTitle: String,
    songArtist: String,
    playlistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Playlist',
        required: function() {
            return ['playlist_create', 'playlist_add'].includes(this.activityType);
        }
    },
    searchQuery: {
        type: String,
        required: function() {
            return this.activityType === 'search';
        }
    },
    metadata: {
        duration: Number,
        position: Number,
        device: String,
        ipAddress: String
    }
}, {
    timestamps: true
});

// Index for better query performance
userActivitySchema.index({ user: 1, createdAt: -1 });
userActivitySchema.index({ activityType: 1, createdAt: -1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);