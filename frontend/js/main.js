// Chakras Music Player - COMPLETE Main JavaScript

class ChakrasPlayer {
    constructor() {
        this.currentView = 'albums';
        this.library = null;
        this.audioPlayer = null;
        
        this.init();
    }

    async init() {
        console.log('🎵 Chakras Music Player initializing...');
        
        this.setupEventListeners();
        this.audioPlayer = new ChakrasAudioPlayer();
        await this.loadMusicLibrary();
        
        console.log('✅ Chakras Music Player initialized!');
    }

    async loadMusicLibrary() {
        try {
            console.log('📚 Loading music library...');
            
            const statusRes = await fetch('http://localhost:5000/api/music/scan/status');
            const status = await statusRes.json();
            
            if (!status.hasLibrary) {
                console.log('❌ No library found, showing scan prompt');
                this.showScanPrompt();
            } else {
                console.log('✅ Library exists, loading content');
                await this.loadLibraryContent();
                this.renderCurrentView();
            }
        } catch (error) {
            console.error('❌ Failed to load music library:', error);
            this.showScanPrompt();
        }
    }

    async loadLibraryContent() {
        try {
            const [songsRes, artistsRes, albumsRes] = await Promise.all([
                fetch('http://localhost:5000/api/music/songs?limit=500'),
                fetch('http://localhost:5000/api/music/artists'),
                fetch('http://localhost:5000/api/music/albums')
            ]);

            const songsData = await songsRes.json();
            const artists = await artistsRes.json();
            const albums = await albumsRes.json();

            this.library = {
                songs: songsData.songs || [],
                artists: artists,
                albums: albums
            };

            console.log('📚 Library loaded:', {
                songs: this.library.songs.length,
                artists: this.library.artists.length,
                albums: this.library.albums.length
            });

            if (this.audioPlayer && this.library.songs.length > 0) {
                this.audioPlayer.setPlaylist(this.library.songs);
            }

            this.updatePageStats();

        } catch (error) {
            console.error('❌ Failed to load library content:', error);
            throw error;
        }
    }

    updatePageStats() {
        const statsEl = document.getElementById('page-stats');
        if (statsEl && this.library) {
            const stats = {
                albums: `${this.library.albums.length} albums`,
                artists: `${this.library.artists.length} artists`,
                songs: `${this.library.songs.length} songs`
            };
            
            switch (this.currentView) {
                case 'albums':
                    statsEl.textContent = stats.albums;
                    break;
                case 'artists':
                    statsEl.textContent = stats.artists;
                    break;
                case 'songs':
                    statsEl.textContent = stats.songs;
                    break;
                default:
                    statsEl.textContent = '';
            }
            
            statsEl.classList.remove('hidden');
        }
    }

