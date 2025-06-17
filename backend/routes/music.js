const express = require('express');
const MusicScanner = require('../services/musicScanner');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Initialize music scanner
const musicScanner = new MusicScanner();
let isScanning = false;
let musicLibrary = null;

// Scan music library
router.post('/scan', async (req, res) => {
    if (isScanning) {
        return res.status(400).json({ message: 'Scan already in progress' });
    }

    try {
        isScanning = true;
        console.log('🎵 Starting scan request...');
        
        musicLibrary = await musicScanner.scanLibrary();
        isScanning = false;
        
        res.json({
            message: 'Music library scanned successfully',
            stats: {
                totalSongs: musicLibrary.songs.length,
                totalArtists: Object.keys(musicLibrary.artists).length,
                totalAlbums: Object.keys(musicLibrary.albums).length,
                totalGenres: Object.keys(musicLibrary.genres).length
            },
            library: musicLibrary
        });
    } catch (error) {
        isScanning = false;
        console.error('❌ Scan error:', error);
        res.status(500).json({ message: 'Scan failed', error: error.message });
    }
});

// Get all songs
router.get('/songs', (req, res) => {
    if (!musicLibrary) {
        return res.status(400).json({ message: 'Music library not yet scanned. Please scan first.' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const songs = musicLibrary.songs.slice(startIndex, endIndex);
    
    res.json({
        songs,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(musicLibrary.songs.length / limit),
            totalSongs: musicLibrary.songs.length,
            hasNext: endIndex < musicLibrary.songs.length,
            hasPrev: startIndex > 0
        }
    });
});

// Get all artists
router.get('/artists', (req, res) => {
    if (!musicLibrary) {
        return res.status(400).json({ message: 'Music library not yet scanned. Please scan first.' });
    }
    
    const artists = Object.values(musicLibrary.artists).map(artist => ({
        ...artist,
        albumCount: artist.albums.length,
        songCount: artist.songs.length
    }));
    
    res.json(artists);
});

// Get songs by artist
router.get('/artists/:artistName/songs', (req, res) => {
    if (!musicLibrary) {
        return res.status(400).json({ message: 'Music library not yet scanned. Please scan first.' });
    }
    
    const artistName = decodeURIComponent(req.params.artistName);
    const songs = musicScanner.getSongsByArtist(artistName);
    
    res.json({ artist: artistName, songs });
});

// Get all albums
router.get('/albums', (req, res) => {
    if (!musicLibrary) {
        return res.status(400).json({ message: 'Music library not yet scanned. Please scan first.' });
    }
    
    const albums = Object.values(musicLibrary.albums).map(album => ({
        ...album,
        songCount: album.songs.length,
        formattedDuration: formatDuration(album.totalDuration)
    }));
    
    res.json(albums);
});

// Get songs by album
router.get('/albums/:albumTitle/songs', (req, res) => {
    if (!musicLibrary) {
        return res.status(400).json({ message: 'Music library not yet scanned. Please scan first.' });
    }
    
    const albumTitle = decodeURIComponent(req.params.albumTitle);
    const artistName = req.query.artist;
    
    if (!artistName) {
        return res.status(400).json({ message: 'Artist name is required' });
    }
    
    const songs = musicScanner.getSongsByAlbum(albumTitle, artistName);
    res.json({ album: albumTitle, artist: artistName, songs });
});

// Search music
router.get('/search', (req, res) => {
    if (!musicLibrary) {
        return res.status(400).json({ message: 'Music library not yet scanned. Please scan first.' });
    }
    
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
    }
    
    const results = musicScanner.searchSongs(query);
    res.json({ query, results, count: results.length });
});

// Stream audio file
router.get('/stream/:songId', (req, res) => {
    if (!musicLibrary) {
        return res.status(400).json({ message: 'Music library not yet scanned' });
    }
    
    const songId = req.params.songId;
    const song = musicLibrary.songs.find(s => s.id === songId);
    
    if (!song) {
        return res.status(404).json({ message: 'Song not found' });
    }
    
    const filePath = song.filePath;
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Audio file not found on disk' });
    }
    
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
        // Support for audio streaming with range requests
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'audio/mpeg',
        };
        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'audio/mpeg',
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
});

// Get scan status
router.get('/scan/status', (req, res) => {
    res.json({
        isScanning,
        hasLibrary: !!musicLibrary,
        stats: musicLibrary ? {
            totalSongs: musicLibrary.songs.length,
            totalArtists: Object.keys(musicLibrary.artists).length,
            totalAlbums: Object.keys(musicLibrary.albums).length
        } : null
    });
});

// Helper function
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = router;