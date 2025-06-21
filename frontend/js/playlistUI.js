// Playlist UI Manager - Handles all playlist-related UI interactions
class PlaylistUI {
    constructor() {
        this.currentPlaylist = null;
        this.userPlaylists = [];
        this.init();
    }

    init() {
        this.createModals();
        this.bindEvents();
        this.loadUserPlaylists();
    }

    // Create modal HTML structures
    createModals() {
        // Create Playlist Modal
        const createPlaylistModal = `
            <div id="create-playlist-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
                <div class="bg-chakra-darker rounded-lg p-6 w-96 max-w-full mx-4">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-semibold text-white">Create New Playlist</h3>
                        <button id="close-create-modal" class="text-gray-400 hover:text-white">
                            <i class="fas fa-times w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <form id="create-playlist-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Playlist Name *</label>
                            <input 
                                type="text" 
                                id="playlist-name" 
                                required
                                maxlength="100"
                                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-chakra-primary"
                                placeholder="Enter playlist name..."
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
                            <textarea 
                                id="playlist-description" 
                                maxlength="500"
                                rows="3"
                                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-chakra-primary resize-none"
                                placeholder="Add a description..."
                            ></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Cover Image</label>
                            <div class="flex items-center space-x-3">
                                <div id="cover-preview" class="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-image text-gray-400"></i>
                                </div>
                                <div class="flex-1">
                                    <input 
                                        type="file" 
                                        id="cover-upload" 
                                        accept="image/*"
                                        class="hidden"
                                    >
                                    <button 
                                        type="button" 
                                        id="cover-upload-btn"
                                        class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Choose Image
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                            <input 
                                type="text" 
                                id="playlist-tags" 
                                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-chakra-primary"
                                placeholder="rock, chill, favorites (comma separated)"
                            >
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="playlist-public" 
                                    class="w-4 h-4 text-chakra-primary bg-gray-800 border-gray-600 rounded focus:ring-chakra-primary"
                                >
                                <label for="playlist-public" class="ml-2 text-sm text-gray-300">Make playlist public</label>
                            </div>
                        </div>
                        
                        <div class="flex space-x-3 pt-4">
                            <button 
                                type="button" 
                                id="cancel-create-playlist"
                                class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                class="flex-1 gradient-chakra text-white py-2 rounded-lg transition-colors"
                            >
                                Create Playlist
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Edit Playlist Modal
        const editPlaylistModal = `
            <div id="edit-playlist-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
                <div class="bg-chakra-darker rounded-lg p-6 w-96 max-w-full mx-4">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-semibold text-white">Edit Playlist</h3>
                        <button id="close-edit-modal" class="text-gray-400 hover:text-white">
                            <i class="fas fa-times w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <form id="edit-playlist-form" class="space-y-4">
                        <input type="hidden" id="edit-playlist-id">
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Playlist Name *</label>
                            <input 
                                type="text" 
                                id="edit-playlist-name" 
                                required
                                maxlength="100"
                                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-chakra-primary"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
                            <textarea 
                                id="edit-playlist-description" 
                                maxlength="500"
                                rows="3"
                                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-chakra-primary resize-none"
                            ></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Cover Image</label>
                            <div class="flex items-center space-x-3">
                                <div id="edit-cover-preview" class="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-image text-gray-400"></i>
                                </div>
                                <div class="flex-1">
                                    <input 
                                        type="file" 
                                        id="edit-cover-upload" 
                                        accept="image/*"
                                        class="hidden"
                                    >
                                    <button 
                                        type="button" 
                                        id="edit-cover-upload-btn"
                                        class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        Change Image
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                            <input 
                                type="text" 
                                id="edit-playlist-tags" 
                                class="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-chakra-primary"
                            >
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="edit-playlist-public" 
                                    class="w-4 h-4 text-chakra-primary bg-gray-800 border-gray-600 rounded focus:ring-chakra-primary"
                                >
                                <label for="edit-playlist-public" class="ml-2 text-sm text-gray-300">Make playlist public</label>
                            </div>
                        </div>
                        
                        <div class="flex space-x-3 pt-4">
                            <button 
                                type="button" 
                                id="cancel-edit-playlist"
                                class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                class="flex-1 gradient-chakra text-white py-2 rounded-lg transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add to playlist modal
        const addToPlaylistModal = `
            <div id="add-to-playlist-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
                <div class="bg-chakra-darker rounded-lg p-6 w-96 max-w-full mx-4">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-semibold text-white">Add to Playlist</h3>
                        <button id="close-add-to-playlist-modal" class="text-gray-400 hover:text-white">
                            <i class="fas fa-times w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-2 max-h-64 overflow-y-auto" id="playlist-selection-list">
                        <!-- Playlists will be loaded here -->
                    </div>
                    
                    <div class="pt-4 border-t border-gray-700 mt-4">
                        <button 
                            id="create-new-playlist-from-add"
                            class="w-full bg-chakra-primary hover:bg-chakra-secondary text-white py-2 rounded-lg transition-colors flex items-center justify-center"
                        >
                            <i class="fas fa-plus mr-2"></i>
                            Create New Playlist
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Append modals to body
        document.body.insertAdjacentHTML('beforeend', createPlaylistModal);
        document.body.insertAdjacentHTML('beforeend', editPlaylistModal);
        document.body.insertAdjacentHTML('beforeend', addToPlaylistModal);
    }

    // Bind all event listeners
    bindEvents() {
        // Create playlist events
        document.getElementById('create-playlist-btn').addEventListener('click', () => this.showCreateModal());
        document.getElementById('close-create-modal').addEventListener('click', () => this.hideCreateModal());
        document.getElementById('cancel-create-playlist').addEventListener('click', () => this.hideCreateModal());
        document.getElementById('create-playlist-form').addEventListener('submit', (e) => this.handleCreatePlaylist(e));
        
        // Edit playlist events
        document.getElementById('close-edit-modal').addEventListener('click', () => this.hideEditModal());
        document.getElementById('cancel-edit-playlist').addEventListener('click', () => this.hideEditModal());
        document.getElementById('edit-playlist-form').addEventListener('submit', (e) => this.handleEditPlaylist(e));
        
        // Add to playlist events
        document.getElementById('close-add-to-playlist-modal').addEventListener('click', () => this.hideAddToPlaylistModal());
        document.getElementById('create-new-playlist-from-add').addEventListener('click', () => {
            this.hideAddToPlaylistModal();
            this.showCreateModal();
        });
        
        // Cover upload events
        document.getElementById('cover-upload-btn').addEventListener('click', () => {
            document.getElementById('cover-upload').click();
        });
        document.getElementById('cover-upload').addEventListener('change', (e) => this.handleCoverUpload(e, 'cover-preview'));
        
        document.getElementById('edit-cover-upload-btn').addEventListener('click', () => {
            document.getElementById('edit-cover-upload').click();
        });
        document.getElementById('edit-cover-upload').addEventListener('change', (e) => this.handleCoverUpload(e, 'edit-cover-preview'));
        
        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
                this.hideAllModals();
            }
        });
    }    // Load user playlists and display in sidebar
    async loadUserPlaylists() {
        try {
            const response = await playlistService.getUserPlaylists();
            if (response.success) {
                this.userPlaylists = response.data.playlists;
                this.renderUserPlaylists();
            }
        } catch (error) {
            console.error('Error loading user playlists:', error);
        }
    }    // Render user playlists in sidebar
    renderUserPlaylists() {
        const container = document.getElementById('user-playlists');
        if (!container) return;
        
        container.innerHTML = this.userPlaylists.map(playlist => {
            const coverImageHTML = playlist.coverImage ? 
                `<img src="http://localhost:5000${playlist.coverImage}" alt="${playlist.name}" class="w-full h-full object-cover rounded">` :
                `<i class="fas fa-music text-gray-400 text-xs"></i>`;
            
            return `
            <div class="playlist-item flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors group" data-playlist-id="${playlist._id}">
                <a href="#" data-view="playlist" data-playlist-id="${playlist._id}" class="flex items-center space-x-3 flex-1 min-w-0 playlist-link">
                    <div class="w-8 h-8 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                        ${coverImageHTML}
                    </div>
                    <div class="min-w-0 flex-1">
                        <span class="text-gray-300 group-hover:text-white text-sm truncate block">${playlist.name}</span>
                        <span class="text-xs text-gray-500">${playlist.songs.length} songs</span>
                    </div>
                </a>
                <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="edit-playlist-btn w-6 h-6 text-gray-400 hover:text-white" data-playlist-id="${playlist._id}">
                        <i class="fas fa-edit text-xs"></i>
                    </button>
                    <button class="delete-playlist-btn w-6 h-6 text-gray-400 hover:text-red-400" data-playlist-id="${playlist._id}">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </div>
        `;
        }).join('');

        // Bind playlist item events
        container.querySelectorAll('.edit-playlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = btn.dataset.playlistId;
                this.showEditModal(playlistId);
            });
        });        container.querySelectorAll('.delete-playlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const playlistId = btn.dataset.playlistId;
                this.confirmDeletePlaylist(playlistId);
            });
        });

        // Bind playlist navigation events
        container.querySelectorAll('.playlist-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const playlistId = link.dataset.playlistId;
                if (window.chakrasPlayer) {
                    window.chakrasPlayer.switchView('playlist', playlistId);
                }
            });
        });
    }

    // Show create playlist modal
    showCreateModal() {
        document.getElementById('create-playlist-modal').classList.remove('hidden');
        document.getElementById('playlist-name').focus();
    }

    // Hide create playlist modal
    hideCreateModal() {
        document.getElementById('create-playlist-modal').classList.add('hidden');
        document.getElementById('create-playlist-form').reset();
        document.getElementById('cover-preview').innerHTML = '<i class="fas fa-image text-gray-400"></i>';
    }

    // Show edit playlist modal
    async showEditModal(playlistId) {
        try {
            const response = await playlistService.getPlaylist(playlistId);
            if (response.success) {
                const playlist = response.data.playlist;
                
                document.getElementById('edit-playlist-id').value = playlist._id;
                document.getElementById('edit-playlist-name').value = playlist.name;
                document.getElementById('edit-playlist-description').value = playlist.description || '';
                document.getElementById('edit-playlist-tags').value = playlist.tags.join(', ');
                document.getElementById('edit-playlist-public').checked = playlist.isPublic;
                
                const previewElement = document.getElementById('edit-cover-preview');                if (playlist.coverImage) {
                    previewElement.innerHTML = `<img src="http://localhost:5000${playlist.coverImage}" alt="${playlist.name}" class="w-full h-full object-cover rounded-lg">`;
                } else {
                    previewElement.innerHTML = '<i class="fas fa-image text-gray-400"></i>';
                }
                
                document.getElementById('edit-playlist-modal').classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error loading playlist for edit:', error);
        }
    }

    // Hide edit playlist modal
    hideEditModal() {
        document.getElementById('edit-playlist-modal').classList.add('hidden');
    }

    // Show add to playlist modal
    showAddToPlaylistModal(songData) {
        this.currentSongToAdd = songData;
        this.renderPlaylistSelection();
        document.getElementById('add-to-playlist-modal').classList.remove('hidden');
    }

    // Hide add to playlist modal
    hideAddToPlaylistModal() {
        document.getElementById('add-to-playlist-modal').classList.add('hidden');
        this.currentSongToAdd = null;
    }

    // Hide all modals
    hideAllModals() {
        this.hideCreateModal();
        this.hideEditModal();
        this.hideAddToPlaylistModal();
    }

    // Handle cover image upload
    async handleCoverUpload(event, previewElementId) {
        const file = event.target.files[0];
        if (!file) return;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewElement = document.getElementById(previewElementId);
            previewElement.innerHTML = `<img src="${e.target.result}" alt="Cover preview" class="w-full h-full object-cover rounded-lg">`;
        };
        reader.readAsDataURL(file);

        // Upload to server
        try {
            const response = await playlistService.uploadCoverImage(file);
            if (response.success) {
                // Store the uploaded image URL for form submission
                const form = event.target.closest('form');
                if (form) {
                    form.dataset.coverImage = response.data.url;
                }
            }
        } catch (error) {
            console.error('Error uploading cover image:', error);
            // You might want to show an error message to the user
        }
    }    // Handle create playlist form submission
    async handleCreatePlaylist(event) {
        event.preventDefault();
        
        const formData = {
            name: document.getElementById('playlist-name').value.trim(),
            description: document.getElementById('playlist-description').value.trim(),
            isPublic: document.getElementById('playlist-public').checked,
            tags: document.getElementById('playlist-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            coverImage: event.target.dataset.coverImage || null
        };

        try {
            const response = await playlistService.createPlaylist(formData);
            if (response) {
                this.hideCreateModal();
                
                // If there's a pending song to add, add it to the new playlist
                if (window.pendingSongToAdd) {
                    try {
                        await playlistService.addSongToPlaylist(response._id, window.pendingSongToAdd);
                        this.showNotification(`Playlist created and song added!`, 'success');
                        window.pendingSongToAdd = null; // Clear the pending song
                    } catch (error) {
                        console.error('Error adding song to new playlist:', error);
                        this.showNotification('Playlist created but failed to add song', 'warning');
                    }
                } else {
                    this.showNotification('Playlist created successfully!', 'success');
                }
                
                this.loadUserPlaylists(); // Refresh playlist list
            }
        } catch (error) {
            console.error('Error creating playlist:', error);
            this.showNotification('Error creating playlist. Please try again.', 'error');
        }
    }

    // Handle edit playlist form submission
    async handleEditPlaylist(event) {
        event.preventDefault();
        
        const playlistId = document.getElementById('edit-playlist-id').value;
        const formData = {
            name: document.getElementById('edit-playlist-name').value.trim(),
            description: document.getElementById('edit-playlist-description').value.trim(),
            isPublic: document.getElementById('edit-playlist-public').checked,
            tags: document.getElementById('edit-playlist-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
            coverImage: event.target.dataset.coverImage || undefined
        };

        try {
            const response = await playlistService.updatePlaylist(playlistId, formData);
            if (response.success) {
                this.hideEditModal();
                this.loadUserPlaylists(); // Refresh playlist list
                
                // Show success message
                this.showNotification('Playlist updated successfully!', 'success');
            }
        } catch (error) {
            console.error('Error updating playlist:', error);
            this.showNotification('Error updating playlist. Please try again.', 'error');
        }
    }

    // Confirm and delete playlist
    async confirmDeletePlaylist(playlistId) {
        const playlist = this.userPlaylists.find(p => p._id === playlistId);
        if (!playlist) return;

        if (confirm(`Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`)) {
            try {
                const response = await playlistService.deletePlaylist(playlistId);
                if (response.success) {
                    this.loadUserPlaylists(); // Refresh playlist list
                    this.showNotification('Playlist deleted successfully!', 'success');
                }
            } catch (error) {
                console.error('Error deleting playlist:', error);
                this.showNotification('Error deleting playlist. Please try again.', 'error');
            }
        }
    }

    // Render playlist selection for add to playlist modal
    renderPlaylistSelection() {
        const container = document.getElementById('playlist-selection-list');
        container.innerHTML = this.userPlaylists.map(playlist => `
            <div class="playlist-selection-item flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer" data-playlist-id="${playlist._id}">
                <div class="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">                    ${playlist.coverImage ? 
                        `<img src="http://localhost:5000${playlist.coverImage}" alt="${playlist.name}" class="w-full h-full object-cover rounded">` :
                        `<i class="fas fa-music text-gray-400"></i>`
                    }
                </div>
                <div class="flex-1">
                    <div class="text-white font-medium">${playlist.name}</div>
                    <div class="text-gray-400 text-sm">${playlist.songs.length} songs</div>
                </div>
            </div>
        `).join('');

        // Bind selection events
        container.querySelectorAll('.playlist-selection-item').forEach(item => {
            item.addEventListener('click', () => {
                const playlistId = item.dataset.playlistId;
                this.addSongToPlaylist(playlistId);
            });
        });
    }

    // Add song to selected playlist
    async addSongToPlaylist(playlistId) {
        if (!this.currentSongToAdd) return;

        try {
            const response = await playlistService.addSongToPlaylist(playlistId, this.currentSongToAdd);
            if (response.success) {
                this.hideAddToPlaylistModal();
                this.showNotification('Song added to playlist!', 'success');
            }
        } catch (error) {
            console.error('Error adding song to playlist:', error);
            this.showNotification('Error adding song to playlist.', 'error');
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

// Initialize playlist UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.user) { // Only initialize if user is logged in
        window.playlistUI = new PlaylistUI();
    }
});
