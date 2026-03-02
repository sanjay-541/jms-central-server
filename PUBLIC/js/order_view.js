/**
 * ORDER VIEW LOGIC
 * Handles fetching, rendering, and interactions for the Order View sub-menu.
 */

window.currentOrderData = [];

// Switch View Hook (called by switchView in planning.html)
window.initOrderView = function () {
    console.log('initOrderView called');
    const con = document.getElementById('orderViewList');
    if (con) {
        con.innerHTML = '<div style="padding:20px; background:#e0f2fe; color:#0369a1; text-align:center; border:1px solid #bae6fd; border-radius:8px">Initializing Order View...</div>';
    } else {
        alert('CRITICAL ERROR: #orderViewList container not found in DOM');
    }
    loadOrderViewData();
};

async function loadOrderViewData() {
    const con = document.getElementById('orderViewList');
    if (!con) return;

    try {
        const api = (window.JMS && window.JMS.api) ? window.JMS.api : window.api;
        if (!api) throw new Error('API Client not found on window.JMS');

        con.innerHTML = '<div style="text-align:center; padding:40px; color:#64748b"><i class="bi bi-hourglass-split me-2 spin"></i> Fetching Data...</div>';

        const res = await api.get('/planning/element-view');
        console.log('Order View API Res:', res);

        if (res.ok && res.data) {
            window.currentOrderData = res.data;
            if (res.data.length === 0) {
                con.innerHTML = '<div style="padding:40px; text-align:center; color:#64748b">API returned 0 orders.</div>';
            } else {
                renderOrderView();
            }
        } else {
            throw new Error(res.error || 'Failed to load data (Unknown Error)');
        }
    } catch (e) {
        console.error(e);
        const msg = e.message || String(e);
        con.innerHTML = `<div class="text-center text-danger p-5" style="border:1px solid red; background:#fff5f5">
            <strong>Error Loading Orders:</strong><br>
            ${msg}
            <br><button class="btn btn-sm btn-outline-danger mt-3" onclick="location.reload()">Reload Page</button>
        </div>`;
    }
}

