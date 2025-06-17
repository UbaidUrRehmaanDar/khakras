const fs = require('fs-extra');
const path = require('path');
const mm = require('music-metadata');

class MusicScanner {
    constructor() {
        this.musicPath = 'D:\\Music';
        this.coversPath = path.join(__dirname, '..', 'covers');
        this.supportedFormats = ['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg', '.wma'];
        this.musicLibrary = {
            songs: [],
            artists: {},
            albums: {},
            genres: {}
        };
        
        // Ensure covers directory exists
        fs.ensureDirSync(this.coversPath);
    }

    async scanLibrary() {
        console.log('🎵 Starting music library scan...');
        console.log(`📂 Scanning directory: ${this.musicPath}`);
        
        try {
            // Reset library
            this.musicLibrary = {
                songs: [],
                artists: {},
                albums: {},
                genres: {}
            };

            // Check if music directory exists
            if (!await fs.pathExists(this.musicPath)) {
                throw new Error(`Music directory not found: ${this.musicPath}`);
            }

            await this.scanDirectory(this.musicPath);
            await this.organizeMusicData();
            
            console.log(`✅ Scan complete! Found ${this.musicLibrary.songs.length} songs`);
            console.log(`📁 Artists: ${Object.keys(this.musicLibrary.artists).length}`);
            console.log(`💿 Albums: ${Object.keys(this.musicLibrary.albums).length}`);
            
            return this.musicLibrary;
        } catch (error) {
            console.error('❌ Music scan failed:', error);
            throw error;
        }
    }

    async scanDirectory(dirPath) {
        console.log(`📂 Scanning: ${dirPath}`);
        
        try {
            const items = await fs.readdir(dirPath);
            
            for (const item of items) {
                try {
                    const fullPath = path.join(dirPath, item);
                    const stat = await fs.stat(fullPath);
                    
                    if (stat.isDirectory()) {
                        // This is an artist folder
                        const artistName = item;
                        console.log(`👤 Scanning artist: ${artistName}`);
                        await this.scanArtistFolder(fullPath, artistName);
                    } else if (this.isSupportedAudioFile(fullPath)) {
                        // Direct music file in root
                        console.log(`🎵 Processing root file: ${item}`);
                        await this.processAudioFile(fullPath);
                    }
                } catch (itemError) {
                    console.error(`❌ Error processing item ${item}:`, itemError.message);
                    continue;
                }
            }
        } catch (error) {
            console.error(`❌ Error reading directory ${dirPath}:`, error);
            throw error;
        }
    }

    async scanArtistFolder(artistPath, artistName) {
        try {
            const items = await fs.readdir(artistPath);
            
            for (const item of items) {
                try {
                    const fullPath = path.join(artistPath, item);
                    const stat = await fs.stat(fullPath);
                    
                    if (stat.isDirectory()) {
                        // Album folder
                        console.log(`💿 Scanning album: ${artistName} - ${item}`);
                        await this.scanAlbumFolder(fullPath, artistName, item);
                    } else if (this.isSupportedAudioFile(fullPath)) {
                        // Direct song in artist folder
                        await this.processAudioFile(fullPath, artistName);
                    }
                } catch (itemError) {
                    console.error(`❌ Error processing ${item} in ${artistName}:`, itemError.message);
                    continue;
                }
            }
        } catch (error) {
            console.error(`❌ Error scanning artist folder ${artistPath}:`, error);
        }
    }

    async scanAlbumFolder(albumPath, artistName, albumName) {
        try {
            const items = await fs.readdir(albumPath);
            
            for (const item of items) {
                try {
                    const fullPath = path.join(albumPath, item);
                    
                    if (this.isSupportedAudioFile(fullPath)) {
                        await this.processAudioFile(fullPath, artistName, albumName);
                    }
                } catch (itemError) {
                    console.error(`❌ Error processing ${item} in album ${albumName}:`, itemError.message);
                    continue;
                }
            }
        } catch (error) {
            console.error(`❌ Error scanning album folder ${albumPath}:`, error);
        }
    }

    async processAudioFile(filePath, folderArtist = null, folderAlbum = null) {
        try {
            console.log(`🎵 Processing: ${path.basename(filePath)}`);
            
            // Get file stats
            const stats = await fs.stat(filePath);
            
            // Parse metadata
            const metadata = await mm.parseFile(filePath);
            const common = metadata.common;
            
            // Extract cover art
            let coverImageUrl = null;
            if (common.picture && common.picture.length > 0) {
                coverImageUrl = await this.extractCoverArt(filePath, common.picture[0]);
            }

            const song = {
                id: this.generateId(),
                title: common.title || path.basename(filePath, path.extname(filePath)),
                artist: common.artist || folderArtist || 'Unknown Artist',
                album: common.album || folderAlbum || 'Unknown Album',
                genre: common.genre ? common.genre.join(', ') : 'Unknown',
                year: common.year || null,
                track: common.track ? common.track.no : null,
                duration: Math.floor(metadata.format.duration) || 0,
                bitrate: metadata.format.bitrate || 0,
                filePath: filePath,
                fileName: path.basename(filePath),
                fileSize: stats.size,
                coverImage: coverImageUrl,
                dateAdded: new Date(),
                playCount: 0,
                lastPlayed: null
            };

            this.musicLibrary.songs.push(song);
            console.log(`✅ Added: ${song.artist} - ${song.title}`);
            
        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
        }
    }

