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
    }

    renderCurrentView() {
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
    }

    setupSongListeners() {
        document.querySelectorAll('.song-row').forEach(row => {
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

        document.querySelectorAll('.song-play-icon').forEach(btn => {
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
        });

        document.querySelectorAll('.more-options-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const songId = btn.dataset.songId;
                console.log('⚙️ More options for song:', songId);
            });
        });
    }

    renderGenres() {
        console.log('🎭 Genres view not yet implemented');
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
    }

    switchView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('nav-active');
            link.querySelector('i').classList.remove('text-chakra-primary');
            link.querySelector('span').classList.remove('text-chakra-primary');
            link.querySelector('i').classList.add('text-gray-400');
            link.querySelector('span').classList.add('text-gray-300');
        });
        
        const activeLink = document.querySelector(`[data-view="${view}"]`);
        if (activeLink) {
            activeLink.classList.add('nav-active');
            activeLink.querySelector('i').classList.add('text-chakra-primary');
            activeLink.querySelector('span').classList.add('text-chakra-primary');
            activeLink.querySelector('i').classList.remove('text-gray-400');
            activeLink.querySelector('span').classList.remove('text-gray-300');
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
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chakrasPlayer = new ChakrasPlayer();
});