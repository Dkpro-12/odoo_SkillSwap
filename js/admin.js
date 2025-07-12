// js/admin.js
class AdminDashboard {
    constructor() {
        this.init();
    }

    async init() {
        document.getElementById('admin-users-btn').addEventListener('click', () => this.loadUserManagement());
        document.getElementById('admin-swaps-btn').addEventListener('click', () => this.loadSwapManagement());
        document.getElementById('admin-reports-btn').addEventListener('click', () => this.loadReportManagement());
        document.getElementById('admin-logout-btn').addEventListener('click', () => AuthService.logout());
        
        // Load default view
        this.loadUserManagement();
    }

    async loadUserManagement() {
        const users = await this.getAllUsers();
        
        document.getElementById('admin-main-content').innerHTML = `
            <div class="admin-section">
                <h2>User Management</h2>
                <div class="search-filter">
                    <input type="text" id="user-search" placeholder="Search users...">
                    <button id="search-users-btn">Search</button>
                </div>
                <div class="users-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td>${user.name || 'N/A'}</td>
                                    <td>${user.email}</td>
                                    <td>${user.isBanned ? 'Banned' : 'Active'}</td>
                                    <td>
                                        ${!user.isBanned ? 
                                            `<button class="ban-btn" data-userid="${user.id}">Ban</button>` : 
                                            `<button class="unban-btn" data-userid="${user.id}">Unban</button>`
                                        }
                                        <button class="view-profile-btn" data-userid="${user.id}">View</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.querySelectorAll('.ban-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = e.target.dataset.userid;
                await this.banUser(userId);
                e.target.replaceWith(document.createElement('button'))
                    .textContent = 'Unban'
                    .classList.add('unban-btn')
                    .dataset.userid = userId;
                e.target.nextElementSibling.textContent = 'Banned';
            });
        });

        document.querySelectorAll('.unban-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const userId = e.target.dataset.userid;
                await this.unbanUser(userId);
                e.target.replaceWith(document.createElement('button'))
                    .textContent = 'Ban'
                    .classList.add('ban-btn')
                    .dataset.userid = userId;
                e.target.nextElementSibling.textContent = 'Active';
            });
        });
    }

    async getAllUsers() {
        const snapshot = await db.collection('users').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async banUser(userId) {
        await db.collection('users').doc(userId).update({
            isBanned: true,
            bannedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    async unbanUser(userId) {
        await db.collection('users').doc(userId).update({
            isBanned: false,
            unbannedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    async loadSwapManagement() {
        const swaps = await this.getAllSwaps();
        
        document.getElementById('admin-main-content').innerHTML = `
            <div class="admin-section">
                <h2>Swap Management</h2>
                <div class="filters">
                    <select id="swap-status-filter">
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                        <option value="completed">Completed</option>
                    </select>
                    <button id="apply-filter-btn">Apply Filter</button>
                </div>
                <div class="swaps-table">
                    <table>
                        <thead>
                            <tr>
                                <th>From User</th>
                                <th>To User</th>
                                <th>Offered Skill</th>
                                <th>Requested Skill</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${swaps.map(swap => `
                                <tr>
                                    <td>${swap.fromUserName || 'Unknown'}</td>
                                    <td>${swap.toUserName || 'Unknown'}</td>
                                    <td>${swap.offeredSkill}</td>
                                    <td>${swap.requestedSkill}</td>
                                    <td class="status-${swap.status}">${swap.status}</td>
                                    <td>${new Date(swap.createdAt?.seconds * 1000).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    async getAllSwaps() {
        const snapshot = await db.collection('swaps').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => doc.data());
    }

    async loadReportManagement() {
        const reports = await this.getAllReports();
        
        document.getElementById('admin-main-content').innerHTML = `
            <div class="admin-section">
                <h2>Report Management</h2>
                <div class="reports-list">
                    ${reports.length === 0 ? 
                        '<p>No reports found.</p>' : 
                        reports.map(report => `
                            <div class="report-item">
                                <div class="report-header">
                                    <h3>Report #${report.id.substring(0, 8)}</h3>
                                    <span class="report-status ${report.status}">${report.status}</span>
                                </div>
                                <p><strong>User:</strong> ${report.userName || 'Unknown'}</p>
                                <p><strong>Reason:</strong> ${report.reason}</p>
                                <p><strong>Date:</strong> ${new Date(report.createdAt?.seconds * 1000).toLocaleString()}</p>
                                ${report.status === 'pending' ? `
                                    <div class="report-actions">
                                        <button class="resolve-btn" data-reportid="${report.id}">Mark as Resolved</button>
                                        <button class="dismiss-btn" data-reportid="${report.id}">Dismiss</button>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;

        document.querySelectorAll('.resolve-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const reportId = e.target.dataset.reportid;
                await this.resolveReport(reportId);
                e.target.closest('.report-item').querySelector('.report-status').textContent = 'resolved';
                e.target.closest('.report-actions').remove();
            });
        });

        document.querySelectorAll('.dismiss-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const reportId = e.target.dataset.reportid;
                await this.dismissReport(reportId);
                e.target.closest('.report-item').remove();
            });
        });
    }

    async getAllReports() {
        const snapshot = await db.collection('reports').orderBy('createdAt', 'desc').get();
        return snapshot.docs.map(doc => doc.data());
    }

    async resolveReport(reportId) {
        await db.collection('reports').doc(reportId).update({
            status: 'resolved',
            resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    async dismissReport(reportId) {
        await db.collection('reports').doc(reportId).delete();
    }
}

// Initialize admin dashboard when on admin page
if (window.location.pathname === '/admin') {
    document.addEventListener('DOMContentLoaded', () => {
        new AdminDashboard();
    });
}