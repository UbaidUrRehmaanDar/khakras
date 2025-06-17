const express = require('express');
const Song = require('../models/Song');
const router = express.Router();

// Get all songs
router.get('/', async (req, res) => {
    try {
        const songs = await Song.find({ isPublic: true })
            .populate('uploadedBy', 'username')
            .sort({ createdAt: -1 });
        res.json(songs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get song by ID
router.get('/:id', async (req, res) => {
    try {
        const song = await Song.findById(req.params.id)
            .populate('uploadedBy', 'username');
        
        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }
        
        res.json(song);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Search songs
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query;
        const songs = await Song.find({
            $and: [
                { isPublic: true },
                {
                    $or: [
                        { title: { $regex: query, $options: 'i' } },
                        { artist: { $regex: query, $options: 'i' } },
                        { album: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        }).populate('uploadedBy', 'username');
        
        res.json(songs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;