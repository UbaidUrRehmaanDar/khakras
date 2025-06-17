class MusicLibrary {
    constructor() {
        this.baseUrl = 'http://localhost:5000/api/music';
        this.isScanning = false;
        this.library = null;
    }

    async scanLibrary() {
        if (this.isScanning) {
            console.log('Scan already in progress...');
            return;
        }

        try {
            this.showScanProgress(true);
            
            const response = await fetch(`${this.baseUrl}/scan`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Library scan complete:', data.stats);
                await this.loadLibrary();
                this.showScanProgress(false, data.stats);
                return data;
            } else {
                throw new Error(data.message);
            }
            
        } catch (error) {
            console.error('❌ Scan failed:', error);
            this.showScanProgress(false, null, error.message);
            throw error;
        }
    }

    async loadLibrary() {
        try {
            const [songsRes, artistsRes, albumsRes] = await Promise.all([
                fetch(`${this.baseUrl}/songs`),
                fetch(`${this.baseUrl}/artists`),
                fetch(`${this.baseUrl}/albums`)
            ]);

            const songs = await songsRes.json();
            const artists = await artistsRes.json();
            const albums = await albumsRes.json();

            this.library = {
                songs: songs.songs || [],
                artists: artists,
                albums: albums
            };

            console.log('📚 Library loaded:', {
                songs: this.library.songs.length,
                artists: this.library.artists.length,
                albums: this.library.albums.length
            });

            return this.library;
        } catch (error) {
            console.error('❌ Failed to load library:', error);
            throw error;
        }
    }

    async searchMusic(query) {
        try {
            const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error('❌ Search failed:', error);
            return [];
        }
    }

    async getArtistSongs(artistName) {
        try {
            const response = await fetch(`${this.baseUrl}/artists/${encodeURIComponent(artistName)}/songs`);
            const data = await response.json();
            return data.songs || [];
        } catch (error) {
            console.error('❌ Failed to get artist songs:', error);
            return [];
        }
    }

    getStreamUrl(songId) {
        return `${this.baseUrl}/stream/${songId}`;
    }

    getCoverUrl(songId) {
        return `${this.baseUrl}/cover/${songId}`;
    }

    showScanProgress(isScanning, stats = null, error = null) {
        if (isScanning) {
            console.log('🔄 Scanning in progress...');
        } else if (stats) {
            console.log('✅ Scan completed:', stats);
        } else if (error) {
            console.error('❌ Scan error:', error);
        }
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatFileSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

window.musicLibrary = new MusicLibrary();