// Playlist Service - Frontend API wrapper for playlist operations
class PlaylistService {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
    }    // Get auth token from localStorage
    getAuthToken() {
        return localStorage.getItem('chakras_token');
    }

    // Get auth headers
    getAuthHeaders() {
        const token = this.getAuthToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }    // Get user's playlists
    async getUserPlaylists() {
        try {
            const response = await fetch(`${this.baseURL}/playlists`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching user playlists:', error);
            throw error;
        }
    }

    // Get public playlists
    async getPublicPlaylists(page = 1, limit = 20) {
        try {
            const response = await fetch(`${this.baseURL}/playlists/public?page=${page}&limit=${limit}`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching public playlists:', error);
            throw error;
        }
    }

    // Get playlist by ID
    async getPlaylist(id) {
        try {
            const response = await fetch(`${this.baseURL}/playlists/${id}`, {
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching playlist:', error);
            throw error;
        }
    }

    // Create new playlist
    async createPlaylist(playlistData) {
        try {
            const response = await fetch(`${this.baseURL}/playlists`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(playlistData)
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error creating playlist:', error);
            throw error;
        }
    }

    // Update playlist
    async updatePlaylist(id, updateData) {
        try {
            const response = await fetch(`${this.baseURL}/playlists/${id}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(updateData)
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating playlist:', error);
            throw error;
        }
    }

    // Delete playlist
    async deletePlaylist(id) {
        try {
            const response = await fetch(`${this.baseURL}/playlists/${id}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error deleting playlist:', error);
            throw error;
        }
    }

    // Add song to playlist
    async addSongToPlaylist(playlistId, songData) {
        try {
            const response = await fetch(`${this.baseURL}/playlists/${playlistId}/songs`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(songData)
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error adding song to playlist:', error);
            throw error;
        }
    }

    // Remove song from playlist
    async removeSongFromPlaylist(playlistId, songId) {
        try {
            const response = await fetch(`${this.baseURL}/playlists/${playlistId}/songs/${songId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error removing song from playlist:', error);
            throw error;
        }
    }

    // Increment play count
    async playPlaylist(id) {
        try {
            const response = await fetch(`${this.baseURL}/playlists/${id}/play`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating play count:', error);
            throw error;
        }
    }

    // Upload cover image
    async uploadCoverImage(file) {
        try {
            const formData = new FormData();
            formData.append('cover', file);

            const token = this.getAuthToken();
            const response = await fetch(`${this.baseURL}/upload/cover`, {
                method: 'POST',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: formData
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error uploading cover image:', error);
            throw error;
        }
    }
}

// Create global instance
window.playlistService = new PlaylistService();
