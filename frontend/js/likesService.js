// Chakras Music Player - Likes Service

class LikesService {
    constructor() {
        this.baseUrl = 'http://localhost:5000/api/likes';
    }    async toggleLike(songId) {
        try {
            console.log('🎵 Attempting to toggle like for song:', songId);
            
            const token = localStorage.getItem('chakras_token');
            if (!token) {
                console.error('❌ No authentication token found');
                throw new Error('Authentication required');
            }

            console.log('🔑 Using auth token:', token.substring(0, 20) + '...');

            const response = await fetch(`${this.baseUrl}/toggle/${songId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('📡 Backend response:', data);

            if (!response.ok) {
                console.error('❌ Backend error:', response.status, data.message);
                throw new Error(data.message || 'Failed to toggle like');
            }

            console.log('✅ Like toggled successfully:', data.data.isLiked);
            return data;

        } catch (error) {
            console.error('❌ Toggle like error:', error);
            throw error;
        }
    }

    async getLikeStatus(songId) {
        try {
            const token = localStorage.getItem('chakras_token');
            if (!token) {
                return { success: true, data: { isLiked: false, likedSongsCount: 0 } };
            }

            const response = await fetch(`${this.baseUrl}/status/${songId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get like status');
            }

            return data;

        } catch (error) {
            console.error('Get like status error:', error);
            return { success: true, data: { isLiked: false, likedSongsCount: 0 } };
        }
    }

    async getLikedSongs() {
        try {
            const token = localStorage.getItem('chakras_token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${this.baseUrl}/songs`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get liked songs');
            }

            return data;

        } catch (error) {
            console.error('Get liked songs error:', error);
            throw error;
        }
    }    async updateLikeStatusInUI(songId, isLiked) {
        // Update all like buttons for this song
        const songRows = document.querySelectorAll(`[data-song-id="${songId}"]`);
        songRows.forEach(row => {
            const likeBtn = row.querySelector('.like-song-btn, .like-btn, .song-like-btn');
            if (likeBtn) {
                const icon = likeBtn.querySelector('i');
                if (icon) {
                    if (isLiked) {
                        icon.className = 'fas fa-heart text-chakra-primary';
                        likeBtn.classList.add('liked');
                    } else {
                        icon.className = 'fas fa-heart text-gray-400 hover:text-chakra-primary';
                        likeBtn.classList.remove('liked');
                    }
                }
            }
        });        // Update player like button if this is the current song
        if (window.chakrasPlayer && window.chakrasPlayer.audioPlayer && 
            window.chakrasPlayer.audioPlayer.currentSong && 
            window.chakrasPlayer.audioPlayer.currentSong.id === songId) {
            const playerLikeBtn = document.getElementById('like-btn');
            if (playerLikeBtn) {
                const icon = playerLikeBtn.querySelector('i');
                if (icon) {
                    if (isLiked) {
                        icon.className = 'fas fa-heart text-red-500';
                        playerLikeBtn.classList.add('control-active');
                    } else {
                        icon.className = 'fas fa-heart text-gray-400 hover:text-chakra-primary';
                        playerLikeBtn.classList.remove('control-active');
                    }
                }
            }
        }
    }    async checkCurrentSongLikeStatus() {
        if (window.chakrasPlayer && window.chakrasPlayer.audioPlayer && window.chakrasPlayer.audioPlayer.currentSong) {
            try {
                const result = await this.getLikeStatus(window.chakrasPlayer.audioPlayer.currentSong.id);
                if (result.success) {
                    await this.updateLikeStatusInUI(window.chakrasPlayer.audioPlayer.currentSong.id, result.data.isLiked);
                }
            } catch (error) {
                console.error('Error checking current song like status:', error);
            }
        }
    }

    async loadLikeStatusForSongs(songIds) {
        if (!window.authService || !window.authService.isAuthenticated()) {
            return;
        }

        try {
            console.log('🔍 Loading like status for', songIds.length, 'songs');
            
            // Get like status for each song
            for (const songId of songIds) {
                try {
                    const result = await this.getLikeStatus(songId);
                    if (result.success) {
                        await this.updateLikeStatusInUI(songId, result.data.isLiked);
                    }
                } catch (error) {
                    console.error('Failed to get like status for song:', songId, error);
                }
            }
            
            console.log('✅ Like status loaded for all songs');
        } catch (error) {
            console.error('Error loading like status:', error);
        }
    }

    async refreshAllLikeStatus() {
        // Get all visible songs and refresh their like status
        const songElements = document.querySelectorAll('[data-song-id]');
        const songIds = Array.from(songElements).map(el => el.dataset.songId).filter(Boolean);
        
        if (songIds.length > 0) {
            await this.loadLikeStatusForSongs(songIds);
        }
    }
}

// Create global instance
window.likesService = new LikesService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LikesService;
}
