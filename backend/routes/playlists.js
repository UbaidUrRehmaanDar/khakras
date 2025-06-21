const express = require('express');
const Playlist = require('../models/Playlist');
const UserActivity = require('../models/UserActivity');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/playlists
// @desc    Get user's playlists
// @access  Private
router.get('/', authenticate, async (req, res) => {
    try {
        // Check if user has a "Liked Songs" playlist, create if not
        let likedSongsPlaylist = await Playlist.findOne({
            owner: req.user._id,
            playlistType: 'liked_songs'
        });

        if (!likedSongsPlaylist) {
            // Create Liked Songs playlist
            likedSongsPlaylist = new Playlist({
                name: 'Liked Songs',
                description: 'Your liked songs',
                owner: req.user._id,
                isSystemPlaylist: true,
                playlistType: 'liked_songs',
                isPublic: false,
                songs: []
            });
            await likedSongsPlaylist.save();
        }

        const playlists = await Playlist.find({ owner: req.user._id })
            .sort({ 
                playlistType: 1,  // liked_songs first (alphabetically)
                createdAt: -1 
            })
            .populate('owner', 'username fullName avatar');

        res.json({
            success: true,
            data: {
                playlists,
                count: playlists.length
            }
        });

    } catch (error) {
        console.error('Get playlists error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/playlists/public
// @desc    Get public playlists
// @access  Public
router.get('/public', optionalAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const playlists = await Playlist.find({ isPublic: true })
            .sort({ playCount: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('owner', 'username fullName avatar');

        const total = await Playlist.countDocuments({ isPublic: true });

        res.json({
            success: true,
            data: {
                playlists,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalItems: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get public playlists error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/playlists/:id
// @desc    Get playlist by ID
// @access  Public (if public playlist) / Private (if owner or collaborator)
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id)
            .populate('owner', 'username fullName avatar')
            .populate('collaborators.user', 'username fullName avatar');

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: 'Playlist not found'
            });
        }

        // Check access permissions
        const isOwner = req.user && playlist.owner._id.toString() === req.user._id.toString();
        const isCollaborator = req.user && playlist.collaborators.some(
            collab => collab.user._id.toString() === req.user._id.toString()
        );

        if (!playlist.isPublic && !isOwner && !isCollaborator) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this private playlist'
            });
        }

        res.json({
            success: true,
            data: {
                playlist
            }
        });

    } catch (error) {
        console.error('Get playlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/playlists
// @desc    Create new playlist
// @access  Private
router.post(
    '/',
    [
        authenticate,
        [
            check('name', 'Playlist name is required').not().isEmpty(),
            check('name', 'Name must be under 100 characters').isLength({ max: 100 }),
            check('description', 'Description must be under 500 characters').optional().isLength({ max: 500 }),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }        const { name, description, isPublic, tags, coverImage } = req.body;

        try {
            const newPlaylist = new Playlist({
                name,
                description,
                isPublic: isPublic || false,
                tags: tags || [],
                coverImage: coverImage || null,
                owner: req.user.id,
            });

            const playlist = await newPlaylist.save();
            res.status(201).json(playlist);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   PUT /api/playlists/:id
// @desc    Update playlist
// @access  Private (owner only)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: 'Playlist not found'
            });
        }

        // Check if user is the owner
        if (playlist.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the playlist owner can update it'
            });
        }

        const { name, description, isPublic, tags, coverImage } = req.body;

        // Prevent renaming/modifying system playlists
        if (playlist.isSystemPlaylist || playlist.playlistType === 'liked_songs') {
            // Only allow certain updates for system playlists
            if (coverImage !== undefined) playlist.coverImage = coverImage;
            // Don't allow name/description changes for system playlists
        } else {
            // Update fields for normal playlists
            if (name) playlist.name = name.trim();
            if (description !== undefined) playlist.description = description?.trim();
            if (typeof isPublic === 'boolean') playlist.isPublic = isPublic;
            if (tags) playlist.tags = tags;
            if (coverImage !== undefined) playlist.coverImage = coverImage;
        }

        await playlist.save();
        await playlist.populate('owner', 'username fullName avatar');

        res.json({
            success: true,
            message: 'Playlist updated successfully',
            data: {
                playlist
            }
        });

    } catch (error) {
        console.error('Update playlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/playlists/:id/songs
// @desc    Add song to playlist
// @access  Private (owner or collaborator with edit permissions)
router.post('/:id/songs', authenticate, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: 'Playlist not found'
            });
        }

        // Check permissions
        const isOwner = playlist.owner.toString() === req.user._id.toString();
        const collaborator = playlist.collaborators.find(
            collab => collab.user.toString() === req.user._id.toString()
        );
        const canEdit = isOwner || (collaborator && ['edit', 'admin'].includes(collaborator.permissions));

        if (!canEdit) {
            return res.status(403).json({
                success: false,
                message: 'No permission to add songs to this playlist'
            });
        }

        const { songId, title, artist, album, duration, coverImage } = req.body;

        if (!songId || !title || !artist) {
            return res.status(400).json({
                success: false,
                message: 'songId, title, and artist are required'
            });
        }

        // Check if song already exists in playlist
        const existingSong = playlist.songs.find(song => song.songId === songId);
        if (existingSong) {
            return res.status(400).json({
                success: false,
                message: 'Song already exists in playlist'
            });
        }

        // Add song to playlist
        playlist.songs.push({
            songId,
            title,
            artist,
            album,
            duration,
            coverImage
        });

        await playlist.save();

        // Log activity
        await new UserActivity({
            user: req.user._id,
            activityType: 'playlist_add',
            songId,
            songTitle: title,
            songArtist: artist,
            playlistId: playlist._id
        }).save();

        res.json({
            success: true,
            message: 'Song added to playlist successfully',
            data: {
                playlist
            }
        });

    } catch (error) {
        console.error('Add song to playlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/playlists/:id/songs/:songId
// @desc    Remove song from playlist
// @access  Private (owner or collaborator with edit permissions)
router.delete('/:id/songs/:songId', authenticate, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: 'Playlist not found'
            });
        }

        // Check permissions
        const isOwner = playlist.owner.toString() === req.user._id.toString();
        const collaborator = playlist.collaborators.find(
            collab => collab.user.toString() === req.user._id.toString()
        );
        const canEdit = isOwner || (collaborator && ['edit', 'admin'].includes(collaborator.permissions));

        if (!canEdit) {
            return res.status(403).json({
                success: false,
                message: 'No permission to remove songs from this playlist'
            });
        }

        // Remove song from playlist
        playlist.songs = playlist.songs.filter(song => song.songId !== req.params.songId);
        await playlist.save();

        res.json({
            success: true,
            message: 'Song removed from playlist successfully',
            data: {
                playlist
            }
        });

    } catch (error) {
        console.error('Remove song from playlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/playlists/:id
// @desc    Delete playlist
// @access  Private (owner only)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: 'Playlist not found'
            });
        }

        // Check if user is the owner
        if (playlist.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the playlist owner can delete it'
            });
        }

        // Prevent deletion of system playlists
        if (playlist.isSystemPlaylist || playlist.playlistType === 'liked_songs') {
            return res.status(403).json({
                success: false,
                message: 'System playlists cannot be deleted'
            });
        }

        await Playlist.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Playlist deleted successfully'
        });

    } catch (error) {
        console.error('Delete playlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/playlists/:id/play
// @desc    Increment playlist play count
// @access  Public
router.post('/:id/play', optionalAuth, async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);

        if (!playlist) {
            return res.status(404).json({
                success: false,
                message: 'Playlist not found'
            });
        }

        // Increment play count and update last played
        playlist.playCount += 1;
        playlist.lastPlayed = new Date();
        await playlist.save();

        res.json({
            success: true,
            message: 'Play count updated'
        });

    } catch (error) {
        console.error('Update play count error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;