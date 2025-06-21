// Chakras Music Player - COMPLETE WITH FONT AWESOME ICONS

class ChakrasAudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentSong = null;
        this.isPlaying = false;
        this.volume = 0.75;
        this.currentTime = 0;
        this.duration = 0;
        this.isShuffled = false;
        this.isRepeated = false;
        this.playlist = [];
        this.currentIndex = 0;
        this.isMuted = false;
        this.previousVolume = 0.75;
        
        // Dragging states
        this.isDraggingProgress = false;
        this.isDraggingVolume = false;
        this.wasPlayingBeforeDrag = false;
        
        this.init();
    }

    init() {
        this.setupAudioEvents();
        this.setupPlayerControls();
        this.audio.volume = this.volume;
        this.updateVolumeDisplay();
        this.updateNowPlaying();
        this.updatePlayIcon();
        
        console.log('🎵 COMPLETE Audio Player with Font Awesome initialized!');
    }

    setupAudioEvents() {
        this.audio.addEventListener('timeupdate', () => {
            if (!this.isDraggingProgress) {
                this.currentTime = this.audio.currentTime;
                this.updateProgress();
                this.updateTimeDisplay();
            }
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration;
            this.updateDurationDisplay();
            console.log(`📊 Duration: ${this.formatTime(this.duration)}`);
        });

        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayIcon();
            this.startVisualization();
            console.log('▶️ PLAY EVENT - Font Awesome icon should be PAUSE');
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayIcon();
            this.stopVisualization();
            console.log('⏸️ PAUSE EVENT - Font Awesome icon should be PLAY');
        });

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updatePlayIcon();
            if (!this.isRepeated) {
                this.nextSong();
            }
        });
    }

    setupPlayerControls() {
        // Play button with Font Awesome
        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.togglePlayPause();
            });
        }

        const prevBtn = document.getElementById('prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousSong());
        }

        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSong());
        }

        const shuffleBtn = document.getElementById('shuffle-btn');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        }

        const repeatBtn = document.getElementById('repeat-btn');
        if (repeatBtn) {
            repeatBtn.addEventListener('click', () => this.toggleRepeat());
        }

        // SMOOTH draggable bars
        this.setupProgressBar();
        this.setupVolumeBar();

        const volumeIcon = document.getElementById('volume-icon');
        if (volumeIcon) {
            volumeIcon.addEventListener('click', () => this.toggleMute());
        }        const likeBtn = document.getElementById('like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.toggleLike());
        }

        // Add to playlist button
        const addToPlaylistBtn = document.getElementById('add-to-playlist-player-btn');
        if (addToPlaylistBtn) {
            addToPlaylistBtn.addEventListener('click', () => this.showAddCurrentSongToPlaylist());
        }
    }

    setupProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar) return;

        progressBar.addEventListener('mousedown', (e) => {
            console.log('🎯 Progress drag START');
            this.isDraggingProgress = true;
            this.wasPlayingBeforeDrag = this.isPlaying;
            
            // Pause during drag to prevent glitches
            if (this.isPlaying) {
                this.audio.pause();
            }
            
            this.handleProgressDrag(e);
            
            const handleMouseMove = (e) => {
                if (this.isDraggingProgress) {
                    this.handleProgressDrag(e);
                }
            };

            const handleMouseUp = () => {
                console.log('🎯 Progress drag END');
                
                // Set final audio position
                if (this.duration > 0) {
                    this.audio.currentTime = this.currentTime;
                }
                
                this.isDraggingProgress = false;
                
                // Resume if was playing
                if (this.wasPlayingBeforeDrag) {
                    setTimeout(() => {
                        this.audio.play();
                    }, 50);
                }
                
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            e.preventDefault();
        });

        progressBar.addEventListener('click', (e) => {
            if (!this.isDraggingProgress) {
                this.seekToPosition(e);
            }
        });
    }

    setupVolumeBar() {
        const volumeBar = document.getElementById('volume-bar');
        if (!volumeBar) return;

        volumeBar.addEventListener('mousedown', (e) => {
            this.isDraggingVolume = true;
            this.setVolumeFromPosition(e);

            const handleMouseMove = (e) => {
                if (this.isDraggingVolume) {
                    this.setVolumeFromPosition(e);
                }
            };

            const handleMouseUp = () => {
                this.isDraggingVolume = false;
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            e.preventDefault();
        });

        volumeBar.addEventListener('click', (e) => {
            if (!this.isDraggingVolume) {
                this.setVolumeFromPosition(e);
            }
        });
    }

    handleProgressDrag(e) {
        if (!this.duration) return;

        const progressBar = document.getElementById('progress-bar');
        const rect = progressBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const seekTime = percent * this.duration;

        // Update display immediately
        this.currentTime = seekTime;
        this.updateProgress();
        this.updateTimeDisplay();
    }

    seekToPosition(e) {
        if (!this.duration) return;

        const progressBar = document.getElementById('progress-bar');
        const rect = progressBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const seekTime = percent * this.duration;

        this.audio.currentTime = seekTime;
        this.currentTime = seekTime;
        this.updateProgress();
        this.updateTimeDisplay();
    }

    setVolumeFromPosition(e) {
        const volumeBar = document.getElementById('volume-bar');
        const rect = volumeBar.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

        this.volume = percent;
        this.audio.volume = this.volume;
        this.isMuted = this.volume === 0;

        this.updateVolumeDisplay();
        this.updateVolumeIcon();
    }

    setPlaylist(songs) {
        this.playlist = songs;
        console.log(`📋 Playlist set with ${songs.length} songs`);
    }    loadSong(song) {
        if (!song || !song.id) {
            console.log('❌ Cannot load invalid song:', song);
            return;
        }
        
        console.log('🎵 Loading:', `${song.title} by ${song.artist}`);
        
        this.currentSong = song;
        this.currentIndex = this.playlist.findIndex(s => s.id === song.id);
        
        const streamUrl = `http://localhost:5000/api/music/stream/${song.id}`;
        this.audio.src = streamUrl;
        this.audio.load();
        
        this.updateNowPlaying();
        this.updateCurrentSongHighlight();
        this.updateAddToPlaylistButton();
    }

    togglePlayPause() {
        if (!this.currentSong) {
            console.log('❌ No song loaded');
            return;
        }

        console.log(`🎮 Current state: ${this.isPlaying ? 'PLAYING' : 'PAUSED'}`);

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        if (!this.currentSong) return;

        this.audio.play().then(() => {
            console.log(`▶️ Playing: ${this.currentSong.title}`);
        }).catch(e => {
            console.error('❌ Play failed:', e);
        });
    }

    pause() {
        this.audio.pause();
        console.log('⏸️ Paused');
    }

    nextSong() {
        if (this.playlist.length === 0) return;
        
        let nextIndex;
        
        if (this.isShuffled) {
            nextIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            nextIndex = (this.currentIndex + 1) % this.playlist.length;
        }
        
        this.currentIndex = nextIndex;
        this.loadSong(this.playlist[nextIndex]);
        
        if (this.isPlaying) {
            setTimeout(() => this.play(), 100);
        }
    }

    previousSong() {
        if (this.playlist.length === 0) return;
        
        let prevIndex;
        
        if (this.isShuffled) {
            prevIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            prevIndex = this.currentIndex - 1;
            if (prevIndex < 0) prevIndex = this.playlist.length - 1;
        }
        
        this.currentIndex = prevIndex;
        this.loadSong(this.playlist[prevIndex]);
        
        if (this.isPlaying) {
            setTimeout(() => this.play(), 100);
        }
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        const shuffleBtn = document.getElementById('shuffle-btn');
        
        if (this.isShuffled) {
            shuffleBtn.classList.add('control-active');
        } else {
            shuffleBtn.classList.remove('control-active');
        }
    }

    toggleRepeat() {
        this.isRepeated = !this.isRepeated;
        const repeatBtn = document.getElementById('repeat-btn');
        
        if (this.isRepeated) {
            repeatBtn.classList.add('control-active');
            this.audio.loop = true;
        } else {
            repeatBtn.classList.remove('control-active');
            this.audio.loop = false;
        }
    }

    toggleMute() {
        if (this.isMuted) {
            this.audio.volume = this.previousVolume;
            this.volume = this.previousVolume;
            this.isMuted = false;
        } else {
            this.previousVolume = this.volume;
            this.audio.volume = 0;
            this.volume = 0;
            this.isMuted = true;
        }
        this.updateVolumeDisplay();
        this.updateVolumeIcon();
    }

    toggleLike() {
        if (!this.currentSong) return;
        
        const likeBtn = document.getElementById('like-btn');
        const isLiked = likeBtn.classList.contains('control-active');
        
        if (isLiked) {
            likeBtn.classList.remove('control-active');
        } else {
            likeBtn.classList.add('control-active');
        }
    }

    // FONT AWESOME icon updates
    updatePlayIcon() {
        const playIcon = document.querySelector('#play-btn i');
        
        if (playIcon) {
            // Remove all classes
            playIcon.className = '';
            
            if (this.isPlaying) {
                playIcon.className = 'fas fa-pause text-xl text-white';
                console.log('🔄 Font Awesome icon set to PAUSE');
            } else {
                playIcon.className = 'fas fa-play text-xl text-white';
                console.log('🔄 Font Awesome icon set to PLAY');
            }
        }
    }    updateNowPlaying() {
        const titleEl = document.querySelector('.now-playing-title');
        const artistEl = document.querySelector('.now-playing-artist');
        const coverContainer = document.querySelector('.now-playing-cover-container');
        const coverElement = document.querySelector('.now-playing-cover');

        if (this.currentSong) {
            if (titleEl) titleEl.textContent = this.currentSong.title;
            if (artistEl) artistEl.textContent = this.currentSong.artist;
            
            // Handle both possible cover container elements
            const coverEl = coverContainer || coverElement;
            if (coverEl) {
                if (this.currentSong.coverImage) {
                    const coverUrl = `http://localhost:5000${this.currentSong.coverImage}`;
                    coverEl.innerHTML = `<img src="${coverUrl}" alt="${this.currentSong.title}" class="w-full h-full object-cover rounded-lg">`;
                } else {
                    coverEl.innerHTML = '<i class="fas fa-music text-2xl text-gray-400"></i>';
                }
            }
            
            // Update browser title
            document.title = `${this.currentSong.title} - ${this.currentSong.artist} | Chakras`;
        } else {
            if (titleEl) titleEl.textContent = 'Select a song to play';
            if (artistEl) artistEl.textContent = 'No artist';
            const coverEl = coverContainer || coverElement;
            if (coverEl) {
                coverEl.innerHTML = '<i class="fas fa-music text-2xl text-gray-400"></i>';
            }
            document.title = 'Chakras Music Player';
        }
    }

    updateCurrentSongHighlight() {
        document.querySelectorAll('.song-row').forEach(row => {
            row.classList.remove('playing');
        });

        if (this.currentSong) {
            const currentRow = document.querySelector(`[data-song-id="${this.currentSong.id}"]`);
            if (currentRow) {
                currentRow.classList.add('playing');
            }
        }
    }

    updateProgress() {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill && this.duration > 0) {
            const percent = (this.currentTime / this.duration) * 100;
            progressFill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
        }
    }

    updateTimeDisplay() {
        const currentTimeEl = document.querySelector('.current-time');
        const durationEl = document.querySelector('.duration-time');

        if (currentTimeEl) {
            currentTimeEl.textContent = this.formatTime(this.currentTime);
        }
        if (durationEl) {
            durationEl.textContent = this.formatTime(this.duration);
        }
    }

    updateDurationDisplay() {
        const durationEl = document.querySelector('.duration-time');
        if (durationEl) {
            durationEl.textContent = this.formatTime(this.duration);
        }
    }

    updateVolumeDisplay() {
        const volumeFill = document.querySelector('.volume-fill');
        if (volumeFill) {
            volumeFill.style.width = `${this.volume * 100}%`;
        }
    }

    updateVolumeIcon() {
        const volumeIcon = document.querySelector('#volume-icon i');
        if (volumeIcon) {
            volumeIcon.className = '';
            
            if (this.isMuted || this.volume === 0) {
                volumeIcon.className = 'fas fa-volume-mute text-lg';
            } else if (this.volume < 0.5) {
                volumeIcon.className = 'fas fa-volume-down text-lg';
            } else {
                volumeIcon.className = 'fas fa-volume-up text-lg';
            }
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    startVisualization() {
        const visualizerBars = document.querySelectorAll('.audio-bar');
        visualizerBars.forEach(bar => {
            bar.classList.add('active');
        });
    }

    stopVisualization() {
        const visualizerBars = document.querySelectorAll('.audio-bar');
        visualizerBars.forEach(bar => {
            bar.classList.remove('active');
        });
    }    playPlaylist(playlist, startIndex = 0) {
        console.log('🎵 Playing playlist with', playlist.length, 'songs, starting at index', startIndex);
        
        if (!playlist || playlist.length === 0) {
            console.log('❌ Cannot play empty playlist');
            return;
        }
        
        if (startIndex >= playlist.length) {
            console.log('❌ Start index out of bounds, using 0');
            startIndex = 0;
        }
        
        this.playlist = playlist;
        this.currentIndex = startIndex;
        
        const songToPlay = playlist[startIndex];
        if (!songToPlay || !songToPlay.id) {
            console.log('❌ Invalid song at index', startIndex);
            return;
        }
        
        this.loadSong(songToPlay);
        setTimeout(() => this.play(), 200);
    }

    addToQueue(song) {
        this.playlist.push(song);
    }

    getCurrentSong() {
        return this.currentSong;
    }

    getPlaylist() {
        return this.playlist;
    }    isCurrentlyPlaying() {
        return this.isPlaying;
    }

    // Show add to playlist modal for currently playing song
    showAddCurrentSongToPlaylist() {
        if (!this.currentSong) {
            if (window.chakrasPlayer) {
                window.chakrasPlayer.showNotification('No song is currently playing', 'info');
            }
            return;
        }

        if (!window.authService || !window.authService.isAuthenticated()) {
            if (window.chakrasPlayer) {
                window.chakrasPlayer.showNotification('Please login to add songs to playlists', 'info');
            }
            return;
        }

        const songData = {
            songId: this.currentSong.id,
            title: this.currentSong.title,
            artist: this.currentSong.artist,
            album: this.currentSong.album,
            duration: this.currentSong.duration,
            coverImage: this.currentSong.coverImage
        };

        if (window.chakrasPlayer) {
            window.chakrasPlayer.showEnhancedAddToPlaylistModal(songData);
        }
    }    // Update add to playlist button visibility
    updateAddToPlaylistButton() {
        const addToPlaylistBtn = document.getElementById('add-to-playlist-player-btn');
        if (addToPlaylistBtn) {
            if (this.currentSong && window.authService && window.authService.isAuthenticated()) {
                addToPlaylistBtn.style.display = 'block';
            } else {
                addToPlaylistBtn.style.display = 'none';
            }
        }
    }
}

// Initialize the audio player
window.chakrasAudioPlayer = new ChakrasAudioPlayer();