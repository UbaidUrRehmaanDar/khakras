const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../middleware/auth');
const fs = require('fs').promises;

const router = express.Router();

// Configure multer for cover image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../covers'));
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'cover_' + uniqueSuffix + extension);
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// @route   POST /api/upload/cover
// @desc    Upload playlist cover image
// @access  Private
router.post('/cover', authenticate, upload.single('cover'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Return the file URL
        const fileUrl = `/covers/${req.file.filename}`;
        
        res.json({
            success: true,
            message: 'Cover image uploaded successfully',
            data: {
                url: fileUrl,
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size
            }
        });

    } catch (error) {
        console.error('Cover upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading cover image'
        });
    }
});

// @route   DELETE /api/upload/cover/:filename
// @desc    Delete playlist cover image
// @access  Private
router.delete('/cover/:filename', authenticate, async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../covers', filename);

        // Check if file exists and delete it
        try {
            await fs.unlink(filePath);
            res.json({
                success: true,
                message: 'Cover image deleted successfully'
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({
                    success: false,
                    message: 'Cover image not found'
                });
            }
            throw error;
        }

    } catch (error) {
        console.error('Cover delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting cover image'
        });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
    }
    
    if (error.message.includes('Only image files are allowed')) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    next(error);
});

module.exports = router;
