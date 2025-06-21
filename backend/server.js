const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow all localhost and 127.0.0.1 origins for development
        if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/covers', express.static(path.join(__dirname, 'covers')));

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🎵 Connected to MongoDB - Chakras Database');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: '🎵 Chakras Music Player API is running!',
        version: '2.0.0',
        features: ['Authentication', 'Playlists', 'User Management', 'Music Library']
    });
});

// Import routes
const authRoutes = require('./routes/auth');
const songRoutes = require('./routes/songs');
const playlistRoutes = require('./routes/playlists');
const musicRoutes = require('./routes/music');
const uploadRoutes = require('./routes/upload');
const likesRoutes = require('./routes/likes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/likes', likesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Chakras server running on port ${PORT}`);
        console.log(`🎵 Music library ready at D:\\Music`);
        console.log(`🔐 Authentication system enabled`);
        console.log(`📱 API available at http://localhost:${PORT}`);
    });
});