function renderOrderView() {
    const con = document.getElementById('orderViewList');
    const search = document.getElementById('ovSearch') ? document.getElementById('ovSearch').value.toLowerCase() : '';

    // Filter
    const list = window.currentOrderData.filter(i => {
        if (!i) return false;
        const txt = (i.or_jr_no + ' ' + i.product_name + ' ' + i.item_code).toLowerCase();
        return txt.includes(search);
    });

    if (list.length === 0) {
        con.innerHTML = '<div class="text-center text-muted p-5">No orders found.</div>';
        return;
    }

    let html = '';
    list.forEach(item => {
        const pQty = Number(item.plan_qty) || 0;
        const prod = Number(item.produced_qty) || 0;
        const rej = Number(item.reject_qty) || 0;
        const bal = Number(item.bal_qty) || 0;

        // Progress Calculations
        const pct = pQty > 0 ? Math.min(100, (prod / pQty) * 100) : 0;
        let progressColor = '#3b82f6'; // Blue default
        if (pct >= 100) progressColor = '#10b981'; // Green
        else if (pct > 90) progressColor = '#f59e0b'; // Orange near finish

        // Status Badge Logic
        let statusBadge = '';
        if (bal <= 0 && prod > 0) statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-3">Completed</span>';
        else if (prod > 0) statusBadge = '<span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3">In Progress</span>';
        else statusBadge = '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle rounded-pill px-3">Planned</span>';

        html += `
        <div class="ov-card shadow-sm border rounded-3 mb-3 bg-white" style="transition:all 0.2s ease-in-out; overflow:hidden">
            <!-- HEADER SECTION -->
            <div class="ov-header p-3 cursor-pointer d-flex align-items-center justify-content-between" 
                 onclick="toggleOrderBody('${item.or_jr_no}')" 
                 style="cursor:pointer; background: linear-gradient(to right, #ffffff, #f8fafc)">
                
                <div class="d-flex align-items-center gap-3 overflow-hidden" style="flex:1">
                    <div class="icon-box rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                         style="width:42px; height:42px; background:#eff6ff; color:#2563eb">
                        <i class="bi bi-box-seam fs-5"></i>
                    </div>
                    <div class="text-truncate" style="min-width:0">
                        <div class="fw-bold text-dark text-truncate" style="font-size:1.05rem; letter-spacing:-0.3px">
                            ${item.or_jr_no} <span class="text-muted fw-normal mx-1">|</span> <span class="text-secondary small fw-normal">${item.product_name || 'Unknown Product'}</span>
                        </div>
                        <div class="d-flex align-items-center gap-3 mt-1 small text-muted">
                            <span><i class="bi bi-calendar3 me-1"></i> ${new Date(item.plan_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                            <span>Code: <b>${item.item_code || 'N/A'}</b></span>
                        </div>
                    </div>
                </div>

                <div class="d-flex align-items-center gap-4 flex-shrink-0 ms-3">
                    <!-- Progress Section -->
                    <div class="d-flex flex-column align-items-end" style="min-width:140px">
                        <div class="d-flex justify-content-between w-100 small mb-1 fw-bold">
                            <span class="text-primary">${prod.toLocaleString()}</span>
                            <span class="text-muted">/ ${pQty.toLocaleString()}</span>
                        </div>
                        <div class="progress w-100" style="height:6px; background:#f1f5f9; border-radius:3px">
                            <div class="progress-bar" style="width:${pct}%; background:${progressColor}; border-radius:3px"></div>
                        </div>
                    </div>

                    <!-- Status & Actions -->
                    ${statusBadge}

                    <div class="d-flex gap-1" onclick="event.stopPropagation()">
                        <button class="btn btn-sm btn-light border text-muted" title="View Details" onclick="openOrderDetails('${item.or_jr_no}')">
                            <i class="bi bi-eye-fill"></i>
                        </button>
                        <button class="btn btn-sm btn-light border text-danger hover-bg-danger-subtle" title="Delete" onclick="softDeleteOrder('${item.or_jr_no}')">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                        <button class="btn btn-sm btn-link text-muted p-0 ms-1" onclick="toggleOrderBody('${item.or_jr_no}')">
                            <i class="bi bi-chevron-down" id="arrow-${item.or_jr_no}"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- BODY SECTION (Collapsed by default) -->
            <div class="ov-body collapse" id="ov-body-${item.or_jr_no}" style="background:#f8fafc; border-top:1px solid #e2e8f0; display:none">
                <div class="p-3">
                     <div class="row g-3">
                        <!-- Stats Cards -->
                        <div class="col-md-3">
                            <div class="bg-white p-3 rounded border h-100 text-center">
                                <span class="d-block small text-muted text-uppercase fw-bold mb-1">Balance Qty</span>
                                <h4 class="mb-0 fw-bold text-dark">${bal.toLocaleString()}</h4>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="bg-white p-3 rounded border h-100 text-center">
                                <span class="d-block small text-muted text-uppercase fw-bold mb-1">Reject Qty</span>
                                <h4 class="mb-0 fw-bold text-danger">${rej.toLocaleString()}</h4>
                            </div>
                        </div>
                        
                        <!-- Shift Table -->
                        <div class="col-md-6">
                            <div class="bg-white rounded border overflow-hidden">
                                <div class="px-3 py-2 bg-light border-bottom small fw-bold text-uppercase text-muted">
                                    Production Breakdown
                                </div>
                                <table class="table table-sm table-hover mb-0 small">
                                    <thead class="text-muted"><tr><th class="ps-3">Shift</th><th class="text-end">Good</th><th class="text-end pe-3">Reject</th></tr></thead>
                                    <tbody>
                                        ${(function () {
                if (item.shifts_good) {
                    return Object.keys(item.shifts_good).sort().map(s => {
                        const g = item.shifts_good[s] || 0;
                        const r = (item.shifts_rej && item.shifts_rej[s]) || 0;
                        return `<tr><td class="ps-3 fw-medium text-primary">${s}</td><td class="text-end fw-bold text-dark">${g.toLocaleString()}</td><td class="text-end text-danger pe-3">${r.toLocaleString()}</td></tr>`;
                    }).join('');
                } else {
                    return `<tr><td class="ps-3 text-muted">Total</td><td class="text-end fw-bold text-dark">${prod.toLocaleString()}</td><td class="text-end text-danger pe-3">${rej.toLocaleString()}</td></tr>`;
                }
            })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    });

    con.innerHTML = html;
}

// Helper to toggle body and arrow
window.toggleOrderBody = function (id) {
    const el = document.getElementById(`ov-body-${id}`);
    const arrow = document.getElementById(`arrow-${id}`);
    if (el) {
        const isShow = el.style.display === 'block';
        el.style.display = isShow ? 'none' : 'block';

        if (arrow) {
            if (isShow) arrow.classList.replace('bi-chevron-up', 'bi-chevron-down');
            else arrow.classList.replace('bi-chevron-down', 'bi-chevron-up');
        }
    }
};

// --- ACTIONS ---

async function softDeleteOrder(orNo) {
    if (!confirm(`Are you sure you want to DELETE Order ${orNo}?`)) return;

    try {
        const api = (window.JMS && window.JMS.api) ? window.JMS.api : window.api;
        const res = await api.post('/planning/element-view/soft-delete', { or_jr_no: orNo });
        if (res.ok) {
            // toast('Order deleted successfully', 'success'); // toast might not be defined
            alert('Order deleted successfully');
            loadOrderViewData();
        } else {
            alert('Failed: ' + res.error);
        }
    } catch (e) {
        alert(e.message);
    }
}

// --- DETAILS MODAL ---

window.currentDetails = null;

async function openOrderDetails(orNo) {
    const modal = document.getElementById('mdOrderDetails');
    if (!modal) return;

    document.getElementById('ddTitle').textContent = `Order: ${orNo}`;
    document.getElementById('ddSubtitle').textContent = 'Loading details...';
    document.getElementById('ddMouldList').innerHTML = '<div class="p-3 text-center"><i class="bi bi-arrow-repeat spin"></i></div>';
    document.getElementById('ddContent').innerHTML = '';

    modal.classList.add('show'); // Open Modal - assuming simple CSS class toggle
    // If using Bootstrap Modal:
    // const bsModal = new bootstrap.Modal(modal); bsModal.show(); 
    // But keeping it simple as per existing code

    try {
        const api = (window.JMS && window.JMS.api) ? window.JMS.api : window.api;
        const res = await api.get(`/planning/element-view/details?or_jr_no=${encodeURIComponent(orNo)}`);

        if (res.ok) {
            window.currentDetails = res;
            renderDetailsSidebar(res.moulds);
            document.getElementById('ddSubtitle').textContent = `${res.moulds.length} Moulds found`;

            // Auto Select first
            if (res.moulds.length > 0) {
                selectMould(res.moulds[0].mould_no, 0);
            }
        } else {
            document.getElementById('ddContent').innerHTML = `<div class="text-danger p-3">${res.error}</div>`;
        }
    } catch (e) {
        console.error(e);
        document.getElementById('ddContent').innerHTML = `<div class="text-danger p-3">${e.message}</div>`;
    }
}

function renderDetailsSidebar(moulds) {
    const list = document.getElementById('ddMouldList');
    if (!moulds || !moulds.length) {
        list.innerHTML = '<div class="p-3 text-muted small">No Moulds found for this order.</div>';
        return;
    }

    let html = '';
    moulds.forEach((m, idx) => {
        html += `
        <div class="mould-item" id="mi-${idx}" onclick="selectMould('${m.mould_no}', ${idx})" style="padding:10px; cursor:pointer; border-bottom:1px solid #eee">
            <div class="fw-bold text-truncate" title="${m.mould_name}">${m.mould_name || 'Unknown Mould'}</div>
            <div class="small text-muted">${m.mould_no || '-'}</div>
        </div>
        `;
    });
    list.innerHTML = html;
}

function selectMould(mouldNo, idx) {
    // Highlight
    document.querySelectorAll('.mould-item').forEach(el => el.classList.remove('active')); // Add .active css if needed
    document.querySelectorAll('.mould-item').forEach(el => el.style.background = 'transparent'); // Reset

    const item = document.getElementById(`mi-${idx}`);
    if (item) item.style.background = '#e0f2fe'; // Highlight style

    if (!window.currentDetails) return;
    const { summary, hourly } = window.currentDetails;

    const mouldSummary = (summary || []).filter(s => s.mould_no === mouldNo || !s.mould_no); // Fallback if mould_no null
    const mouldHourly = (hourly || []).filter(h => h.mould_no === mouldNo);

    renderMouldDeepDive(mouldSummary, mouldHourly);
}

function renderMouldDeepDive(summary, hourly) {
    const con = document.getElementById('ddContent');

    // 1. Shift Wise Summary (Clickable)
    let summaryHtml = '';
    if (!summary.length) {
        summaryHtml = '<div class="text-muted p-2">No production data yet.</div>';
    } else {
        summary.forEach(s => {
            summaryHtml += `
            <div class="card mb-2 border-0 shadow-sm">
                <div class="card-body p-2 d-flex justify-content-between align-items-center" 
                     style="cursor:pointer; background:#f8fafc"
                     onclick="toggleShiftDetails('${s.dpr_date}-${s.shift}')">
                    
                    <div>
                        <span class="badge bg-dark me-2">${s.shift}</span>
                        <span class="fw-bold text-dark">${new Date(s.dpr_date).toLocaleDateString()}</span>
                    </div>
                    
                    <div class="d-flex gap-3 text-end">
                        <div class="text-success"><small>Good</small><br><b>${s.good.toLocaleString()}</b></div>
                        <div class="text-danger"><small>Rej</small><br><b>${s.reject.toLocaleString()}</b></div>
                    </div>
                    
                    <i class="bi bi-chevron-down text-muted ms-3"></i>
                </div>
                
                <!-- Expanded Hourly -->
                <div id="sd-${s.dpr_date}-${s.shift}" style="display:none; border-top:1px solid #e2e8f0">
                    ${renderHourlyRows(hourly, s.dpr_date, s.shift)}
                </div>
            </div>
            `;
        });
    }

    con.innerHTML = `
        <h6 class="fw-bold mb-3 border-bottom pb-2">Production Summary</h6>
        ${summaryHtml}
    `;
}

function renderHourlyRows(allHourly, date, shift) {
    // Filter matches
    const entries = allHourly.filter(h => {
        // Date match (string comparison simplified)
        const d1 = new Date(h.dpr_date).toISOString().split('T')[0];
        const d2 = new Date(date).toISOString().split('T')[0];
        return d1 === d2 && h.shift === shift;
    });

    if (!entries.length) return '<div class="p-2 text-muted small">No hourly entries.</div>';

    let rows = '';
    entries.forEach(e => {
        rows += `
        <div class="hourly-row" style="display:flex; padding:8px; border-bottom:1px solid #f1f5f9; align-items:center; font-size:0.9rem">
            <div style="width:60px" class="badge bg-light text-dark border">${e.hour_slot || '-'}</div>
            <div style="flex:1" class="text-truncate ms-2">
                <span class="text-primary fw-bold">${e.colour || 'N/A'}</span>
            </div>
            <div style="width:80px; text-align:right" class="text-success fw-bold">${e.good_qty}</div>
            <div style="width:80px; text-align:right" class="text-danger">${e.reject_qty}</div>
            <div style="width:120px; font-size:0.75rem" class="text-muted ms-2 text-truncate">${e.entered_by || '-'}</div>
        </div>
        `;
    });

    return `<div class="bg-white p-2">${rows}</div>`;
}

function toggleShiftDetails(id) {
    const el = document.getElementById(`sd-${id}`);
    if (el) {
        el.style.display = el.style.display === 'block' ? 'none' : 'block';
    }
}
