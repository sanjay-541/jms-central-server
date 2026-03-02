window.JMS = window.JMS || {};

/**
 * Mobile App Shell Injection (PWA)
 * Automatically adds bottom navigation on small screens
 */
(function initMobileApp() {
    if (window.innerWidth > 768) return; // Desktop doesn't need this

    // Bottom Nav HTML
    const navHTML = `
    <nav class="mobile-nav">
        <a href="/index.html" class="nav-item ${window.location.pathname.includes('index') || window.location.pathname === '/' ? 'active' : ''}">
            <i class="bi bi-grid-1x2-fill"></i>
            <span>Home</span>
        </a>
        <a href="/planning.html" class="nav-item ${window.location.pathname.includes('planning') ? 'active' : ''}">
            <i class="bi bi-calendar-event"></i>
            <span>Plan</span>
        </a>
        <a href="/dpr.html" class="nav-item ${window.location.pathname.includes('dpr') ? 'active' : ''}">
             <i class="bi bi-pencil-square"></i>
            <span>DPR</span>
        </a>
        <a href="/analyze.html" class="nav-item ${window.location.pathname.includes('analyze') ? 'active' : ''}">
            <i class="bi bi-graph-up-arrow"></i>
            <span>Stats</span>
        </a>
         <a href="/settings.html" class="nav-item ${window.location.pathname.includes('settings') ? 'active' : ''}">
            <i class="bi bi-gear-fill"></i>
            <span>More</span>
        </a>
    </nav>`;

    // Inject if not present
    if (!document.querySelector('.mobile-nav')) {
        document.body.insertAdjacentHTML('beforeend', navHTML);
    }
})();

