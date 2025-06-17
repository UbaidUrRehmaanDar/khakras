class ChakrasAPI {
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('chakras_token');
    }
    
    // Helper method for making requests
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API Error');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // Authentication methods
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('chakras_token', this.token);
        }
        
        return data;
    }
    
    async register(username, email, password) {
        const data = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
        
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('chakras_token', this.token);
        }
        
        return data;
    }
    
    // Songs methods
    async getSongs() {
        return await this.request('/songs');
    }
    
    async searchSongs(query) {
        return await this.request(`/songs/search/${encodeURIComponent(query)}`);
    }
    
    // Playlists methods
    async getPlaylists() {
        return await this.request('/playlists');
    }
}

// Create global API instance
window.chakrasAPI = new ChakrasAPI();