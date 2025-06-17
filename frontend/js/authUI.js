// Chakras Authentication UI Components - COMPLETE VERSION

class AuthUI {
    constructor() {
        this.modalsContainer = document.getElementById('auth-modals-container');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
        }

        // Register button
        const registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.showRegisterModal());
        }

        // User menu dropdown
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userDropdown = document.getElementById('user-dropdown');
        
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userDropdown.classList.add('hidden');
            });

            // Dropdown actions
            userDropdown.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]')?.getAttribute('data-action');
                
                switch (action) {
                    case 'profile':
                        this.showProfileModal();
                        break;
                    case 'settings':
                        this.showSettingsModal();
                        break;
                    case 'logout':
                        this.handleLogout();
                        break;
                }
                
                userDropdown.classList.add('hidden');
            });
        }
    }

    // Show login modal
    showLoginModal() {
        const modal = this.createModal('Login to Chakras', this.getLoginForm());
        this.modalsContainer.appendChild(modal);
        this.setupLoginForm(modal);
    }

    // Show register modal
    showRegisterModal() {
        const modal = this.createModal('Join Chakras', this.getRegisterForm());
        this.modalsContainer.appendChild(modal);
        this.setupRegisterForm(modal);
    }

    // Show profile modal
    showProfileModal() {
        const user = window.authService.getUser();
        if (!user) {
            this.showError('Please login to view your profile');
            return;
        }
        const modal = this.createModal('Your Profile', this.getProfileForm(user));
        this.modalsContainer.appendChild(modal);
        this.setupProfileForm(modal);
    }

    // Show settings modal
    showSettingsModal() {
        const user = window.authService.getUser();
        if (!user) {
            this.showError('Please login to access settings');
            return;
        }
        const modal = this.createModal('Settings', this.getSettingsForm(user));
        this.modalsContainer.appendChild(modal);
        this.setupSettingsForm(modal);
    }

    // Create modal base
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 auth-modal';
        modal.innerHTML = `
            <div class="bg-chakra-darker p-8 rounded-xl max-w-md w-full mx-4 glass border border-chakra-primary/20 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-white">${title}</h2>
                    <button class="close-modal w-8 h-8 text-gray-400 hover:text-white transition-colors">
                        <i class="fas fa-times text-lg"></i>
                    </button>
                </div>
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        `;

        // Close modal event
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Prevent scroll on body
        document.body.style.overflow = 'hidden';
        modal.addEventListener('remove', () => {
            document.body.style.overflow = '';
        });

        return modal;
    }

    // Login form HTML
    getLoginForm() {
        return `
            <form id="login-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Email or Username</label>
                    <input type="text" name="login" required 
                           class="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chakra-primary border border-gray-700"
                           placeholder="Enter your email or username">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <div class="relative">
                        <input type="password" name="password" required 
                               class="w-full bg-gray-800 text-white rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-chakra-primary border border-gray-700"
                               placeholder="Enter your password">
                        <button type="button" class="toggle-password absolute right-3 top-3 text-gray-400 hover:text-white">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <label class="flex items-center">
                        <input type="checkbox" name="remember" class="mr-2 rounded">
                        <span class="text-sm text-gray-400">Remember me</span>
                    </label>
                    <button type="button" class="text-sm text-chakra-primary hover:underline">
                        Forgot password?
                    </button>
                </div>

                <div class="login-error hidden p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p class="text-red-400 text-sm"></p>
                </div>

                <button type="submit" class="w-full btn-chakra py-3 rounded-lg text-white font-medium transition-all">
                    <span class="login-btn-text">Login</span>
                    <i class="fas fa-spinner fa-spin hidden login-spinner ml-2"></i>
                </button>

                <div class="text-center pt-4 border-t border-gray-700">
                    <span class="text-gray-400">Don't have an account? </span>
                    <button type="button" class="show-register text-chakra-primary hover:underline font-medium">Sign up</button>
                </div>
            </form>
        `;
    }

    // Register form HTML
    getRegisterForm() {
        return `
            <form id="register-form" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                        <input type="text" name="firstName" required 
                               class="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chakra-primary border border-gray-700"
                               placeholder="John">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                        <input type="text" name="lastName" required 
                               class="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chakra-primary border border-gray-700"
                               placeholder="Doe">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Username</label>
                    <input type="text" name="username" required 
                           class="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chakra-primary border border-gray-700"
                           placeholder="johndoe123">
                    <p class="text-xs text-gray-500 mt-1">Choose a unique username</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    <input type="email" name="email" required 
                           class="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chakra-primary border border-gray-700"
                           placeholder="john@example.com">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Password</label>
                    <div class="relative">
                        <input type="password" name="password" required minlength="6"
                               class="w-full bg-gray-800 text-white rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-chakra-primary border border-gray-700"
                               placeholder="Create a strong password">
                        <button type="button" class="toggle-password absolute right-3 top-3 text-gray-400 hover:text-white">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                </div>

                <div>
                    <label class="flex items-start">
                        <input type="checkbox" name="terms" required class="mr-2 mt-1 rounded">
                        <span class="text-sm text-gray-400">I agree to the <a href="#" class="text-chakra-primary hover:underline">Terms of Service</a> and <a href="#" class="text-chakra-primary hover:underline">Privacy Policy</a></span>
                    </label>
                </div>

                <div class="register-error hidden p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p class="text-red-400 text-sm"></p>
                </div>

                <button type="submit" class="w-full btn-chakra py-3 rounded-lg text-white font-medium transition-all">
                    <span class="register-btn-text">Create Account</span>
                    <i class="fas fa-spinner fa-spin hidden register-spinner ml-2"></i>
                </button>

                <div class="text-center pt-4 border-t border-gray-700">
                    <span class="text-gray-400">Already have an account? </span>
                    <button type="button" class="show-login text-chakra-primary hover:underline font-medium">Login</button>
                </div>
            </form>
        `;
    }

    // Profile form HTML
    getProfileForm(user) {
        return `
            <div class="space-y-6">
                <!-- Avatar Section -->
                <div class="text-center">
                    <div class="relative inline-block">
                        <div class="w-24 h-24 rounded-full overflow-hidden bg-chakra-primary flex items-center justify-center mx-auto border-4 border-chakra-primary/30">
                            ${user.avatar ? 
                                `<img src="http://localhost:5000${user.avatar}" alt="Avatar" class="w-full h-full object-cover">` :
                                `<span class="text-2xl font-bold text-white">${user.initials}</span>`
                            }
                        </div>
                        <button id="upload-avatar-btn" class="absolute bottom-0 right-0 w-8 h-8 bg-chakra-primary rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg">
                            <i class="fas fa-camera text-sm"></i>
                        </button>
                        <input type="file" id="avatar-input" accept="image/*" class="hidden">
                    </div>
                    <h3 class="text-xl font-bold text-white mt-4">${user.fullName}</h3>
                    <p class="text-gray-400">@${user.username}</p>
                    <div class="flex items-center justify-center space-x-4 mt-2 text-sm text-gray-500">
                        <span><i class="fas fa-calendar-alt mr-1"></i> Joined ${new Date(user.createdAt).toLocaleDateString()}</span>
                        <span><i class="fas fa-crown mr-1"></i> ${user.subscription?.plan?.charAt(0).toUpperCase() + user.subscription?.plan?.slice(1)} Plan</span>
                    </div>
                </div>

                <!-- Profile Form -->
                <form id="profile-form" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                            <input type="text" name="firstName" value="${user.firstName}" required 
                                   class="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chakra-primary border border-gray-700">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                            <input type="text" name="lastName" value="${user.lastName}" required 
                                   class="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chakra-primary border border-gray-700">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
                        <input type="email" name="email" value="${user.email}" required 
                               class="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chakra-primary border border-gray-700">
                    </div>

                    <div class="profile-error hidden p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <p class="text-red-400 text-sm"></p>
                    </div>

                    <div class="profile-success hidden p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                        <p class="text-green-400 text-sm"></p>
                    </div>

                    <button type="submit" class="w-full btn-chakra py-3 rounded-lg text-white font-medium transition-all">
                        <span class="profile-btn-text">Update Profile</span>
                        <i class="fas fa-spinner fa-spin hidden profile-spinner ml-2"></i>
                    </button>
                </form>

                <!-- Music Stats -->
                <div class="bg-gray-800/50 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-white mb-3">Music Stats</h4>
                    <div class="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div class="text-2xl font-bold text-chakra-primary">${user.musicStats?.totalPlays || 0}</div>
                            <div class="text-xs text-gray-400">Total Plays</div>
                        </div>
                        <div>
                            <div class="text-2xl font-bold text-chakra-primary">${Math.round((user.musicStats?.totalListeningTime || 0) / 60)}</div>
                            <div class="text-xs text-gray-400">Minutes Listened</div>
                        </div>
                    </div>
                </div>

                <!-- Change Password Section -->
                <div class="border-t border-gray-700 pt-6">
                    <h4 class="text-lg font-semibold text-white mb-4">Change Password</h4>
                    <form id="password-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                            <input type="password" name="currentPassword" required 
                                   class="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chakra-primary border border-gray-700"
                                   placeholder="Enter current password">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                            <input type="password" name="newPassword" required minlength="6"
                                   class="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chakra-primary border border-gray-700"
                                   placeholder="Enter new password">
                            <p class="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                        </div>

                        <div class="password-error hidden p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <p class="text-red-400 text-sm"></p>
                        </div>

                        <div class="password-success hidden p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                            <p class="text-green-400 text-sm"></p>
                        </div>

                        <button type="submit" class="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg text-white font-medium transition-colors">
                            <span class="password-btn-text">Change Password</span>
                            <i class="fas fa-spinner fa-spin hidden password-spinner ml-2"></i>
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    // Settings form HTML
    getSettingsForm(user) {
        return `
            <form id="settings-form" class="space-y-6">
                <!-- Theme Settings -->
                <div>
                    <h4 class="text-lg font-semibold text-white mb-4">Appearance</h4>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Theme</label>
                        <select name="theme" class="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-chakra-primary border border-gray-700">
                            <option value="chakra" ${user.preferences.theme === 'chakra' ? 'selected' : ''}>Chakra (Default)</option>
                            <option value="dark" ${user.preferences.theme === 'dark' ? 'selected' : ''}>Dark</option>
                            <option value="light" ${user.preferences.theme === 'light' ? 'selected' : ''}>Light</option>
                        </select>
                    </div>
                </div>

                <!-- Playback Settings -->
                <div>
                    <h4 class="text-lg font-semibold text-white mb-4">Playback</h4>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-2">Default Volume</label>
                            <div class="flex items-center space-x-4">
                                <input type="range" name="volume" min="0" max="100" value="${Math.round(user.preferences.volume * 100)}"
                                       class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer volume-slider">
                                <span class="text-sm text-gray-400 min-w-[40px]" id="volume-display">${Math.round(user.preferences.volume * 100)}%</span>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                            <div>
                                <span class="text-sm font-medium text-gray-300">Default Shuffle</span>
                                <p class="text-xs text-gray-500">Start with shuffle enabled</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="shuffle" ${user.preferences.shuffle ? 'checked' : ''} class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-chakra-primary"></div>
                            </label>
                        </div>
                        
                        <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                            <div>
                                <span class="text-sm font-medium text-gray-300">Default Repeat</span>
                                <p class="text-xs text-gray-500">Start with repeat enabled</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="repeat" ${user.preferences.repeat ? 'checked' : ''} class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-chakra-primary"></div>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Account Settings -->
                <div>
                    <h4 class="text-lg font-semibold text-white mb-4">Account</h4>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                            <div>
                                <span class="text-sm font-medium text-gray-300">Account Type</span>
                                <p class="text-xs text-gray-500">${user.subscription?.plan?.charAt(0).toUpperCase() + user.subscription?.plan?.slice(1)} Plan</p>
                            </div>
                            <button type="button" class="text-chakra-primary hover:underline text-sm">
                                ${user.subscription?.plan === 'free' ? 'Upgrade' : 'Manage'}
                            </button>
                        </div>
                        
                        <div class="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                            <div>
                                <span class="text-sm font-medium text-gray-300">Member Since</span>
                                <p class="text-xs text-gray-500">${new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="settings-error hidden p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p class="text-red-400 text-sm"></p>
                </div>

                <div class="settings-success hidden p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <p class="text-green-400 text-sm"></p>
                </div>

                <button type="submit" class="w-full btn-chakra py-3 rounded-lg text-white font-medium transition-all">
                    <span class="settings-btn-text">Save Settings</span>
                    <i class="fas fa-spinner fa-spin hidden settings-spinner ml-2"></i>
                </button>
            </form>
        `;
    }

    // Setup login form
    setupLoginForm(modal) {
        const form = modal.querySelector('#login-form');
        const errorDiv = modal.querySelector('.login-error');
        const errorText = errorDiv.querySelector('p');
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.login-btn-text');
        const spinner = submitBtn.querySelector('.login-spinner');

        // Toggle password visibility
        const togglePassword = modal.querySelector('.toggle-password');
        const passwordInput = modal.querySelector('input[name="password"]');
        
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });

        // Switch to register
        const showRegister = modal.querySelector('.show-register');
        showRegister.addEventListener('click', () => {
            modal.remove();
            this.showRegisterModal();
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            btnText.style.display = 'none';
            spinner.classList.remove('hidden');
            submitBtn.disabled = true;
            errorDiv.classList.add('hidden');

            const formData = new FormData(form);
            const credentials = {
                login: formData.get('login'),
                password: formData.get('password')
            };

            const result = await window.authService.login(credentials);

            if (result.success) {
                modal.remove();
                this.showSuccess('Welcome back! You have been logged in successfully.');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                errorText.textContent = result.message;
                errorDiv.classList.remove('hidden');
            }

            btnText.style.display = 'inline';
            spinner.classList.add('hidden');
            submitBtn.disabled = false;
        });
    }

    // Setup register form
    setupRegisterForm(modal) {
        const form = modal.querySelector('#register-form');
        const errorDiv = modal.querySelector('.register-error');
        const errorText = errorDiv.querySelector('p');
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.register-btn-text');
        const spinner = submitBtn.querySelector('.register-spinner');

        // Toggle password visibility
        const togglePassword = modal.querySelector('.toggle-password');
        const passwordInput = modal.querySelector('input[name="password"]');
        
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        });

        // Switch to login
        const showLogin = modal.querySelector('.show-login');
        showLogin.addEventListener('click', () => {
            modal.remove();
            this.showLoginModal();
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            btnText.style.display = 'none';
            spinner.classList.remove('hidden');
            submitBtn.disabled = true;
            errorDiv.classList.add('hidden');

            const formData = new FormData(form);
            const userData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password')
            };

            const result = await window.authService.register(userData);

            if (result.success) {
                modal.remove();
                this.showSuccess('Account created successfully! Welcome to Chakras.');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                errorText.textContent = result.message;
                errorDiv.classList.remove('hidden');
            }

            btnText.style.display = 'inline';
            spinner.classList.add('hidden');
            submitBtn.disabled = false;
        });
    }

    // Setup profile form
    setupProfileForm(modal) {
        const profileForm = modal.querySelector('#profile-form');
        const passwordForm = modal.querySelector('#password-form');
        const avatarInput = modal.querySelector('#avatar-input');
        const uploadBtn = modal.querySelector('#upload-avatar-btn');

        // Avatar upload
        uploadBtn.addEventListener('click', () => {
            avatarInput.click();
        });

        avatarInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    this.showError('File size must be less than 5MB');
                    return;
                }

                // Show loading state
                uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin text-sm"></i>';
                
                const result = await window.authService.uploadAvatar(file);
                
                if (result.success) {
                    this.showSuccess('Avatar updated successfully!');
                    // Update avatar display
                    const avatarContainer = modal.querySelector('.w-24.h-24');
                    avatarContainer.innerHTML = `<img src="http://localhost:5000${result.avatar}" alt="Avatar" class="w-full h-full object-cover">`;
                } else {
                    this.showError(result.message);
                }
                
                // Restore button
                uploadBtn.innerHTML = '<i class="fas fa-camera text-sm"></i>';
            }
        });

        // Profile form submission
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.profile-btn-text');
            const spinner = submitBtn.querySelector('.profile-spinner');
            
            btnText.style.display = 'none';
            spinner.classList.remove('hidden');
            submitBtn.disabled = true;

            const formData = new FormData(profileForm);
            const profileData = {
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                email: formData.get('email')
            };

            const result = await window.authService.updateProfile(profileData);
            
            if (result.success) {
                this.showFormSuccess(modal, '.profile-success', 'Profile updated successfully!');
            } else {
                this.showFormError(modal, '.profile-error', result.message);
            }
            
            btnText.style.display = 'inline';
            spinner.classList.add('hidden');
            submitBtn.disabled = false;
        });

        // Password form submission
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = passwordForm.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.password-btn-text');
            const spinner = submitBtn.querySelector('.password-spinner');
            
            btnText.style.display = 'none';
            spinner.classList.remove('hidden');
            submitBtn.disabled = true;

            const formData = new FormData(passwordForm);
            const passwords = {
                currentPassword: formData.get('currentPassword'),
                newPassword: formData.get('newPassword')
            };

            const result = await window.authService.changePassword(passwords);
            
            if (result.success) {
                this.showFormSuccess(modal, '.password-success', 'Password changed successfully!');
                passwordForm.reset();
            } else {
                this.showFormError(modal, '.password-error', result.message);
            }
            
            btnText.style.display = 'inline';
            spinner.classList.add('hidden');
            submitBtn.disabled = false;
        });
    }

    // Setup settings form
    setupSettingsForm(modal) {
        const form = modal.querySelector('#settings-form');
        const volumeSlider = modal.querySelector('input[name="volume"]');
        const volumeDisplay = modal.querySelector('#volume-display');

        // Volume slider update
        volumeSlider.addEventListener('input', () => {
            volumeDisplay.textContent = `${volumeSlider.value}%`;
        });

        // Style the range slider
        volumeSlider.style.background = `linear-gradient(to right, #ff6b9d 0%, #ff6b9d ${volumeSlider.value}%, #374151 ${volumeSlider.value}%, #374151 100%)`;
        
        volumeSlider.addEventListener('input', function() {
            this.style.background = `linear-gradient(to right, #ff6b9d 0%, #ff6b9d ${this.value}%, #374151 ${this.value}%, #374151 100%)`;
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const btnText = submitBtn.querySelector('.settings-btn-text');
            const spinner = submitBtn.querySelector('.settings-spinner');
            
            btnText.style.display = 'none';
            spinner.classList.remove('hidden');
            submitBtn.disabled = true;

            const formData = new FormData(form);
            const preferences = {
                theme: formData.get('theme'),
                volume: parseInt(formData.get('volume')) / 100,
                shuffle: formData.get('shuffle') === 'on',
                repeat: formData.get('repeat') === 'on'
            };

            const result = await window.authService.updatePreferences(preferences);
            
            if (result.success) {
                this.showFormSuccess(modal, '.settings-success', 'Settings saved successfully!');
                
                // Apply theme immediately if changed
                const currentUser = window.authService.getUser();
                if (preferences.theme !== currentUser.preferences.theme) {
                    document.documentElement.setAttribute('data-theme', preferences.theme);
                }

                // Apply volume to audio player if exists
                if (window.chakrasAudioPlayer) {
                    window.chakrasAudioPlayer.volume = preferences.volume;
                    window.chakrasAudioPlayer.audio.volume = preferences.volume;
                    window.chakrasAudioPlayer.updateVolumeDisplay();
                }
            } else {
                this.showFormError(modal, '.settings-error', result.message);
            }
            
            btnText.style.display = 'inline';
            spinner.classList.add('hidden');
            submitBtn.disabled = false;
        });
    }

    // Handle logout
    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            await window.authService.logout();
        }
    }

    // Show success message
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    // Show error message
    showError(message) {
        this.showToast(message, 'error');
    }

    // Show form success
    showFormSuccess(modal, selector, message) {
        const successDiv = modal.querySelector(selector);
        const errorDiv = modal.querySelector(selector.replace('success', 'error'));
        
        if (errorDiv) errorDiv.classList.add('hidden');
        if (successDiv) {
            successDiv.querySelector('p').textContent = message;
            successDiv.classList.remove('hidden');
            
            // Auto hide after 3 seconds
            setTimeout(() => {
                successDiv.classList.add('hidden');
            }, 3000);
        }
    }

    // Show form error
    showFormError(modal, selector, message) {
        const errorDiv = modal.querySelector(selector);
        const successDiv = modal.querySelector(selector.replace('error', 'success'));
        
        if (successDiv) successDiv.classList.add('hidden');
        if (errorDiv) {
            errorDiv.querySelector('p').textContent = message;
            errorDiv.classList.remove('hidden');
        }
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast-notification transform transition-all duration-300 translate-x-full opacity-0 ${
            type === 'success' ? 'bg-green-500' : 
            type === 'error' ? 'bg-red-500' : 
            'bg-blue-500'
        } text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 mb-3`;
        
        toast.innerHTML = `
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                'fa-info-circle'
            } text-lg"></i>
            <span class="flex-1">${message}</span>
            <button class="toast-close ml-4 hover:bg-white/20 rounded p-1">
                <i class="fas fa-times"></i>
            </button>
        `;

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        }, 100);

        // Auto remove after 5 seconds
        const autoRemove = setTimeout(() => {
            this.removeToast(toast);
        }, 5000);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.removeToast(toast);
        });
    }

    // Create toast container
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 z-[60] max-w-sm w-full';
        document.body.appendChild(container);
        return container;
    }

    // Remove toast
    removeToast(toast) {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

// Initialize Auth UI
document.addEventListener('DOMContentLoaded', () => {
    window.authUI = new AuthUI();
});