// js/app.js
class SkillSwapApp {
    constructor() {
        this.currentUser = null;
        this.initAuthListener();
        this.initRouter();
    }

    initAuthListener() {
        AuthService.onAuthStateChanged(async (user) => {
            this.currentUser = user;
            if (user) {
                const userData = await DatabaseService.getUser(user.uid);
                if (userData.isAdmin) {
                    this.loadAdminDashboard();
                } else {
                    this.loadDashboard();
                }
            } else {
                this.loadLogin();
            }
        });
    }

    initRouter() {
        window.addEventListener('popstate', () => {
            const path = window.location.pathname;
            this.route(path);
        });
        
        // Initial route
        this.route(window.location.pathname);
    }

    route(path) {
        if (path === '/login') {
            this.loadLogin();
        } else if (path === '/register') {
            this.loadRegister();
        } else if (path === '/dashboard') {
            this.loadDashboard();
        } else if (path === '/admin') {
            this.loadAdminDashboard();
        } else {
            this.currentUser ? this.loadDashboard() : this.loadLogin();
        }
    }

    loadLogin() {
        document.getElementById('app-container').innerHTML = `
            <div class="auth-container">
                <h1>Skill Swap</h1>
                <form id="login-form">
                    <input type="email" id="login-email" placeholder="Email" required>
                    <input type="password" id="login-password" placeholder="Password" required>
                    <button type="submit">Login</button>
                </form>
                <p>Don't have an account? <a href="#" id="register-link">Register</a></p>
            </div>
        `;

        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            try {
                await AuthService.login(email, password);
                window.history.pushState({}, '', '/dashboard');
                this.loadDashboard();
            } catch (error) {
                alert(error.message);
            }
        });

        document.getElementById('register-link').addEventListener('click', (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/register');
            this.loadRegister();
        });
    }

    loadRegister() {
        document.getElementById('app-container').innerHTML = `
            <div class="auth-container">
                <h1>Register</h1>
                <form id="register-form">
                    <input type="text" id="register-name" placeholder="Full Name" required>
                    <input type="email" id="register-email" placeholder="Email" required>
                    <input type="password" id="register-password" placeholder="Password" required>
                    <button type="submit">Register</button>
                </form>
                <p>Already have an account? <a href="#" id="login-link">Login</a></p>
            </div>
        `;

        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            
            try {
                await AuthService.register(email, password, name);
                window.history.pushState({}, '', '/dashboard');
                this.loadDashboard();
            } catch (error) {
                alert(error.message);
            }
        });

        document.getElementById('login-link').addEventListener('click', (e) => {
            e.preventDefault();
            window.history.pushState({}, '', '/login');
            this.loadLogin();
        });
    }

    async loadDashboard() {
        const userData = await DatabaseService.getUser(this.currentUser.uid);
        
        document.getElementById('app-container').innerHTML = `
            <div class="dashboard">
                <header>
                    <h1>Skill Swap</h1>
                    <nav>
                        <button id="browse-btn">Browse Skills</button>
                        <button id="profile-btn">My Profile</button>
                        <button id="swaps-btn">My Swaps</button>
                        <button id="logout-btn">Logout</button>
                    </nav>
                </header>
                <main id="main-content">
                    <!-- Content will be loaded here -->
                </main>
            </div>
        `;

        document.getElementById('browse-btn').addEventListener('click', () => this.loadBrowseSkills());
        document.getElementById('profile-btn').addEventListener('click', () => this.loadProfile(userData));
        document.getElementById('swaps-btn').addEventListener('click', () => this.loadMySwaps());
        document.getElementById('logout-btn').addEventListener('click', () => AuthService.logout());

        // Load default view
        this.loadBrowseSkills();
    }

    async loadBrowseSkills() {
        const users = await DatabaseService.getPublicUsers();
        const currentUserId = this.currentUser.uid;
        
        document.getElementById('main-content').innerHTML = `
            <div class="browse-skills">
                <div class="search-bar">
                    <input type="text" id="skill-search" placeholder="Search for a skill...">
                    <button id="search-btn"><i class="fas fa-search"></i></button>
                </div>
                <div class="skills-grid" id="skills-grid">
                    ${users.filter(user => user.id !== currentUserId).map(user => `
                        <div class="user-card" data-userid="${user.id}">
                            <img src="${user.photoUrl || 'images/default-profile.png'}" alt="${user.name}">
                            <h3>${user.name}</h3>
                            <p><strong>Offers:</strong> ${user.skillsOffered.join(', ')}</p>
                            <p><strong>Wants:</strong> ${user.skillsWanted.join(', ')}</p>
                            <button class="request-swap-btn">Request Swap</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.getElementById('search-btn').addEventListener('click', async () => {
            const skill = document.getElementById('skill-search').value.trim();
            if (skill) {
                const results = await DatabaseService.searchUsersBySkill(skill);
                document.getElementById('skills-grid').innerHTML = results.map(user => `
                    <div class="user-card" data-userid="${user.id}">
                        <img src="${user.photoUrl || 'images/default-profile.png'}" alt="${user.name}">
                        <h3>${user.name}</h3>
                        <p><strong>Offers:</strong> ${user.skillsOffered.join(', ')}</p>
                        <p><strong>Wants:</strong> ${user.skillsWanted.join(', ')}</p>
                        <button class="request-swap-btn">Request Swap</button>
                    </div>
                `).join('');
            }
        });

        document.querySelectorAll('.request-swap-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.closest('.user-card').dataset.userid;
                this.showSwapModal(userId);
            });
        });
    }

    async showSwapModal(toUserId) {
        const userData = await DatabaseService.getUser(this.currentUser.uid);
        const toUserData = await DatabaseService.getUser(toUserId);
        
        document.getElementById('main-content').insertAdjacentHTML('beforeend', `
            <div class="modal" id="swap-modal">
                <div class="modal-content">
                    <span class="close-btn">&times;</span>
                    <h2>Request Skill Swap with ${toUserData.name}</h2>
                    <form id="swap-form">
                        <div class="form-group">
                            <label>I will offer:</label>
                            <select id="offered-skill" required>
                                ${userData.skillsOffered.map(skill => `
                                    <option value="${skill}">${skill}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>I want:</label>
                            <select id="requested-skill" required>
                                ${toUserData.skillsOffered.map(skill => `
                                    <option value="${skill}">${skill}</option>
                                `).join('')}
                            </select>
                        </div>
                        <button type="submit">Send Request</button>
                    </form>
                </div>
            </div>
        `);

        document.getElementById('swap-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const offeredSkill = document.getElementById('offered-skill').value;
            const requestedSkill = document.getElementById('requested-skill').value;
            
            try {
                await DatabaseService.createSwapRequest(
                    this.currentUser.uid,
                    toUserId,
                    offeredSkill,
                    requestedSkill
                );
                alert('Swap request sent successfully!');
                document.getElementById('swap-modal').remove();
            } catch (error) {
                alert('Error sending request: ' + error.message);
            }
        });

        document.querySelector('.close-btn').addEventListener('click', () => {
            document.getElementById('swap-modal').remove();
        });
    }

    async loadProfile(userData) {
        document.getElementById('main-content').innerHTML = `
            <div class="profile">
                <div class="profile-header">
                    <img src="${userData.photoUrl || 'images/default-profile.png'}" alt="Profile Photo">
                    <h2>${userData.name}</h2>
                    <p>${userData.location || 'No location specified'}</p>
                </div>
                <div class="profile-details">
                    <div class="skills-section">
                        <h3>Skills I Offer</h3>
                        <ul id="offered-skills">
                            ${userData.skillsOffered.map(skill => `<li>${skill} <button class="remove-skill" data-skill="${skill}">&times;</button></li>`).join('')}
                        </ul>
                        <div class="add-skill">
                            <input type="text" id="new-offered-skill" placeholder="Add a skill">
                            <button id="add-offered-skill">+</button>
                        </div>
                    </div>
                    <div class="skills-section">
                        <h3>Skills I Want</h3>
                        <ul id="wanted-skills">
                            ${userData.skillsWanted.map(skill => `<li>${skill} <button class="remove-skill" data-skill="${skill}">&times;</button></li>`).join('')}
                        </ul>
                        <div class="add-skill">
                            <input type="text" id="new-wanted-skill" placeholder="Add a skill">
                            <button id="add-wanted-skill">+</button>
                        </div>
                    </div>
                    <div class="privacy-toggle">
                        <label>
                            <input type="checkbox" id="profile-public" ${userData.isPublic ? 'checked' : ''}>
                            Make my profile public
                        </label>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('add-offered-skill').addEventListener('click', async () => {
            const skill = document.getElementById('new-offered-skill').value.trim();
            if (skill) {
                await DatabaseService.updateUser(this.currentUser.uid, {
                    skillsOffered: firebase.firestore.FieldValue.arrayUnion(skill)
                });
                document.getElementById('offered-skills').innerHTML += `
                    <li>${skill} <button class="remove-skill" data-skill="${skill}">&times;</button></li>
                `;
                document.getElementById('new-offered-skill').value = '';
            }
        });

        document.getElementById('add-wanted-skill').addEventListener('click', async () => {
            const skill = document.getElementById('new-wanted-skill').value.trim();
            if (skill) {
                await DatabaseService.updateUser(this.currentUser.uid, {
                    skillsWanted: firebase.firestore.FieldValue.arrayUnion(skill)
                });
                document.getElementById('wanted-skills').innerHTML += `
                    <li>${skill} <button class="remove-skill" data-skill="${skill}">&times;</button></li>
                `;
                document.getElementById('new-wanted-skill').value = '';
            }
        });

        document.querySelectorAll('.remove-skill').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const skill = e.target.dataset.skill;
                const listId = e.target.closest('ul').id;
                const field = listId === 'offered-skills' ? 'skillsOffered' : 'skillsWanted';
                
                await DatabaseService.updateUser(this.currentUser.uid, {
                    [field]: firebase.firestore.FieldValue.arrayRemove(skill)
                });
                e.target.closest('li').remove();
            });
        });

        document.getElementById('profile-public').addEventListener('change', async (e) => {
            await DatabaseService.updateUser(this.currentUser.uid, {
                isPublic: e.target.checked
            });
        });
    }

    async loadMySwaps() {
        const swapRequests = await DatabaseService.getSwapRequests(this.currentUser.uid);
        
        document.getElementById('main-content').innerHTML = `
            <div class="my-swaps">
                <h2>My Swap Requests</h2>
                ${swapRequests.length === 0 ? 
                    '<p>You have no pending swap requests.</p>' : 
                    `<div class="swap-requests">
                        ${swapRequests.map(swap => `
                            <div class="swap-request" data-swapid="${swap.id}">
                                <p><strong>${swap.fromUserName}</strong> wants to swap <strong>${swap.offeredSkill}</strong> for your <strong>${swap.requestedSkill}</strong></p>
                                <div class="swap-actions">
                                    <button class="accept-swap">Accept</button>
                                    <button class="reject-swap">Reject</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>`
                }
            </div>
        `;

        document.querySelectorAll('.accept-swap').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const swapId = e.target.closest('.swap-request').dataset.swapid;
                await DatabaseService.respondToSwap(swapId, 'accepted');
                e.target.closest('.swap-request').remove();
            });
        });

        document.querySelectorAll('.reject-swap').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const swapId = e.target.closest('.swap-request').dataset.swapid;
                await DatabaseService.respondToSwap(swapId, 'rejected');
                e.target.closest('.swap-request').remove();
            });
        });
    }

    loadAdminDashboard() {
        document.getElementById('app-container').innerHTML = `
            <div class="admin-dashboard">
                <header>
                    <h1>Admin Dashboard</h1>
                    <nav>
                        <button id="admin-users-btn">Manage Users</button>
                        <button id="admin-swaps-btn">View Swaps</button>
                        <button id="admin-reports-btn">Reports</button>
                        <button id="admin-logout-btn">Logout</button>
                    </nav>
                </header>
                <main id="admin-main-content">
                    <!-- Admin content will be loaded here -->
                </main>
            </div>
        `;

        // Add admin functionality here
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new SkillSwapApp();
});