    showScanPrompt() {
        const albumsGrid = document.getElementById('albums-grid');
        albumsGrid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-16">
                <div class="text-center">
                    <i class="fas fa-music text-6xl text-gray-400 mb-4"></i>
                    <h3 class="text-xl font-semibold text-white mb-2">No Music Library Found</h3>
                    <p class="text-gray-400 mb-6">Scan your D:\\Music folder to get started</p>
                    <button id="start-scan-btn" class="btn-chakra px-6 py-3 rounded-lg text-white">
                        <i class="fas fa-search mr-2"></i>
                        Scan Music Library
                    </button>
                </div>
            </div>
        `;
        
        const scanBtn = document.getElementById('scan-library-btn');
        scanBtn.classList.remove('hidden');
        
        document.getElementById('start-scan-btn').addEventListener('click', () => this.startScan());
        scanBtn.addEventListener('click', () => this.startScan());
    }

    async startScan() {
        try {
            console.log('🔍 Starting music library scan...');
            this.showScanProgress(true);
            
            const response = await fetch('http://localhost:5000/api/music/scan', {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Scan complete:', data.stats);
                this.showScanProgress(false, data.stats);
                
                await this.loadLibraryContent();
                this.renderCurrentView();
                
                document.getElementById('scan-library-btn').classList.add('hidden');
                
            } else {
                throw new Error(data.message);
            }
            
        } catch (error) {
            console.error('❌ Scan failed:', error);
            this.showScanProgress(false, null, error.message);
        }
    }

    showScanProgress(isScanning, stats = null, error = null) {
        const existingModal = document.getElementById('scan-modal');
        if (existingModal) {
            existingModal.remove();
        }

        if (isScanning) {
            const modal = document.createElement('div');
            modal.id = 'scan-modal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-chakra-darker p-6 rounded-lg max-w-md w-full mx-4 glass">
                    <div class="text-center">
                        <i class="fas fa-sync-alt fa-spin text-3xl text-chakra-primary mb-4"></i>
                        <h3 class="text-lg font-semibold text-white mb-2">Scanning Music Library</h3>
                        <p class="text-gray-400">Reading your music files from D:\\Music...</p>
                        <p class="text-gray-500 text-sm mt-2">This may take a few minutes for large libraries</p>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else if (stats) {
            const modal = document.createElement('div');
            modal.id = 'scan-modal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-chakra-darker p-6 rounded-lg max-w-md w-full mx-4 glass">
                    <div class="text-center">
                        <i class="fas fa-check-circle text-3xl text-green-500 mb-4"></i>
                        <h3 class="text-lg font-semibold text-white mb-2">Scan Complete!</h3>
                        <div class="text-gray-300 space-y-1">
                            <p>🎵 Songs: ${stats.totalSongs}</p>
                            <p>👤 Artists: ${stats.totalArtists}</p>
                            <p>💿 Albums: ${stats.totalAlbums}</p>
                        </div>
                        <button onclick="document.getElementById('scan-modal').remove()" class="mt-4 btn-chakra px-4 py-2 rounded-lg text-white">
                            Continue
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else if (error) {
            const modal = document.createElement('div');
            modal.id = 'scan-modal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-chakra-darker p-6 rounded-lg max-w-md w-full mx-4 glass">
                    <div class="text-center">
                        <i class="fas fa-times-circle text-3xl text-red-500 mb-4"></i>
                        <h3 class="text-lg font-semibold text-white mb-2">Scan Failed</h3>
                        <p class="text-gray-400 text-sm">${error}</p>
                        <button onclick="document.getElementById('scan-modal').remove()" class="mt-4 bg-red-500 px-4 py-2 rounded-lg text-white">
                            Close
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }    renderCurrentView() {
        if (!this.library) return;

        switch (this.currentView) {
            case 'albums':
                this.renderAlbums();
                break;
            case 'artists':
                this.renderArtists();
                break;
            case 'songs':
                this.renderSongs();
                break;
            case 'genres':
                this.renderGenres();
                break;
            case 'playlist':
                this.renderPlaylist(this.currentPlaylistId);
                break;
            default:
                this.renderAlbums();
        }
        
        this.updatePageStats();
    }

    renderAlbums() {
        const albumsGrid = document.getElementById('albums-grid');
        const artistsGrid = document.getElementById('artists-grid');
        const songsList = document.getElementById('songs-list');
        const genresGrid = document.getElementById('genres-grid');
        
        albumsGrid.classList.remove('hidden');
        artistsGrid.classList.add('hidden');
        songsList.classList.add('hidden');
        genresGrid.classList.add('hidden');
        
        document.getElementById('page-title').textContent = 'Albums';
        
        if (!this.library || !this.library.albums) {
            albumsGrid.innerHTML = '<p class="text-gray-400 col-span-full text-center">No albums found</p>';
            return;
        }

        albumsGrid.innerHTML = '';

        this.library.albums.forEach(album => {
            const albumCard = this.createAlbumCard(album);
            albumsGrid.appendChild(albumCard);
        });
    }

    renderArtists() {
        const albumsGrid = document.getElementById('albums-grid');
        const artistsGrid = document.getElementById('artists-grid');
        const songsList = document.getElementById('songs-list');
        const genresGrid = document.getElementById('genres-grid');
        
        albumsGrid.classList.add('hidden');
        artistsGrid.classList.remove('hidden');
        songsList.classList.add('hidden');
        genresGrid.classList.add('hidden');
        
        document.getElementById('page-title').textContent = 'Artists';
        
        if (!this.library || !this.library.artists) {
            artistsGrid.innerHTML = '<p class="text-gray-400 col-span-full text-center">No artists found</p>';
            return;
        }

        artistsGrid.innerHTML = '';

        this.library.artists.forEach(artist => {
            const artistCard = this.createArtistCard(artist);
            artistsGrid.appendChild(artistCard);
        });
    }

    renderSongs() {
        const albumsGrid = document.getElementById('albums-grid');
        const artistsGrid = document.getElementById('artists-grid');
        const songsList = document.getElementById('songs-list');
        const genresGrid = document.getElementById('genres-grid');
        
        albumsGrid.classList.add('hidden');
        artistsGrid.classList.add('hidden');
        songsList.classList.remove('hidden');
        genresGrid.classList.add('hidden');
        
        document.getElementById('page-title').textContent = 'All Songs';
        
        if (!this.library || !this.library.songs) {
            songsList.innerHTML = '<p class="text-gray-400 text-center">No songs found</p>';
            return;
        }

        let songsHTML = `
            <div class="space-y-1">
                <div class="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700/50 bg-gray-800/30 rounded-lg mb-4">
                    <div class="col-span-1 flex items-center">
                        <button id="play-all-btn" class="w-8 h-8 btn-chakra rounded-full flex items-center justify-center hover:scale-105 transition-all mr-3">
                            <i class="fas fa-play text-sm text-white"></i>
                        </button>
                        #
                    </div>
                    <div class="col-span-5">Title</div>
                    <div class="col-span-2">Artist</div>
                    <div class="col-span-2">Album</div>
                    <div class="col-span-1">Genre</div>
                    <div class="col-span-1 text-right">Duration</div>
                </div>
        `;

        this.library.songs.forEach((song, index) => {
            const coverImage = song.coverImage ? 
                `http://localhost:5000${song.coverImage}` : null;

            songsHTML += `
                <div class="song-row grid grid-cols-12 gap-4 px-6 py-3 hover:bg-gray-800/50 rounded-lg cursor-pointer transition-all group" data-song-id="${song.id}">
                    <div class="col-span-1 flex items-center">
                        <div class="relative">
                            <span class="song-number text-gray-400 group-hover:hidden">${index + 1}</span>
                            <button class="song-play-icon hidden group-hover:block w-6 h-6 text-white hover:text-chakra-primary transition-colors">
                                <i class="fas fa-play text-sm"></i>
                            </button>
                        </div>
                    </div>
                    <div class="col-span-5">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                ${coverImage ? 
                                    `<img src="${coverImage}" alt="${song.title}" class="w-full h-full object-cover">` :
                                    `<div class="w-full h-full bg-gray-700 flex items-center justify-center">
                                        <i class="fas fa-music text-lg text-gray-400"></i>
                                    </div>`
                                }
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-white font-medium truncate group-hover:text-chakra-primary transition-colors">${song.title}</p>
                                <p class="text-xs text-gray-400 truncate">${song.fileName}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-2 flex items-center">
                        <span class="text-gray-300 truncate hover:text-white transition-colors cursor-pointer">${song.artist}</span>
                    </div>
                    <div class="col-span-2 flex items-center">
                        <span class="text-gray-400 truncate hover:text-gray-300 transition-colors cursor-pointer">${song.album}</span>
                    </div>
                    <div class="col-span-1 flex items-center">
                        <span class="text-gray-500 text-sm truncate">${song.genre}</span>
                    </div>
                    <div class="col-span-1 flex items-center justify-end">
                        <div class="flex items-center space-x-2">
                            <button class="like-song-btn w-5 h-5 text-gray-400 hover:text-chakra-primary transition-colors opacity-0 group-hover:opacity-100" data-song-id="${song.id}">
                                <i class="fas fa-heart text-sm"></i>
                            </button>
                            <span class="text-gray-400 text-sm">${this.formatDuration(song.duration)}</span>
                            <button class="more-options-btn w-5 h-5 text-gray-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100" data-song-id="${song.id}">
                                <i class="fas fa-ellipsis-h text-sm"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        songsHTML += '</div>';
        songsList.innerHTML = songsHTML;

        this.setupSongListeners();
        
        const playAllBtn = document.getElementById('play-all-btn');
        if (playAllBtn) {
            playAllBtn.addEventListener('click', () => {
                if (this.audioPlayer && this.library.songs.length > 0) {
                    this.audioPlayer.playPlaylist(this.library.songs, 0);
                }
            });
        }
    }    setupSongListeners() {
        // Only add listeners to regular song rows, not playlist song rows
        document.querySelectorAll('.song-row:not(.playlist-song-row)').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                
                const songId = row.dataset.songId;
                const song = this.library.songs.find(s => s.id === songId);
                if (song && this.audioPlayer) {
                    this.audioPlayer.loadSong(song);
                    this.audioPlayer.play();
                }
            });
        });

        document.querySelectorAll('.song-play-icon:not(.playlist-song-row .song-play-icon)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = btn.closest('.song-row');
                const songId = row.dataset.songId;
                const song = this.library.songs.find(s => s.id === songId);
                if (song && this.audioPlayer) {
                    this.audioPlayer.loadSong(song);
                    this.audioPlayer.play();
                }
            });
        });

        document.querySelectorAll('.like-song-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songId = btn.dataset.songId;
                const isLiked = btn.classList.contains('control-active');
                
                if (isLiked) {
                    btn.classList.remove('control-active');
                    console.log('💔 Unliked song:', songId);
                } else {
                    btn.classList.add('control-active');
                    console.log('❤️ Liked song:', songId);
                }
            });
        });        document.querySelectorAll('.more-options-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songId = btn.dataset.songId;
                const song = this.library.songs.find(s => s.id === songId);
                if (song) {
                    this.showSongContextMenu(e, song);
                }
            });
        });
    }    renderGenres() {
        console.log('🎭 Genres view not yet implemented');
    }

    async renderPlaylist(playlistId) {
        if (!playlistId) return;
        
        const albumsGrid = document.getElementById('albums-grid');
        const artistsGrid = document.getElementById('artists-grid');
        const songsList = document.getElementById('songs-list');
        const genresGrid = document.getElementById('genres-grid');
        
        albumsGrid.classList.add('hidden');
        artistsGrid.classList.add('hidden');
        songsList.classList.remove('hidden');
        genresGrid.classList.add('hidden');
        
        try {
            // Fetch playlist data
            const response = await playlistService.getPlaylist(playlistId);
            if (!response.success) {
                songsList.innerHTML = '<p class="text-red-400 text-center">Error loading playlist</p>';
                return;
            }
            
            const playlist = response.data.playlist;
            document.getElementById('page-title').textContent = playlist.name;
            
            if (!playlist.songs || playlist.songs.length === 0) {
                songsList.innerHTML = `
                    <div class="text-center py-12">
                        <i class="fas fa-music text-6xl text-gray-600 mb-4"></i>
                        <h3 class="text-xl font-semibold text-gray-400 mb-2">No songs in this playlist</h3>
                        <p class="text-gray-500 mb-6">Start adding songs to enjoy your music</p>
                        <button id="add-songs-to-playlist-btn" class="btn-chakra px-6 py-2 rounded-lg text-white hover:scale-105 transition-transform">
                            <i class="fas fa-plus mr-2"></i>
                            Add Songs
                        </button>
                    </div>
                `;
                
                // Add event listener for add songs button
                document.getElementById('add-songs-to-playlist-btn').addEventListener('click', () => {
                    this.switchView('songs'); // Switch to songs view to add songs
                });
                
                return;
            }

            // Render enhanced playlist header with add songs button
            let playlistHTML = `
                <div class="flex items-start space-x-6 mb-8 p-6 bg-gradient-to-r from-chakra-primary/20 to-transparent rounded-lg">
                    <div class="w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
                        ${playlist.coverImage ? 
                            `<img src="http://localhost:5000${playlist.coverImage}" alt="${playlist.name}" class="w-full h-full object-cover">` :
                            `<div class="w-full h-full bg-gray-700 flex items-center justify-center">
                                <i class="fas fa-music text-6xl text-gray-500"></i>
                            </div>`
                        }
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-gray-400 uppercase tracking-wider">Playlist</p>
                        <h1 class="text-4xl font-bold text-white mb-2">${playlist.name}</h1>
                        ${playlist.description ? `<p class="text-gray-300 mb-4">${playlist.description}</p>` : ''}
                        <div class="flex items-center space-x-4 text-sm text-gray-400">
                            <span>By ${playlist.owner.fullName || playlist.owner.username}</span>
                            <span>•</span>
                            <span>${playlist.songs.length} songs</span>
                            <span>•</span>
                            <span>${this.formatDuration(playlist.totalDuration)}</span>
                            ${playlist.playCount > 0 ? `<span>• ${playlist.playCount} plays</span>` : ''}
                        </div>
                        ${playlist.tags && playlist.tags.length > 0 ? `
                            <div class="flex flex-wrap gap-2 mt-3">
                                ${playlist.tags.map(tag => `
                                    <span class="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-300">${tag}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                        <div class="flex items-center space-x-4 mt-6">
                            <button id="play-playlist-btn" class="w-14 h-14 btn-chakra rounded-full flex items-center justify-center hover:scale-105 transition-all">
                                <i class="fas fa-play text-xl text-white ml-1"></i>
                            </button>
                            <button id="shuffle-playlist-btn" class="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors">
                                <i class="fas fa-random text-white"></i>
                            </button>
                            <button id="add-songs-to-playlist-btn" class="px-4 py-2 bg-chakra-primary hover:bg-chakra-secondary rounded-lg text-white transition-colors flex items-center">
                                <i class="fas fa-plus mr-2"></i>
                                Add Songs
                            </button>
                            <button id="like-playlist-btn" class="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors">
                                <i class="fas fa-heart text-white"></i>
                            </button>
                            <button id="playlist-options-btn" class="w-12 h-12 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors">
                                <i class="fas fa-ellipsis-h text-white"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-1">
                    <div class="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700/50 bg-gray-800/30 rounded-lg mb-4">
                        <div class="col-span-1">#</div>
                        <div class="col-span-5">Title</div>
                        <div class="col-span-2">Artist</div>
                        <div class="col-span-2">Album</div>
                        <div class="col-span-1">Added</div>
                        <div class="col-span-1 text-right">Actions</div>
                    </div>
            `;

            // Render playlist songs with enhanced remove buttons
            playlist.songs.forEach((song, index) => {
                const addedDate = new Date(song.addedAt).toLocaleDateString();
                const coverImage = song.coverImage ? `http://localhost:5000${song.coverImage}` : null;

                playlistHTML += `
                    <div class="playlist-song-row grid grid-cols-12 gap-4 px-6 py-3 hover:bg-gray-800/50 rounded-lg cursor-pointer transition-all group" data-song-id="${song.songId}" data-playlist-song-index="${index}">
                        <div class="col-span-1 flex items-center">
                            <div class="relative">
                                <span class="song-number text-gray-400 group-hover:hidden">${index + 1}</span>
                                <button class="song-play-icon hidden group-hover:block w-6 h-6 text-white hover:text-chakra-primary transition-colors">
                                    <i class="fas fa-play text-sm"></i>
                                </button>
                            </div>
                        </div>
                        <div class="col-span-5">
                            <div class="flex items-center space-x-3">
                                <div class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                    ${coverImage ? 
                                        `<img src="${coverImage}" alt="${song.title}" class="w-full h-full object-cover">` :
                                        `<div class="w-full h-full bg-gray-700 flex items-center justify-center">
                                            <i class="fas fa-music text-lg text-gray-400"></i>
                                        </div>`
                                    }
                                </div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-white font-medium truncate group-hover:text-chakra-primary transition-colors">${song.title}</p>
                                    <p class="text-xs text-gray-400 truncate">${song.artist}</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-2 flex items-center">
                            <span class="text-gray-300 truncate hover:text-white transition-colors cursor-pointer">${song.artist}</span>
                        </div>
                        <div class="col-span-2 flex items-center">
                            <span class="text-gray-400 truncate hover:text-gray-300 transition-colors cursor-pointer">${song.album || 'Unknown'}</span>
                        </div>
                        <div class="col-span-1 flex items-center">
                            <span class="text-gray-500 text-sm">${addedDate}</span>
                        </div>
                        <div class="col-span-1 flex items-center justify-end">
                            <div class="flex items-center space-x-2">
                                <span class="text-gray-400 text-sm mr-2">${this.formatDuration(song.duration)}</span>
                                <button class="like-song-btn w-8 h-8 text-gray-400 hover:text-chakra-primary transition-colors opacity-0 group-hover:opacity-100 rounded-full hover:bg-gray-700" data-song-id="${song.songId}">
                                    <i class="fas fa-heart text-sm"></i>
                                </button>
                                <button class="remove-from-playlist-btn w-8 h-8 text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 rounded-full hover:bg-gray-700 flex items-center justify-center" data-song-id="${song.songId}" data-playlist-id="${playlist._id}" title="Remove from playlist">
                                    <i class="fas fa-minus text-sm"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });

            playlistHTML += '</div>';
            songsList.innerHTML = playlistHTML;

            // Setup playlist-specific event listeners
            this.setupPlaylistListeners(playlist);

        } catch (error) {
            console.error('Error rendering playlist:', error);
            songsList.innerHTML = '<p class="text-red-400 text-center">Error loading playlist</p>';
        }
    }

    setupPlaylistListeners(playlist) {
        // Play playlist button
        const playPlaylistBtn = document.getElementById('play-playlist-btn');
        if (playPlaylistBtn) {
            playPlaylistBtn.addEventListener('click', () => {
                if (this.audioPlayer && playlist.songs.length > 0) {
                    // Convert playlist songs to the format expected by the audio player
                    const songs = playlist.songs.map(song => ({
                        id: song.songId,
                        title: song.title,
                        artist: song.artist,
                        album: song.album,
                        duration: song.duration,
                        coverImage: song.coverImage
                    }));
                    this.audioPlayer.playPlaylist(songs, 0);
                    
                    // Update play count
                    playlistService.playPlaylist(playlist._id);
                }
            });
        }

        // Shuffle playlist button
        const shufflePlaylistBtn = document.getElementById('shuffle-playlist-btn');
        if (shufflePlaylistBtn) {
            shufflePlaylistBtn.addEventListener('click', () => {
                if (this.audioPlayer && playlist.songs.length > 0) {
                    const songs = playlist.songs.map(song => ({
                        id: song.songId,
                        title: song.title,
                        artist: song.artist,
                        album: song.album,
                        duration: song.duration,
                        coverImage: song.coverImage
                    }));
                    const randomIndex = Math.floor(Math.random() * songs.length);
                    this.audioPlayer.playPlaylist(songs, randomIndex);
                    this.audioPlayer.toggleShuffle();
                    
                    playlistService.playPlaylist(playlist._id);
                }
            });
        }

        // Add songs to playlist button
        const addSongsBtn = document.getElementById('add-songs-to-playlist-btn');
        if (addSongsBtn) {
            addSongsBtn.addEventListener('click', () => {
                // Store current playlist for adding songs
                window.currentAddToPlaylistId = playlist._id;
                this.switchView('songs'); // Switch to songs view to select songs
                this.showNotification('Select songs to add to your playlist', 'info');
            });
        }        // Individual song play buttons
        document.querySelectorAll('.playlist-song-row .song-play-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = btn.closest('.playlist-song-row');
                const songIndex = parseInt(row.dataset.playlistSongIndex);
                
                if (this.audioPlayer && playlist.songs.length > 0) {
                    const songs = playlist.songs.map(song => ({
                        id: song.songId,
                        title: song.title,
                        artist: song.artist,
                        album: song.album,
                        duration: song.duration,
                        coverImage: song.coverImage
                    }));
                    this.audioPlayer.playPlaylist(songs, songIndex);
                    
                    playlistService.playPlaylist(playlist._id);
                }
            });
        });

        // Playlist song row clicks (for entire row)
        document.querySelectorAll('.playlist-song-row').forEach(row => {
            row.addEventListener('click', (e) => {
                // Don't trigger if clicking on a button
                if (e.target.closest('button')) return;
                
                const songIndex = parseInt(row.dataset.playlistSongIndex);
                
                if (this.audioPlayer && playlist.songs.length > 0) {
                    const songs = playlist.songs.map(song => ({
                        id: song.songId,
                        title: song.title,
                        artist: song.artist,
                        album: song.album,
                        duration: song.duration,
                        coverImage: song.coverImage
                    }));
                    this.audioPlayer.playPlaylist(songs, songIndex);
                    
                    playlistService.playPlaylist(playlist._id);
                }
            });
        });

        // Remove from playlist buttons
        document.querySelectorAll('.remove-from-playlist-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const songId = btn.dataset.songId;
                const playlistId = btn.dataset.playlistId;
                
                if (confirm('Remove this song from the playlist?')) {
                    try {
                        const response = await playlistService.removeSongFromPlaylist(playlistId, songId);
                        if (response.success) {
                            // Refresh the playlist view
                            this.renderPlaylist(playlistId);
                            this.showNotification('Song removed from playlist', 'success');
                            
                            // Refresh sidebar playlist count
                            if (window.playlistUI) {
                                window.playlistUI.loadUserPlaylists();
                            }
                        }
                    } catch (error) {
                        console.error('Error removing song from playlist:', error);
                        this.showNotification('Error removing song from playlist', 'error');
                    }
                }
            });
        });

        // Like song buttons (reuse existing functionality)
        document.querySelectorAll('.like-song-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songId = btn.dataset.songId;
                const isLiked = btn.classList.contains('control-active');
                
                if (isLiked) {
                    btn.classList.remove('control-active');
                    console.log('💔 Unliked song:', songId);
                } else {
                    btn.classList.add('control-active');
                    console.log('❤️ Liked song:', songId);
                }
            });
        });
    }

    createAlbumCard(album) {
        const card = document.createElement('div');
        card.className = 'group cursor-pointer';
        
        const coverImage = album.coverImage ? 
            `http://localhost:5000${album.coverImage}` : null;
        
        card.innerHTML = `
            <div class="relative overflow-hidden rounded-lg hover-scale">
                ${coverImage ? 
                    `<img src="${coverImage}" alt="${album.title}" class="w-full h-48 object-cover rounded-lg">` :
                    `<div class="w-full h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                        <i class="fas fa-compact-disc text-6xl text-gray-500"></i>
                    </div>`
                }
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <button class="w-12 h-12 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300 hover:scale-105">
                        <i class="fas fa-play text-lg text-black ml-1"></i>
                    </button>
                </div>
            </div>
            <div class="mt-3">
                <h3 class="font-medium text-white truncate">${album.title}</h3>
                <p class="text-sm text-gray-400 truncate">${album.artist}</p>
                <p class="text-xs text-gray-500">${album.year || 'Unknown'} • ${album.songCount} songs</p>
            </div>
        `;

        card.addEventListener('click', () => {
            console.log(`Playing album: ${album.title}`);
            if (this.audioPlayer && album.songs && album.songs.length > 0) {
                this.audioPlayer.playPlaylist(album.songs, 0);
            }
        });

        return card;
    }

    createArtistCard(artist) {
        const card = document.createElement('div');
        card.className = 'group cursor-pointer';
        
        const coverImage = artist.coverImage ? 
            `http://localhost:5000${artist.coverImage}` : null;
        
        card.innerHTML = `
            <div class="relative overflow-hidden rounded-full hover-scale">
                ${coverImage ? 
                    `<img src="${coverImage}" alt="${artist.name}" class="w-32 h-32 object-cover rounded-full mx-auto">` :
                    `<div class="w-32 h-32 bg-gray-700 rounded-full mx-auto flex items-center justify-center">
                        <i class="fas fa-user text-4xl text-gray-500"></i>
                    </div>`
                }
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center rounded-full">
                    <button class="w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all duration-300">
                        <i class="fas fa-play text-sm text-black ml-0.5"></i>
                    </button>
                </div>
            </div>
            <div class="mt-3 text-center">
                <h3 class="font-medium text-white truncate">${artist.name}</h3>
                <p class="text-xs text-gray-500">${artist.songCount} songs • ${artist.albumCount} albums</p>
            </div>
        `;

        card.addEventListener('click', () => {
            console.log(`Playing artist: ${artist.name}`);
            if (this.audioPlayer && artist.songs && artist.songs.length > 0) {
                this.audioPlayer.playPlaylist(artist.songs, 0);
            }
        });

        return card;
    }

    setupEventListeners() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                if (view) {
                    this.switchView(view);
                }
            });
        });

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value;
                if (query.length > 2) {
                    this.searchMusic(query);
                } else if (query.length === 0) {
                    this.renderCurrentView();
                }
            });
        }

        const shuffleAllBtn = document.getElementById('shuffle-all-btn');
        if (shuffleAllBtn) {
            shuffleAllBtn.addEventListener('click', () => {
                if (this.audioPlayer && this.library && this.library.songs.length > 0) {
                    const randomIndex = Math.floor(Math.random() * this.library.songs.length);
                    this.audioPlayer.playPlaylist(this.library.songs, randomIndex);
                    this.audioPlayer.toggleShuffle();
                }
            });
        }
    }    switchView(view, playlistId = null) {
        this.currentView = view;
        this.currentPlaylistId = playlistId;
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('nav-active');
            link.querySelector('i').classList.remove('text-chakra-primary');
            link.querySelector('span').classList.remove('text-chakra-primary');
            link.querySelector('i').classList.add('text-gray-400');
            link.querySelector('span').classList.add('text-gray-300');
        });
        
        // Clear playlist active states
        document.querySelectorAll('.playlist-item').forEach(item => {
            item.classList.remove('bg-gray-800');
        });
        
        if (view === 'playlist' && playlistId) {
            // Highlight selected playlist
            const playlistItem = document.querySelector(`[data-playlist-id="${playlistId}"]`);
            if (playlistItem) {
                playlistItem.classList.add('bg-gray-800');
            }
        } else {
            // Handle regular navigation
            const activeLink = document.querySelector(`[data-view="${view}"]`);
            if (activeLink) {
                activeLink.classList.add('nav-active');
                activeLink.querySelector('i').classList.add('text-chakra-primary');
                activeLink.querySelector('span').classList.add('text-chakra-primary');
                activeLink.querySelector('i').classList.remove('text-gray-400');
                activeLink.querySelector('span').classList.remove('text-gray-300');
            }
        }
        
        this.renderCurrentView();
    }

    async searchMusic(query) {
        try {
            console.log(`🔍 Searching for: ${query}`);
            const response = await fetch(`http://localhost:5000/api/music/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.results) {
                this.displaySearchResults(data.results, query);
            }
        } catch (error) {
            console.error('❌ Search failed:', error);
        }
    }

    displaySearchResults(results, query) {
        const albumsGrid = document.getElementById('albums-grid');
        const artistsGrid = document.getElementById('artists-grid');
        const songsList = document.getElementById('songs-list');
        const genresGrid = document.getElementById('genres-grid');
        
        albumsGrid.classList.add('hidden');
        artistsGrid.classList.add('hidden');
        songsList.classList.remove('hidden');
        genresGrid.classList.add('hidden');
        
        document.getElementById('page-title').textContent = `Search Results for "${query}"`;
        
        const originalSongs = this.library.songs;
        this.library.songs = results;
        
        this.renderSongs();
        
        this.library.songs = originalSongs;
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }    // Show context menu for song operations
    async showSongContextMenu(event, song) {
        // Remove any existing context menu
        const existingMenu = document.getElementById('song-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Create context menu
        const contextMenu = document.createElement('div');
        contextMenu.id = 'song-context-menu';
        contextMenu.className = 'fixed bg-chakra-darker border border-gray-700 rounded-lg shadow-lg z-50 py-2 min-w-48';
        
        // Position the menu
        const rect = event.target.getBoundingClientRect();
        contextMenu.style.left = `${rect.left - 180}px`; // Offset to the left
        contextMenu.style.top = `${rect.top}px`;

        const menuItems = [
            {
                icon: 'fas fa-play',
                text: 'Play Now',
                action: () => {
                    if (this.audioPlayer) {
                        this.audioPlayer.loadSong(song);
                        this.audioPlayer.play();
                    }
                }
            },
            {
                icon: 'fas fa-plus',
                text: 'Add to Queue',
                action: () => {
                    if (this.audioPlayer) {
                        this.audioPlayer.addToQueue(song);
                        this.showNotification('Added to queue', 'success');
                    }
                }
            }
        ];

        // Add playlist option only if user is authenticated
        if (window.authService && window.authService.isAuthenticated()) {
            menuItems.push({
                icon: 'fas fa-list',
                text: 'Add to Playlist',
                action: async () => {
                    if (window.playlistUI) {
                        const songData = {
                            songId: song.id,
                            title: song.title,
                            artist: song.artist,
                            album: song.album,
                            duration: song.duration,
                            coverImage: song.coverImage
                        };
                        
                        // Check which playlists already contain this song
                        await this.showEnhancedAddToPlaylistModal(songData);
                    }
                }
            });
        }

        menuItems.push(
            {
                icon: 'fas fa-heart',
                text: 'Like Song',
                action: () => {
                    console.log('❤️ Liked song:', song.title);
                    this.showNotification('Added to Liked Songs', 'success');
                }
            },
            {
                icon: 'fas fa-share',
                text: 'Share',
                action: () => {
                    navigator.clipboard.writeText(`${song.artist} - ${song.title}`);
                    this.showNotification('Song info copied to clipboard', 'success');
                }
            }
        );

        contextMenu.innerHTML = menuItems.map(item => `
            <button class="w-full px-4 py-2 text-left hover:bg-gray-800 transition-colors flex items-center space-x-3 text-gray-300 hover:text-white">
                <i class="${item.icon} w-4 h-4"></i>
                <span>${item.text}</span>
            </button>
        `).join('');

        // Add event listeners
        menuItems.forEach((item, index) => {
            const menuButton = contextMenu.children[index];
            menuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                item.action();
                contextMenu.remove();
            });
        });

        // Add menu to document
        document.body.appendChild(contextMenu);

        // Close menu when clicking outside
        const closeMenu = (e) => {
            if (!contextMenu.contains(e.target)) {
                contextMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    // Enhanced add to playlist modal with playlist status indicators
    async showEnhancedAddToPlaylistModal(songData) {
        // Remove any existing modal
        const existingModal = document.getElementById('enhanced-add-to-playlist-modal');
        if (existingModal) {
            existingModal.remove();
        }

        try {
            // Get user playlists and check which ones contain this song
            const response = await playlistService.getUserPlaylists();
            if (!response.success) {
                this.showNotification('Error loading playlists', 'error');
                return;
            }

            const userPlaylists = response.data.playlists;
            
            // Check which playlists contain this song
            const playlistsWithSong = userPlaylists.filter(playlist => 
                playlist.songs.some(song => song.songId === songData.songId)
            );

            // Create enhanced modal
            const modal = document.createElement('div');
            modal.id = 'enhanced-add-to-playlist-modal';
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
            
            modal.innerHTML = `
                <div class="bg-chakra-darker rounded-lg p-6 w-96 max-w-full mx-4">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-semibold text-white">Add to Playlist</h3>
                        <button id="close-enhanced-add-modal" class="text-gray-400 hover:text-white">
                            <i class="fas fa-times w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <div class="mb-4 p-3 bg-gray-800/50 rounded-lg">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                                ${songData.coverImage ? 
                                    `<img src="http://localhost:5000${songData.coverImage}" alt="${songData.title}" class="w-full h-full object-cover rounded">` :
                                    `<i class="fas fa-music text-gray-400"></i>`
                                }
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-white font-medium truncate">${songData.title}</p>
                                <p class="text-gray-400 text-sm truncate">${songData.artist}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-2 max-h-64 overflow-y-auto" id="enhanced-playlist-list">
                        ${userPlaylists.map(playlist => {
                            const isInPlaylist = playlistsWithSong.some(p => p._id === playlist._id);
                            return `
                                <div class="enhanced-playlist-item flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors ${isInPlaylist ? 'bg-green-800/30' : ''}" data-playlist-id="${playlist._id}" data-is-in-playlist="${isInPlaylist}">
                                    <div class="flex items-center space-x-3 flex-1">
                                        <div class="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                                            ${playlist.coverImage ? 
                                                `<img src="http://localhost:5000${playlist.coverImage}" alt="${playlist.name}" class="w-full h-full object-cover rounded">` :
                                                `<i class="fas fa-music text-gray-400"></i>`
                                            }
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="text-white font-medium truncate">${playlist.name}</div>
                                            <div class="text-gray-400 text-sm">${playlist.songs.length} songs</div>
                                        </div>
                                    </div>
                                    <div class="flex items-center">
                                        ${isInPlaylist ? 
                                            `<div class="flex items-center text-green-400">
                                                <i class="fas fa-check mr-2"></i>
                                                <span class="text-sm">Added</span>
                                            </div>` :
                                            `<button class="add-to-playlist-btn bg-chakra-primary hover:bg-chakra-secondary text-white px-3 py-1 rounded text-sm transition-colors">
                                                <i class="fas fa-plus mr-1"></i>
                                                Add
                                            </button>`
                                        }
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="pt-4 border-t border-gray-700 mt-4">
                        <button id="create-new-playlist-with-song" class="w-full bg-chakra-primary hover:bg-chakra-secondary text-white py-2 rounded-lg transition-colors flex items-center justify-center">
                            <i class="fas fa-plus mr-2"></i>
                            Create New Playlist
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add event listeners
            document.getElementById('close-enhanced-add-modal').addEventListener('click', () => {
                modal.remove();
            });

            document.getElementById('create-new-playlist-with-song').addEventListener('click', () => {
                modal.remove();
                // Store the song to add to new playlist
                window.pendingSongToAdd = songData;
                if (window.playlistUI) {
                    window.playlistUI.showCreateModal();
                }
            });

            // Handle playlist item clicks
            document.querySelectorAll('.enhanced-playlist-item').forEach(item => {
                const isInPlaylist = item.dataset.isInPlaylist === 'true';
                
                if (!isInPlaylist) {
                    const addBtn = item.querySelector('.add-to-playlist-btn');
                    if (addBtn) {
                        addBtn.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            const playlistId = item.dataset.playlistId;
                            
                            try {
                                const response = await playlistService.addSongToPlaylist(playlistId, songData);
                                if (response.success) {
                                    modal.remove();
                                    this.showNotification('Song added to playlist!', 'success');
                                    
                                    // Refresh sidebar if visible
                                    if (window.playlistUI) {
                                        window.playlistUI.loadUserPlaylists();
                                    }
                                } else {
                                    this.showNotification(response.message || 'Error adding song to playlist', 'error');
                                }
                            } catch (error) {
                                console.error('Error adding song to playlist:', error);
                                this.showNotification('Error adding song to playlist', 'error');
                            }
                        });
                    }
                }
            });

            // Close modal on outside click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                }
            });

        } catch (error) {
            console.error('Error loading playlists:', error);
            this.showNotification('Error loading playlists', 'error');
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white transition-all transform translate-x-full ${
            type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.remove('translate-x-full'), 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chakrasPlayer = new ChakrasPlayer();
});

// Debug functions for troubleshooting
window.debugChakras = {
    checkAuth() {
        const token = localStorage.getItem('chakras_token');
        console.log('🔐 Auth Token:', token ? `${token.substring(0, 20)}...` : 'None');
        
        if (window.authService) {
            console.log('👤 Current User:', window.authService.currentUser);
        } else {
            console.log('❌ AuthService not found');
        }
    },
    
    async testPlaylistAPI() {
        const token = localStorage.getItem('chakras_token');
        if (!token) {
            console.log('❌ No auth token found');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:5000/api/playlists', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            console.log('🎵 Playlists API Response:', data);
        } catch (error) {
            console.error('❌ API Error:', error);
        }
    },
    
    checkPlaylistUI() {
        if (window.playlistUI) {
            console.log('✅ PlaylistUI found');
            console.log('📋 Current playlists:', window.playlistUI.userPlaylists);
        } else {
            console.log('❌ PlaylistUI not found');
        }
    },
    
    async loginAsTestUser() {
        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    login: 'testuser123',
                    password: 'password123'
                })
            });
            
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('chakras_token', data.data.token);
                console.log('✅ Logged in as testuser123 - refresh page to see playlists');
                
                // Try to update current services
                if (window.authService) {
                    window.authService.token = data.data.token;
                    window.authService.currentUser = data.data.user;
                }
                
                if (window.playlistUI) {
                    await window.playlistUI.loadUserPlaylists();
                }
                
                return data.data;
            } else {
                console.error('❌ Login failed:', data.message);
            }
        } catch (error) {
            console.error('❌ Login error:', error);
        }
    }
};

console.log('🐛 Debug functions loaded. Use window.debugChakras.checkAuth(), .testPlaylistAPI(), .checkPlaylistUI(), or .loginAsTestUser()');

document.addEventListener('DOMContentLoaded', () => {
    window.chakrasPlayer = new ChakrasPlayer();
});