    async extractCoverArt(audioFilePath, pictureData) {
        try {
            const songId = this.generateId();
            const coverFileName = `cover_${songId}.jpg`;
            const coverPath = path.join(this.coversPath, coverFileName);
            
            // Save cover art
            await fs.writeFile(coverPath, pictureData.data);
            
            // Return URL path for serving
            return `/covers/${coverFileName}`;
            
        } catch (error) {
            console.error('Error extracting cover art:', error);
            return null;
        }
    }

    async organizeMusicData() {
        console.log('📊 Organizing music data...');
        
        // Organize by artists
        this.musicLibrary.songs.forEach(song => {
            const artistKey = song.artist.toLowerCase();
            
            if (!this.musicLibrary.artists[artistKey]) {
                this.musicLibrary.artists[artistKey] = {
                    name: song.artist,
                    songs: [],
                    albums: new Set(),
                    totalDuration: 0,
                    coverImage: null
                };
            }
            
            this.musicLibrary.artists[artistKey].songs.push(song);
            this.musicLibrary.artists[artistKey].albums.add(song.album);
            this.musicLibrary.artists[artistKey].totalDuration += song.duration;
            
            // Use first song's cover as artist cover
            if (!this.musicLibrary.artists[artistKey].coverImage && song.coverImage) {
                this.musicLibrary.artists[artistKey].coverImage = song.coverImage;
            }
        });

        // Convert albums Set to Array
        Object.keys(this.musicLibrary.artists).forEach(artistKey => {
            this.musicLibrary.artists[artistKey].albums = Array.from(this.musicLibrary.artists[artistKey].albums);
        });

        // Organize by albums
        this.musicLibrary.songs.forEach(song => {
            const albumKey = `${song.artist.toLowerCase()}_${song.album.toLowerCase()}`;
            
            if (!this.musicLibrary.albums[albumKey]) {
                this.musicLibrary.albums[albumKey] = {
                    title: song.album,
                    artist: song.artist,
                    songs: [],
                    year: song.year,
                    totalDuration: 0,
                    coverImage: song.coverImage
                };
            }
            
            this.musicLibrary.albums[albumKey].songs.push(song);
            this.musicLibrary.albums[albumKey].totalDuration += song.duration;
        });

        // Organize by genres
        this.musicLibrary.songs.forEach(song => {
            const genres = song.genre.split(',').map(g => g.trim());
            
            genres.forEach(genre => {
                const genreKey = genre.toLowerCase();
                
                if (!this.musicLibrary.genres[genreKey]) {
                    this.musicLibrary.genres[genreKey] = {
                        name: genre,
                        songs: [],
                        artists: new Set()
                    };
                }
                
                this.musicLibrary.genres[genreKey].songs.push(song);
                this.musicLibrary.genres[genreKey].artists.add(song.artist);
            });
        });

        // Convert artists Set to Array for genres
        Object.keys(this.musicLibrary.genres).forEach(genreKey => {
            this.musicLibrary.genres[genreKey].artists = Array.from(this.musicLibrary.genres[genreKey].artists);
        });
    }

    isSupportedAudioFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return this.supportedFormats.includes(ext);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getSongs() {
        return this.musicLibrary.songs;
    }

    getArtists() {
        return this.musicLibrary.artists;
    }

    getAlbums() {
        return this.musicLibrary.albums;
    }

    getGenres() {
        return this.musicLibrary.genres;
    }

    searchSongs(query) {
        const lowerQuery = query.toLowerCase();
        return this.musicLibrary.songs.filter(song => 
            song.title.toLowerCase().includes(lowerQuery) ||
            song.artist.toLowerCase().includes(lowerQuery) ||
            song.album.toLowerCase().includes(lowerQuery) ||
            song.genre.toLowerCase().includes(lowerQuery)
        );
    }

    getSongsByArtist(artistName) {
        const artistKey = artistName.toLowerCase();
        return this.musicLibrary.artists[artistKey]?.songs || [];
    }

    getSongsByAlbum(albumTitle, artistName) {
        const albumKey = `${artistName.toLowerCase()}_${albumTitle.toLowerCase()}`;
        return this.musicLibrary.albums[albumKey]?.songs || [];
    }
}

module.exports = MusicScanner;