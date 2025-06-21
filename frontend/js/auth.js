// Chakras Authentication Service

class AuthService {
    constructor() {
        this.baseUrl = 'http://localhost:5000/api/auth';
        this.currentUser = null;
        this.token = localStorage.getItem('chakras_token');
        
        this.init();
    }

    async init() {
        if (this.token) {
            try {
                await this.getCurrentUser();
            } catch (error) {
                console.log('Token invalid, removing...');
                this.logout();
            }
        }
    }

    // Set authorization header
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': this.token ? `Bearer ${this.token}` : ''
        };
    }

    // Register new user
    async register(userData) {
        try {
            const response = await fetch(`${this.baseUrl}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.data.token;
                this.currentUser = data.data.user;
                localStorage.setItem('chakras_token', this.token);
                this.updateUI();
                return { success: true, user: this.currentUser };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, message: 'Network error during registration' };
        }
    }

    // Login user
    async login(credentials) {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (data.success) {
                this.token = data.data.token;
                this.currentUser = data.data.user;
                localStorage.setItem('chakras_token', this.token);
                this.updateUI();
                return { success: true, user: this.currentUser };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Network error during login' };
        }
    }

    // Get current user
    async getCurrentUser() {
        try {
            const response = await fetch(`${this.baseUrl}/me`, {
                headers: this.getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.data.user;
                this.updateUI();
                return this.currentUser;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Get user error:', error);
            throw error;
        }
    }

    // Update user profile
    async updateProfile(profileData) {
        try {
            const response = await fetch(`${this.baseUrl}/profile`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = { ...this.currentUser, ...data.data.user };
                this.updateUI();
                return { success: true, user: this.currentUser };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, message: 'Network error during profile update' };
        }
    }

    // Update preferences
    async updatePreferences(preferences) {
        try {
            const response = await fetch(`${this.baseUrl}/preferences`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(preferences)
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser.preferences = { ...this.currentUser.preferences, ...data.data.preferences };
                this.updateUI();
                return { success: true, preferences: this.currentUser.preferences };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Update preferences error:', error);
            return { success: false, message: 'Network error during preferences update' };
        }
    }

    // Upload avatar
    async uploadAvatar(file) {
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const response = await fetch(`${this.baseUrl}/avatar`, {
                method: 'POST',
                headers: { 'Authorization': this.token ? `Bearer ${this.token}` : '' },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser.avatar = data.data.avatar;
                this.updateUI();
                return { success: true, avatar: data.data.avatar };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            return { success: false, message: 'Network error during avatar upload' };
        }
    }

    // Change password
    async changePassword(passwords) {
        try {
            const response = await fetch(`${this.baseUrl}/change-password`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(passwords)
            });

            const data = await response.json();

            return { success: data.success, message: data.message };
        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, message: 'Network error during password change' };
        }
    }

    // Logout
    async logout() {
        try {
            if (this.token) {
                await fetch(`${this.baseUrl}/logout`, {
                    method: 'POST',
                    headers: this.getAuthHeaders()
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.token = null;
            this.currentUser = null;
            localStorage.removeItem('chakras_token');
            this.updateUI();
            window.location.reload();
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    // Get user info
    getUser() {
        return this.currentUser;
    }    // Update UI based on auth state
    updateUI() {
        this.updateUserProfile();
        this.toggleAuthElements();
        this.initializePlaylistUI();
    }

    // Initialize playlist UI if user is authenticated
    initializePlaylistUI() {
        if (this.isAuthenticated() && typeof PlaylistUI !== 'undefined') {
            // Initialize playlist UI only if not already initialized
            if (!window.playlistUI) {
                window.playlistUI = new PlaylistUI();
            } else {
                // Refresh playlists if UI already exists
                window.playlistUI.loadUserPlaylists();
            }
        }
    }

    // Update user profile display
    updateUserProfile() {
        if (this.currentUser) {
            // Update user name
            const userNameEl = document.querySelector('.user-name');
            if (userNameEl) {
                userNameEl.textContent = this.currentUser.fullName;
            }

            // Update user plan
            const userPlanEl = document.querySelector('.user-plan');
            if (userPlanEl) {
                userPlanEl.textContent = this.currentUser.subscription?.plan?.charAt(0).toUpperCase() + this.currentUser.subscription?.plan?.slice(1) + ' Plan';
            }

            // Update avatar or initials
            const avatarEl = document.querySelector('.user-avatar');
            if (avatarEl) {
                if (this.currentUser.avatar) {
                    avatarEl.innerHTML = `<img src="http://localhost:5000${this.currentUser.avatar}" alt="Avatar" class="w-full h-full object-cover rounded-full">`;
                } else {
                    avatarEl.innerHTML = `<span class="text-sm font-semibold">${this.currentUser.initials}</span>`;
                }
            }
        }
    }

    // Toggle auth-related elements
    toggleAuthElements() {
        const authElements = document.querySelectorAll('[data-auth]');
        authElements.forEach(element => {
            const authType = element.getAttribute('data-auth');
            
            if (authType === 'required' && this.isAuthenticated()) {
                element.style.display = '';
            } else if (authType === 'required' && !this.isAuthenticated()) {
                element.style.display = 'none';
            } else if (authType === 'guest' && !this.isAuthenticated()) {
                element.style.display = '';
            } else if (authType === 'guest' && this.isAuthenticated()) {
                element.style.display = 'none';
            }
        });
    }
}

// Initialize auth service
window.authService = new AuthService();