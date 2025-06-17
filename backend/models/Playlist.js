const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    songs: [{
        songId: {
            type: String,
            required: true
        },
        title: String,
        artist: String,
        album: String,
        duration: Number,
        coverImage: String,
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    coverImage: {
        type: String,
        default: null
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    collaborators: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        permissions: {
            type: String,
            enum: ['view', 'edit', 'admin'],
            default: 'view'
        }
    }],
    tags: [{
        type: String,
        trim: true
    }],
    totalDuration: {
        type: Number,
        default: 0
    },
    playCount: {
        type: Number,
        default: 0
    },
    lastPlayed: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Calculate total duration when songs are added/removed
playlistSchema.pre('save', function(next) {
    this.totalDuration = this.songs.reduce((total, song) => total + (song.duration || 0), 0);
    next();
});

module.exports = mongoose.model('Playlist', playlistSchema);