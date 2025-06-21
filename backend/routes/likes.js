const express = require('express');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const Song = require('../models/Song');
const UserActivity = require('../models/UserActivity');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Helper function to get song info from music library
// This should be shared with the music routes, but for now we'll access the global musicLibrary
let musicLibrary = null;

// Import or access the music library (we'll need to get this from the music scanner)
const getMusicLibrary = () => {
    // For now, we'll try to get it from the music route's library
    // In a production app, this should be properly managed
    return global.musicLibrary || null;
};

const getSongInfo = (songId) => {
    const library = getMusicLibrary();
    if (!library || !library.songs) return null;
    
    return library.songs.find(song => song.id === songId) || null;
};

// @route   POST /api/likes/toggle/:songId
// @desc    Toggle like status for a song
// @access  Private
router.post('/toggle/:songId', authenticate, async (req, res) => {
    try {        const { songId } = req.params;
        const user = req.user;

        // Get song info from music library
        const songInfo = getSongInfo(songId);
        if (!songInfo) {
            return res.status(404).json({
                success: false,
                message: 'Song not found in music library'
            });
        }

        // Check if song is already liked
        const isLiked = user.likedSongs.includes(songId);
        let likedSongsPlaylist;

        if (isLiked) {
            // Unlike the song
            user.likedSongs = user.likedSongs.filter(id => id !== songId);
            
            // Remove from Liked Songs playlist
            likedSongsPlaylist = await Playlist.findOne({
                owner: user._id,
                playlistType: 'liked_songs'
            });

            if (likedSongsPlaylist) {
                likedSongsPlaylist.songs = likedSongsPlaylist.songs.filter(
                    s => s.songId !== songId
                );
                await likedSongsPlaylist.save();
            }            // Log activity
            await UserActivity.create({
                user: user._id,
                activityType: 'unlike',
                songId: songId,
                songTitle: songInfo.title,
                songArtist: songInfo.artist
            });

            await user.save();

            res.json({
                success: true,
                message: 'Song unliked successfully',
                data: {
                    isLiked: false,
                    likedSongsCount: user.likedSongs.length
                }
            });

        } else {
            // Like the song
            user.likedSongs.push(songId);

            // Find or create Liked Songs playlist
            likedSongsPlaylist = await Playlist.findOne({
                owner: user._id,
                playlistType: 'liked_songs'
            });

            if (!likedSongsPlaylist) {
                // Create Liked Songs playlist
                likedSongsPlaylist = new Playlist({
                    name: 'Liked Songs',
                    description: 'Your liked songs',
                    owner: user._id,
                    isSystemPlaylist: true,
                    playlistType: 'liked_songs',
                    isPublic: false,
                    songs: []
                });
            }            // Add song to Liked Songs playlist
            likedSongsPlaylist.songs.push({
                songId: songId,
                title: songInfo.title,
                artist: songInfo.artist,
                album: songInfo.album,
                duration: songInfo.duration,
                coverImage: songInfo.coverImage,
                addedAt: new Date()
            });

            await likedSongsPlaylist.save();            // Log activity
            await UserActivity.create({
                user: user._id,
                activityType: 'like',
                songId: songId,
                songTitle: songInfo.title,
                songArtist: songInfo.artist
            });

            await user.save();

            res.json({
                success: true,
                message: 'Song liked successfully',
                data: {
                    isLiked: true,
                    likedSongsCount: user.likedSongs.length,
                    likedSongsPlaylistId: likedSongsPlaylist._id
                }
            });
        }

    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while toggling like'
        });
    }
});

// @route   GET /api/likes/status/:songId
// @desc    Get like status for a song
// @access  Private
router.get('/status/:songId', authenticate, async (req, res) => {
    try {
        const { songId } = req.params;
        const user = req.user;

        const isLiked = user.likedSongs.includes(songId);

        res.json({
            success: true,
            data: {
                isLiked,
                likedSongsCount: user.likedSongs.length
            }
        });

    } catch (error) {
        console.error('Get like status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while getting like status'
        });
    }
});

// @route   GET /api/likes/songs
// @desc    Get all liked songs for user
// @access  Private
router.get('/songs', authenticate, async (req, res) => {
    try {
        const user = req.user;

        // Get liked songs playlist
        const likedSongsPlaylist = await Playlist.findOne({
            owner: user._id,
            playlistType: 'liked_songs'
        });

        if (!likedSongsPlaylist) {
            return res.json({
                success: true,
                data: {
                    songs: [],
                    playlistId: null
                }
            });
        }

        res.json({
            success: true,
            data: {
                songs: likedSongsPlaylist.songs,
                playlistId: likedSongsPlaylist._id,
                playlist: likedSongsPlaylist
            }
        });

    } catch (error) {
        console.error('Get liked songs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while getting liked songs'
        });
    }
});

module.exports = router;