(function (exports) {
    const API_BASE = '/api';

    // --- API ---
    async function request(endpoint, options = {}) {
        if (!options.skipLoader) toggleLoader(true);
        const token = localStorage.getItem('token');
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Inject Factory Context
        const factoryId = localStorage.getItem('jpsms_factory_id');
        if (factoryId) headers['X-Factory-ID'] = factoryId;

        if (options.body instanceof FormData) {
            delete headers['Content-Type']; // Let browser set boundary
        }

        // Add 10s Timeout to ALL requests (Prevents "Unlimited Loading")
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000);

        try {
            const res = await fetch(API_BASE + endpoint, {
                ...options,
                headers,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const data = await res.json();

            if (res.status === 401 || res.status === 403) {
                // Token is missing, invalid, or expired. Force logout.
                if (exports.auth && exports.auth.logout) exports.auth.logout();
                throw new Error(data.error || 'Session Expired. Please login again.');
            }

            if (!res.ok) throw new Error(data.error || 'Request failed');
            return data;
        } catch (err) {
            clearTimeout(timeoutId);
            console.error('API Error:', err);
            // Ignore abort errors (usually manual navigation or timeout)
            if (err.name !== 'AbortError') {
                toast(err.message === 'The user aborted a request.' ? 'Request Timed Out' : err.message, 'error');
            }
            throw err;
        } finally {
            if (!options.skipLoader) toggleLoader(false);
        }
    }

    exports.api = {
        get: (url) => request(url),
        post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
        put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
        delete: (url) => request(url, { method: 'DELETE' }),
        upload: (url, formData) => request(url, { method: 'POST', body: formData }),
        request: (url, options) => request(url, options) // Expose generic just in case
    };

    // --- Auth ---
    exports.auth = {
        login: async (username, password) => {
            const res = await exports.api.post('/login', { username, password });
            if (res.ok) {
                localStorage.setItem('token', res.token); // Store real JWT
                localStorage.setItem('user', JSON.stringify(res.data));
                return { user: res.data, factories: res.factories || [] };
            } else {
                throw new Error(res.error || 'Login failed');
            }
        },
        logout: () => {
            // Reset loader state on logout
            loaderCount = 0;
            toggleLoader(false);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login.html'; // Redirect to login
        },
        getUser: () => JSON.parse(localStorage.getItem('user') || '{}'),
        requireAuth: () => {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            if (!u.username) {
                window.location.href = '/login.html';
                throw new Error('Unauthorized');
            }
            // Strict lockout for Mobile-only roles if they try to access Desktop Shell pages
            const path = window.location.pathname.toLowerCase();
            if (u.role_code === 'qc_supervisor' && !path.includes('qcsupervisor.html')) {
                window.location.href = '/QCSupervisor.html';
                throw new Error('Redirecting to Mobile Portal');
            }
            if (u.role_code === 'supervisor' && !path.includes('supervisor.html')) {
                window.location.href = '/supervisor.html';
                throw new Error('Redirecting to Supervisor Portal');
            }
            if (u.role_code === 'shifting_supervisor' && !path.includes('shifting_supervisor.html')) {
                window.location.href = '/shifting_supervisor.html';
                throw new Error('Redirecting to Shifting Portal');
            }
            return u;
        },
        can: (feature, action = 'view') => {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            if (u.role_code === 'admin') return true; // Admin has full access

            // 1. Granular Check
            const p = u.permissions || {};
            // permission keys: "planning_edit", "masters_edit", "ai_access"
            // feature + "_" + action -> e.g. "planning_edit"
            const key = `${feature}_${action}`;

            // If explicit permission key exists, return it
            if (p[key] !== undefined) return p[key] === true;

            // If feature key exists
            if (p[feature] !== undefined) {
                // Handle Nested Objects (e.g. planning: { view: true })
                if (typeof p[feature] === 'object' && p[feature] !== null) {
                    return p[feature][action] === true;
                }
                // Handle Simple Flags (e.g. ai_access: true)
                return p[feature] === true;
            }

            // 2. Role Fallback (Legacy)
            if (feature === 'masters' && action === 'edit') return ['supervisor', 'manager', 'planner'].includes(u.role_code);
            if (feature === 'planning' && action === 'edit') return ['supervisor', 'manager', 'planner'].includes(u.role_code);
            if (feature === 'planning' && action === 'view') return true; // Explicitly allow view for everyone authenticated
            return true;
        },
        hasRole: (role) => {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            return u.role_code === role;
        },
        // Auto-Logout Timer
        initAutoLogout: () => {
            let warningTimer;
            let logoutTimer;
            let countdownInterval;

            // 29 Minutes Warning, 30 Minutes Logout
            const WARNING_TIME = 29 * 60 * 1000;
            const LOGOUT_TIME = 30 * 60 * 1000;

            // Function Hoisting Solution: Define resetTimers first
            const resetTimers = () => {
                // Only if logged in
                if (!localStorage.getItem('token')) return;

                console.log('[Auto-Logout] Activity detected. Resetting timers.');

                clearTimeout(warningTimer);
                clearTimeout(logoutTimer);
                clearInterval(countdownInterval);

                hideWarning();

                // Set new timers
                warningTimer = setTimeout(showWarning, WARNING_TIME);
                logoutTimer = setTimeout(() => {
                    console.warn('[Auto-Logout] Timeout reached. Logging out.');
                    exports.auth.logout();
                }, LOGOUT_TIME);
            };

            const hideWarning = () => {
                const m = document.getElementById('session-warning-modal');
                if (m) {
                    m.style.display = 'none';
                    const btn = m.querySelector('#stay-logged-in-btn');
                    if (btn) btn.textContent = 'Stay Logged In';
                }
            };

            const showWarning = () => {
                const m = getModal();
                m.style.display = 'flex';

                // Live Countdown
                let left = 60;
                const span = m.querySelector('#session-countdown');

                clearInterval(countdownInterval);
                countdownInterval = setInterval(() => {
                    left--;
                    if (span) span.textContent = left;
                    if (left <= 0) clearInterval(countdownInterval);
                }, 1000);
            };

            // Create Modal if not exists
            const getModal = () => {
                let m = document.getElementById('session-warning-modal');
                if (!m) {
                    m = document.createElement('div');
                    m.id = 'session-warning-modal';
                    m.style.position = 'fixed';
                    m.style.top = '0'; m.style.left = '0';
                    m.style.width = '100vw'; m.style.height = '100vh';
                    m.style.background = 'rgba(0,0,0,0.5)';
                    m.style.zIndex = '99999';
                    m.style.display = 'none'; // Hidden by default
                    m.style.alignItems = 'center';
                    m.style.justifyContent = 'center';
                    m.innerHTML = `
                        <div style="background:white; padding:25px; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.2); text-align:center; max-width:400px;">
                            <h3 style="margin-top:0; color:#dc2626;">Session Expiring</h3>
                            <p style="color:#555; margin:15px 0;">You have been inactive for a while. You will be logged out in <span id="session-countdown" style="font-weight:bold">60</span> seconds.</p>
                            <button id="stay-logged-in-btn" class="btn btn-primary" style="padding:10px 20px; font-size:1rem; cursor:pointer;">Stay Logged In</button>
                        </div>
                    `;
                    document.body.appendChild(m);

                    // Button click forces simple reset
                    const btn = m.querySelector('#stay-logged-in-btn');
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation(); // Stop bubbling
                        console.log('[Auto-Logout] User clicked Stay Logged In');
                        btn.textContent = 'Resuming...';
                        resetTimers();
                    });
                }
                return m;
            };

            // Throttle Main Reset
            let lastReset = 0;
            const throttledReset = () => {
                const now = Date.now();
                if (now - lastReset > 5000) {
                    resetTimers();
                    lastReset = now;
                }
            };

            // Events
            ['load', 'mousemove', 'mousedown', 'click', 'scroll', 'keypress', 'touchstart'].forEach(evt => {
                window.addEventListener(evt, throttledReset, { passive: true });
            });

            // Start
            resetTimers();
        }

    };

    exports.toggleSidebar = () => {
        const sb = document.querySelector('.sidebar');
        if (sb) {
            sb.classList.toggle('collapsed');
            localStorage.setItem('sidebar_collapsed', sb.classList.contains('collapsed'));
        }
    };

    // Start Auto-Logout Monitor
    if (typeof document !== 'undefined') {
        try { exports.auth.initAutoLogout(); } catch (e) { console.error(e); }
    }

    // --- Store (Frontend State) ---
    exports.store = {
        get me() { return exports.auth.getUser(); }
    };

    // --- Toast ---
    // --- Global Loader ---
    let loaderCount = 0;
    function createLoader() {
        if (document.getElementById('global-loader')) return;
        const div = document.createElement('div');
        div.id = 'global-loader';
        div.innerHTML = `
            <div class="loader-content">
                <div class="loader-icon-container">
                    <div class="loader-icon"><i class="bi bi-stars"></i></div>
                    <div class="loader-glow"></div>
                </div>
                <div class="loader-text">AI Powered JMS</div>
                <div class="loader-sub">
                    Loading Experience
                </div>
                <div class="loader-progress-container">
                    <div class="loader-progress-bar"></div>
                </div>
            </div>
        `;
        document.body.appendChild(div);
    }

    function toggleLoader(show) {
        if (show) {
            loaderCount++;
            createLoader();
            const l = document.getElementById('global-loader');
            if (l) requestAnimationFrame(() => {
                if (loaderCount > 0) l.classList.add('visible');
            });
        } else {
            loaderCount = Math.max(0, loaderCount - 1);
            if (loaderCount === 0) {
                const l = document.getElementById('global-loader');
                if (l) l.classList.remove('visible');
            }
        }
    }

    // Auto-Init Loader on Script Run
    if (typeof document !== 'undefined') {
        createLoader();
        const l = document.getElementById('global-loader');
        if (l) l.classList.add('visible');
        loaderCount = 1;

        // 1. Force Clear Safety (Stop "Unlimited Time" Loading)
        // If something hangs for > 5 seconds, kill the loader
        setTimeout(() => {
            if (loaderCount > 0) {
                console.warn('Loader Stuck? Forcing clear.');
                loaderCount = 0;
                toggleLoader(false);
            }
        }, 5000);

        // 2. DOMContentLoaded (Also Super Fast)
        document.addEventListener('DOMContentLoaded', () => {
            toggleLoader(false);
        });

        // 3. Window Load (Fallback)
        window.addEventListener('load', () => {
            toggleLoader(false);
        });

        // 4. Ultimate Fallback (1.5s max)
        setTimeout(() => { if (loaderCount > 0) toggleLoader(false); }, 1500);
    }

    // --- Toast ---
    function toast(msg, type = 'info') {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.bottom = '20px';
        div.style.right = '20px';
        div.style.padding = '12px 24px';
        div.style.borderRadius = '8px';
        div.style.color = '#fff';
        div.style.background = type === 'error' ? '#ef4444' : '#22c55e';
        div.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        div.style.zIndex = '9999';
        div.textContent = msg;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }
    exports.toast = toast;
    exports.toggleLoader = toggleLoader;

    // --- UI Helpers ---
    exports.ui = {
        /**
         * Enables click-to-select behavior on rows
         * @param {string|HTMLElement} container Selector or Element containing the rows
         * @param {string} itemSelector Selector for the individual rows
         */
        enableRowSelection: (container, itemSelector) => {
            const root = typeof container === 'string' ? document.querySelector(container) : container;
            if (!root) return;

            // Remove existing listeners to prevent duplicates (rudimentary way)
            // Ideally we check if attached, but delegation makes it safe to just re-attach or rely on one-time init.
            // We'll use a simple attribute check
            if (root.hasAttribute('data-row-select-init')) return;
            root.setAttribute('data-row-select-init', 'true');

            function handleSelect(e) {
                const row = e.target.closest(itemSelector);
                if (!row) return;

                // Clear all siblings
                root.querySelectorAll(itemSelector).forEach(r => r.classList.remove('selected'));

                // Select clicked
                row.classList.add('selected');
            }

            root.addEventListener('click', handleSelect);
            root.addEventListener('dblclick', handleSelect); // Redundant but explicit for users ensuring double click works
        }
    };

    // --- Navigation Config ---
    const MENU_CONFIG = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'bi-grid-1x2-fill',
            href: 'index.html',
            items: [
                { id: 'dash_planning', label: 'Planning', icon: 'bi-calendar3', href: 'index.html?view=planning' },
                { id: 'dash_moulding', label: 'Moulding', icon: 'bi-box-seam', href: 'production_dashboard.html' },
                { id: 'dash_shifting', label: 'Shifting', icon: 'bi-arrow-left-right', href: 'index.html?view=shifting' },
                { id: 'dash_packing', label: 'Packing', icon: 'bi-box2-fill', href: 'index.html?view=packing' }
            ]
        },
        {
            id: 'planning',
            label: 'Planning Board',
            icon: 'bi-calendar-week',
            href: 'planning.html',
            items: [
                { id: 'plan_create', label: 'Create Plan', icon: 'bi-plus-circle', href: 'planning.html?action=create' },
                { id: 'plan_orders', label: 'Order View', icon: 'bi-list-task', href: 'planning.html?view=orders' },
                { id: 'plan_master', label: 'Master Plan', icon: 'bi-table', href: 'planning.html?view=master' },
                { id: 'plan_timeline', label: 'Machine Timeline', icon: 'bi-clock-history', href: 'planning.html?view=timeline' },
                { id: 'plan_map', label: 'View Machine Map', icon: 'bi-grid-3x3', href: 'planning.html?view=map' },
                { id: 'plan_orjr', label: 'OR-JR Status', icon: 'bi-file-earmark-text', href: 'masters.html?type=orjr&context=planning' },
                { id: 'plan_mould_summary', label: 'Mould Plan (Summary)', icon: 'bi-file-bar-graph', href: 'masters.html?type=mould_summary&context=planning' },
                { id: 'plan_mould_detail', label: 'Mould Plan (Detail)', icon: 'bi-file-spreadsheet', href: 'masters.html?type=mould_detail&context=planning' },
                { id: 'plan_jcdetail', label: 'JC Detail Report', icon: 'bi-file-text', href: 'masters.html?type=jc_detail&context=planning' },
                { id: 'plan_jcsummary', label: 'JC Summary Report', icon: 'bi-table', href: 'masters.html?type=jc_summary&context=planning' },
                { id: 'plan_print_jc', label: 'Print JobCard', icon: 'bi-printer', href: 'planning.html?view=print_jc' },
                { id: 'master_machine', label: 'Machine Master', icon: 'bi-hdd-rack', href: 'masters.html?type=machines&context=planning' },
                { id: 'master_mould', label: 'Mould Master', icon: 'bi-tools', href: 'masters.html?type=moulds&context=planning' },
                { id: 'plan_completed', label: 'Completed Plans', icon: 'bi-check-circle-fill', href: 'planning.html?view=completed' },
                { id: 'mould_drop', label: 'Mould Drop/Changed', icon: 'bi-exclamation-triangle', href: 'planning.html?view=log' }
            ]
        },
        {
            id: 'analyze',
            label: 'Analyze',
            icon: 'bi-bar-chart-fill',
            href: 'analyze.html',
            items: [
                { id: 'ana_order', label: 'Order Analyze', icon: 'bi-cart', href: 'analyze.html?view=order' },
                { id: 'ana_mould', label: 'Mould Analyze', icon: 'bi-diagram-3', href: 'analyze.html?view=mould' },
                { id: 'ana_sup', label: 'Supervisor Analyze', icon: 'bi-person-badge', href: 'analyze.html?view=supervisor' },
                { id: 'ana_plant', label: 'Plant Analyze', icon: 'bi-building', href: 'analyze.html?view=plant' },
                { id: 'ana_machine', label: 'Machine Analyze', icon: 'bi-cpu', href: 'analyze.html?view=machine' }
            ]
        },
        {
            id: 'dpr',
            label: 'DPR',
            icon: 'bi-file-earmark-bar-graph',
            href: 'dpr.html',
            items: [
                { id: 'dpr_hourly', label: 'DPR Hourly', icon: 'bi-clock-history', href: 'dpr.html?view=hourly' },
                { id: 'dpr_summary', label: 'Compliance Summary', icon: 'bi-calendar-check', href: 'dpr.html?view=summary' },
                { id: 'dpr_setup', label: 'DPR Setup', icon: 'bi-folder-check', href: 'dpr.html?view=setup' },
                { id: 'dpr_settings', label: 'DPR Settings', icon: 'bi-gear', href: 'dpr.html?view=settings' }
            ]
        },
        {
            id: 'purchase',
            label: 'Purchase',
            icon: 'bi-bag-fill',
            href: 'purchase_orders.html',
            items: [
                { id: 'purch_vendors', label: 'Vendor Master', icon: 'bi-person-lines-fill', href: 'purchase_vendors.html' },
                { id: 'purch_orders', label: 'Purchase Orders', icon: 'bi-cart', href: 'purchase_orders.html' },
                { id: 'purch_grn', label: 'GRN / Update', icon: 'bi-check2-square', href: 'purchase_grn.html' },
                { id: 'purch_reports', label: 'Purchase Reports', icon: 'bi-file-earmark-bar-graph', href: 'purchase_reports.html' }
            ]
        },
        {
            id: 'masters',
            label: 'Masters',
            icon: 'bi-database-fill',
            href: 'masters.html',
            items: [
                { id: 'master_order', label: 'Order Master', icon: 'bi-cart-fill', href: 'masters.html?type=orders' },
                { id: 'master_machine', label: 'Machine Master', icon: 'bi-hdd-network', href: 'masters.html?type=machines' },
                { id: 'master_jc_sum', label: 'JC Summary Report', icon: 'bi-file-spreadsheet', href: 'masters.html?type=jc_summary' },
                { id: 'master_jc_detail', label: 'JC Detail Report', icon: 'bi-file-text-fill', href: 'masters.html?type=jc_detail' },
                { id: 'master_orjr', label: 'OR-JR Status Report', icon: 'bi-graph-up', href: 'masters.html?type=orjr' },
                { id: 'master_mould_sum', label: 'Mould Plan (Summary)', icon: 'bi-bar-chart', href: 'masters.html?type=mould_summary' },
                { id: 'master_mould_det', label: 'Mould Plan (Detail)', icon: 'bi-list-columns', href: 'masters.html?type=mould_detail' },
                { id: 'master_mould', label: 'Mould Master', icon: 'bi-gem', href: 'masters.html?type=moulds' },
                { id: 'master_bom', label: 'BOM Master', icon: 'bi-diagram-3-fill', href: 'masters.html?type=bom' },
                { id: 'master_users', label: 'Supervisor & Manager', icon: 'bi-people', href: 'users.html' }
            ]
        },
        {
            id: 'quality',
            label: 'Quality',
            icon: 'bi-check-circle-fill',
            href: 'Quality.html',
            items: [
                { id: 'qc_dash', label: 'QC Dashboard', icon: 'bi-grid-1x2', href: 'Quality.html?view=dashboard' },
                { id: 'qc_comp', label: 'Compliance Summary', icon: 'bi-table', href: 'Quality.html?view=compliance' },
                { id: 'qc_hour', label: 'Quality Hourly', icon: 'bi-clock-history', href: 'Quality.html?view=hourly' },
                { id: 'qc_app', label: 'Supervisor App', icon: 'bi-phone', href: 'QCSupervisor.html' }
            ]
        },
        {
            id: 'hr',
            label: 'HR',
            icon: 'bi-people-fill',
            href: 'hr.html',
            items: [
                { id: 'hr_operators', label: 'Machine Operators', icon: 'bi-person-badge', href: 'hr.html?view=operators' },
                { id: 'hr_scan', label: 'Engineer Scan', icon: 'bi-qr-code-scan', href: 'hr.html?view=scan' },
                { id: 'hr_history', label: 'Scan History', icon: 'bi-clock-history', href: 'hr.html?view=history' }
            ]
        },
        {
            id: 'shifting',
            label: 'Shifting Module',
            icon: 'bi-box-seam',
            href: 'shifting_reports.html',
            items: [
                { id: 'shift_live', label: 'Live Production', icon: 'bi-activity', href: 'shifting_reports.html?view=live' },
                { id: 'shift_reconcile', label: 'Job Reconciliation', icon: 'bi-clipboard-check', href: 'shifting_reports.html?view=reconcile' },
                { id: 'shift_summary', label: 'Shifting Summary', icon: 'bi-table', href: 'shifting_summary.html' },
                { id: 'shift_logs', label: 'Shifting Logs', icon: 'bi-clock-history', href: 'shifting_logs.html' }
            ]
        },
        {
            id: 'wip',
            label: 'WIP Internal',
            icon: 'bi-cone-striped', // Construction/WIP Icon
            href: 'wip.html',
            items: [
                { id: 'wip_appr', label: 'Approvals', icon: 'bi-check-circle', href: 'wip.html?view=approvals' },
                { id: 'wip_stock', label: 'Stock View', icon: 'bi-box-seam', href: 'wip.html?view=stock' },
                { id: 'wip_logs', label: 'Outward Logs', icon: 'bi-journal-text', href: 'wip.html?view=logs' }
            ]
        },
        {
            id: 'users',
            label: 'User Management',
            icon: 'bi-person-gear',
            href: 'users.html',
            items: []
        },
        {
            id: 'notifications',
            label: 'Notifications',
            icon: 'bi-bell',
            href: 'notifications.html',
            items: []
        },
        {
            id: 'joy',
            label: 'Joy Learning',
            icon: 'bi-stars',
            href: 'joy.html',
            items: [
                { id: 'joy_training', label: 'Training Center', icon: 'bi-cpu-fill', href: 'joy.html?view=train' },
                { id: 'joy_brain', label: 'Brain / My Learning', icon: 'bi-memory', href: 'joy.html?view=brain' },
                { id: 'joy_tutorials', label: 'Tutorials', icon: 'bi-book-half', href: 'joy.html?view=tutorials' },
                { id: 'joy_teach', label: 'Teach & Share', icon: 'bi-easel2-fill', href: 'joy.html?view=teach' },
                { id: 'joy_resources', label: 'Resources', icon: 'bi-box-seam-fill', href: 'joy.html?view=resources' },
                { id: 'joy_community', label: 'Community', icon: 'bi-people-fill', href: 'joy.html?view=community' }
            ]
        },
        {
            id: 'grinding',
            label: 'Grinding',
            icon: 'bi-recycle',
            href: 'grinding.html',
            items: [
                { id: 'grind_job', label: 'Job Wise Rejection', icon: 'bi-list-task', href: 'grinding.html?view=job_rejection' }
            ]
        },
        {
            id: 'packing',
            label: 'Packing',
            icon: 'bi-box2-fill',
            href: 'assembly.html',
            items: [
                { id: 'pack_assembly', label: 'Assembly Planning', icon: 'bi-grid-3x3-gap-fill', href: 'assembly.html' },
                { id: 'pack_scan', label: 'Production Scanning', icon: 'bi-upc-scan', href: 'scanning.html' },
                { id: 'pack_scan', label: 'Scanning (List)', icon: 'bi-list-ul', href: 'scanning_list.html' },
                { id: 'pack_scan', label: 'Dashboard', icon: 'bi-speedometer2', href: 'scanning_dashboard.html' },
                { id: 'pack_barcode', label: 'Barcode Print', icon: 'bi-printer', href: 'barcode_printer.html' },
                { id: 'pack_settings', label: 'Settings', icon: 'bi-gear', href: 'packing_settings.html' }
            ]
        }
    ];

    exports.MENU = MENU_CONFIG; // Export for users.html

    // --- Render Sidebar ---
    exports.renderShell = (activePage) => {
        const user = exports.auth.getUser();

        // Prevent double render (idempotency)
        if (document.querySelector('.sidebar')) return;
        console.log('[App] Rendering Shell for:', activePage);

        let navHtml = '';
        const isAdmin = (user.role_code === 'admin');
        const perms = user.permissions || {};

        MENU_CONFIG.forEach(menu => {
            // Check Parent Permission (View)
            // Use .can() to respect Role Fallback
            let canViewParent = false;
            try {
                canViewParent = exports.auth.can(menu.id, 'view');
            } catch (e) { console.warn('Auth Error:', e); }

            if (canViewParent) {
                // Render Items
                let subHtml = '';
                if (menu.items && menu.items.length > 0) {
                    menu.items.forEach(sub => {
                        const canViewSub = exports.auth.can(sub.id, 'view');

                        if (canViewSub) {
                            // Robust Active Check
                            const subPath = sub.href.split('?')[0];
                            const subParams = new URLSearchParams(sub.href.split('?')[1] || '');
                            const currentParams = new URLSearchParams(window.location.search);
                            const currentPath = window.location.pathname.substring(1);

                            let match = (currentPath === subPath);
                            if (match) {
                                for (const [key, val] of subParams.entries()) {
                                    if (currentParams.get(key) !== val) { match = false; break; }
                                }
                            }
                            const subActive = match ? 'active-link' : '';

                            subHtml += `
                            <li>
                                <a href="${sub.href}" target="_self" class="sub-link ${subActive}">
                                    <i class="bi ${sub.icon || 'bi-chevron-right'}" style="font-size:0.9rem; margin-right:6px; opacity:0.8"></i> <span class="nav-text">${sub.label}</span>
                                </a>
                            </li>`;
                        }
                    });
                }

                // Check Matching for Parent Highlighting
                const isParentActive = menu.items?.some(sub => {
                    const subPath = sub.href.split('?')[0];
                    const subParams = new URLSearchParams(sub.href.split('?')[1] || '');
                    const currentParams = new URLSearchParams(window.location.search);
                    const currentPath = window.location.pathname.substring(1);
                    let match = (currentPath === subPath);
                    if (match) {
                        for (const [key, val] of subParams.entries()) {
                            if (currentParams.get(key) !== val) return false;
                        }
                        return true;
                    }
                    return false;
                }) || (menu.id === activePage);

                const hasSub = subHtml.length > 0;

                navHtml += `
                <li class="nav-item ${isParentActive ? 'active' : ''}">
                    <a href="${menu.href}" target="_self" class="nav-link-main">
                        <i class="bi ${menu.icon || 'bi-circle'}"></i> 
                        <span class="nav-text">${menu.label}</span>
                    </a>
                    ${hasSub ? `<ul class="nav-sub">${subHtml}</ul>` : ''}
                </li>`;
            }
        });

        const html = `
      <div class="brand" style="justify-content: space-between; padding: 20px 15px;">
         <div class="brand-logo" style="display:flex; align-items:center;">
             <i class="bi bi-hexagon-fill" style="color:var(--primary); margin-right:10px;"></i> 
             <span>JMS</span>
         </div>
         <i class="bi bi-list" id="sidebar-toggle" style="font-size:1.5rem; color: #94a3b8; cursor:pointer; transition: color 0.2s;"></i>
      </div>
      <ul class="nav-links">
        ${navHtml}
      </ul>
      <div class="user-profile">
        <div style="width:32px;height:32px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;margin-right:10px;">
            ${(user.username || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style="font-weight:600; font-size:0.9rem;">${user.username || 'Guest'}</div>
          <div style="font-size:0.75rem;opacity:0.7;">
            ${user.role || user.role_code || 'Operator'}
            ${localStorage.getItem('jpsms_factory_name') ? ` <span style="font-size:0.65rem; color:#60a5fa">(${localStorage.getItem('jpsms_factory_name')})</span>` : ''}
          </div>
        </div>
        
        <div style="margin-left:auto; display:flex; gap:5px">
             ${(['admin', 'superadmin'].includes(user.role_code)) ? `
            <button onclick="localStorage.removeItem('token'); window.location.href='/login.html'" class="btn btn-outline" style="padding:4px 6px;font-size:1rem;border:none;background:transparent;color:#94a3b8;" title="Switch Factory">
                <i class="bi bi-arrow-repeat"></i>
            </button>` : ''}

            <button onclick="JMS.auth.logout()" class="btn btn-outline" style="padding:4px 6px;font-size:1.2rem;border:none;background:transparent;color:white;" title="Logout">
                <i class="bi bi-box-arrow-right"></i>
            </button>
        </div>
      </div>
    `;

        const sidebar = document.createElement('div');
        sidebar.className = 'sidebar';
        sidebar.innerHTML = html;

        // Restore Collapsed State
        const isCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
            document.body.classList.add('sidebar-collapsed'); // Optional for main content adjustment
        }

        // Toggle Logic
        const toggleBtn = sidebar.querySelector('#sidebar-toggle');
        if (toggleBtn) {
            toggleBtn.onclick = () => {
                sidebar.classList.toggle('collapsed');
                const collapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebar_collapsed', collapsed);

                // Adjust Main Content margin if needed via global class
                if (collapsed) document.body.classList.add('sidebar-collapsed');
                else document.body.classList.remove('sidebar-collapsed');
            };
        }

        /* 
          Note: app.css handles the .collapsed styles:
          - width: 70px
          - hide .brand-logo span, .nav-text, .nav-sub
          - align icons center 
        */

        document.body.prepend(sidebar);

        // Inject Hamburger if Header Exists
        setTimeout(() => {
            const header = document.querySelector('.header');
            if (header && !document.getElementById('sidebarToggle')) {
                const btn = document.createElement('button');
                btn.id = 'sidebarToggle';
                btn.className = 'btn icon';
                btn.style.marginRight = '12px';
                btn.style.background = 'transparent';
                btn.style.border = '1px solid var(--border)';
                btn.style.color = 'var(--text-muted)';
                btn.innerHTML = '<i class="bi bi-list" style="font-size:1.2rem"></i>';
                btn.onclick = exports.toggleSidebar;

                // Insert at start
                header.insertBefore(btn, header.firstChild);
            }
        }, 100);

        // CSS for nested menus (injected here for simplicity, or should be in app.css)
        const style = document.createElement('style');
        style.textContent = `
            .nav-sub { list-style:none; padding-left: 15px; margin-top:5px; margin-bottom:10px; }
            .nav-sub li { margin-bottom: 4px; }
            .sub-link { color: #94a3b8; text-decoration: none; font-size: 0.9rem; display:flex; align-items:center; gap:6px; transition:color 0.2s; }
            .sub-link:hover { color: #fff; }
            .sub-link.active-link { color: #60a5fa !important; font-weight: 700; background: rgba(255,255,255,0.05); border-radius: 4px; padding-left:4px; }
            .nav-item.active .nav-link-main { color: #fff; font-weight: 600; }
        `;
        document.head.appendChild(style);

        let main = document.querySelector('.main-content');
        if (!main) {
            const wrapper = document.createElement('div');
            wrapper.className = 'main-content';
            wrapper.id = 'pageContent';
            while (document.body.childNodes.length > 1) {
                // Move content
                wrapper.appendChild(document.body.childNodes[1]);
            }
            document.body.appendChild(wrapper);
        } else {
            main.id = 'pageContent';
        }
    };

    // --- Notification Helper ---
    function initNotificationBell() {
        const header = document.querySelector('.header');
        if (!header) return;

        // Create container if not exists
        let notifContainer = document.getElementById('notifBellContainer');
        if (!notifContainer) {
            notifContainer = document.createElement('div');
            notifContainer.id = 'notifBellContainer';
            notifContainer.style.cssText = 'position:relative; margin-right:20px; cursor:pointer; display:flex; align-items:center;';
            notifContainer.onclick = () => window.location.href = 'notifications.html';

            notifContainer.innerHTML = `
                <i class="bi bi-bell" style="font-size:1.4rem; color:#64748b;"></i>
                <span id="notifBadge" style="position:absolute; top:-5px; right:-5px; 
                      background:#ef4444; color:white; font-size:0.7rem; font-weight:700; 
                      padding:1px 5px; border-radius:10px; border:2px solid #f8fafc; display:none; min-width:18px; text-align:center;">0</span>
            `;

            // Insert before user-info
            const userInfo = header.querySelector('.user-info');
            if (userInfo) header.insertBefore(notifContainer, userInfo);
            else header.appendChild(notifContainer);
        }

        checkUnread();
    }

    // Poll for notifications
    async function checkUnread() {
        try {
            const user = exports.auth.getUser();
            if (!user || !user.username) return;

            const res = await exports.api.request('/notifications/unread-count?user=' + user.username, { method: 'GET', skipLoader: true });
            if (res.ok) {
                const count = res.count;
                const badge = document.getElementById('notifBadge');
                if (badge) {
                    badge.innerText = count > 99 ? '99+' : count;
                    badge.style.display = count > 0 ? 'inline-block' : 'none';
                }
            }
        } catch (e) { console.error('Notif poll error', e); }
    }

    // Start Polling Global
    setInterval(checkUnread, 30000);

    // Decorate RenderShell to add Bell
    const _originalRender = exports.renderShell;
    exports.renderShell = function (page) {
        _originalRender(page);
        setTimeout(initNotificationBell, 200);
    };

})(window.JMS);
