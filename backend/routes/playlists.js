const express = require('express');
const Playlist = require('../models/Playlist');
const UserActivity = require('../models/UserActivity');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/playlists
// @desc    Get user's playlists
// @access  Private
router.get('/', authenticate, async (req, res) => {
    try {
        const playlists = await Playlist.find({ owner: req.user._id })
            .sort({ createdAt: -1 })
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
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, description, isPublic = false, tags = [] } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Playlist name is required'
            });
        }

        const playlist = new Playlist({
            name: name.trim(),
            description: description?.trim(),
            owner: req.user._id,
            isPublic,
            tags
        });

        await playlist.save();
        await playlist.populate('owner', 'username fullName avatar');

        // Log activity
        await new UserActivity({
            user: req.user._id,
            activityType: 'playlist_create',
            playlistId: playlist._id
        }).save();

        res.status(201).json({
            success: true,
            message: 'Playlist created successfully',
            data: {
                playlist
            }
        });

    } catch (error) {
        console.error('Create playlist error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

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

        // Update fields
        if (name) playlist.name = name.trim();
        if (description !== undefined) playlist.description = description?.trim();
        if (typeof isPublic === 'boolean') playlist.isPublic = isPublic;
        if (tags) playlist.tags = tags;
        if (coverImage !== undefined) playlist.coverImage = coverImage;

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