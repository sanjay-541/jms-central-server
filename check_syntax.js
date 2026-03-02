
    // --- Boot Routing Logic ---

    window.addEventListener('DOMContentLoaded', async () => {
      // alert('DEBUG: Script started');
      if (!window.JMS || typeof window.JMS.renderShell !== 'function') {
        alert('JMS shell not loaded'); return;
      }
      try {
        const { renderShell, api, toast, store, auth } = window.JMS;

        // Auth Check
        auth.requireAuth();
        if (!auth.can('planning')) {
          toast('Access Denied: Planning', 'error');
          setTimeout(() => window.location.href = 'index.html', 1000);
          return;
        }

        await renderShell("planning");
        // alert('DEBUG: RenderShell finished');


        const me = (store && store.me) || {};
        // app.js renderShell now ensures #pageContent exists
        const root = document.getElementById("pageContent");
        if (!root) {
          console.error('pageContent not found even after renderShell');
          alert('Error: page content not found');
          return;
        }

        // Handle URL Params Logic (Legacy Ported)
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        const view = params.get('view');

        if (action === 'create' && auth.can('plan_create')) {
          // This will be handled by the UI rendering code below / openCreatePlanLauncher
        } else if (action === 'create') {
          toast('Permission Denied: Create Plan', 'error');
        }

        const canEdit = auth.can('planning', 'edit');
        const isSupervisor = (me?.role_code === 'supervisor' || auth.can('dpr_entry'));

        /* ----------------------------- UI ----------------------------- */
        root.innerHTML = `
      <div class="card" style="margin-bottom:12px">
        <div class="card-header">
          <div class="row-flex">
            <i class="bi bi-calendar-check"></i>
            <strong>Planning</strong>
            <span class="chip">Queue-first · No shifts</span>
            <span class="chip" id="roleChip">${me?.role_code || '-'}</span>
          </div>
          <div class="row-flex">
            <button class="btn primary" id="btnCreatePlan"><i class="bi bi-plus-circle"></i> Create Plan</button>
            <button class="btn" id="btnToggleMap"><i class="bi bi-map"></i> View Machine Map</button>
          </div>
        </div>

        <div class="card-body">
          <div class="kpi-deck">
            ${kpiCard('bi-bag', 'Pending Orders', 'pending')}
            ${kpiCard('bi-gear-wide-connected', 'In-Progress (Moulding)', 'inprog')}
            ${kpiCard('bi-calendar2-x', 'OR vs WH (>3%)', 'variance')}
            ${kpiCard('bi-calendar-event', 'Upcoming (7d)', 'upcoming')}
          </div>

          <div class="toolbar">
            <div class="row-flex">
              <div class="search"><i class="bi bi-search"></i><input id="machineSearch" placeholder="Search machine (code/name)" aria-label="Search machines"/></div>
              <select id="buildingFilter" class="input" style="width:180px" aria-label="Filter by building">
                <option value="">All Buildings</option>
                <option>B</option><option>C</option><option>E</option><option>F</option>
              </select>
              <div class="legend mini">
                <span class="chip b">Unplanned</span>
                <span class="chip g">Running</span>
                <span class="chip r">Stopped/Off</span>
                <span class="chip y">Maintenance</span>
              </div>
            </div>
            <div class="row-flex" style="display: ${canEdit ? 'flex' : 'none'}">
              <button class="btn" id="btnBalance"><i class="bi bi-shuffle"></i> Balance Load</button>
              <button class="btn" id="btnAutoP1"><i class="bi bi-lightning-charge"></i> Auto-Assign P1</button>
              <div style="width:1px; background:var(--border); margin:0 8px"></div>
              <button class="btn primary" id="btnAiOptimize" style="background:#8b5cf6; border-color:#7c3aed">
                  <i class="bi bi-stars"></i> Magic Optimize
              </button>
            </div>
          </div>

          <div class="map-wrap" id="mapWrap" aria-expanded="false">
            <div class="map-head">
              <div class="row-flex">
                <strong>Machine Map</strong>
                <span class="chip">Building Wise</span>
                <span class="demo-badge" id="demoBadge" style="display:none"><i class="bi bi-bug"></i> Demo data</span>
              </div>
              <div class="map-actions">
                <label class="small-muted">Horizon</label>
                <div class="days-filter" id="horizonDays">
                  ${[1, 2, 3, 4, 5, 6, 7, 8].map(d => `<span class="chip select" data-day="${d}" role="button" tabindex="0" aria-pressed="false">${d}d</span>`).join("")}
                </div>
                <div style="width:8px"></div>
                <label class="small-muted">Show Off / Maintenance</label>
                <label class="chip select" id="toggleInactive" role="button" title="Include Off & Maintenance">
                  <i class="bi bi-power"></i> Toggle
                </label>
              </div>
            </div>
            <div id="machineGrid"></div>
          </div>

          <!-- Master Plan View -->
          <div id="masterView" style="display:none; margin-top:20px;">
            <div class="toolbar" style="background:var(--card); padding:10px; border:1px solid var(--border); border-radius:10px; margin-bottom:12px">
              <div class="row-flex">
                <strong><i class="bi bi-table"></i> Master Plan</strong>
                <div style="width:20px"></div>
                <div class="search"><i class="bi bi-search"></i><input id="masterSearch" placeholder="Search (OR, Item, Machine, Any...)" aria-label="Search Master Plan"/></div>
                 <select id="masterBuilding" class="input" style="width:140px" aria-label="Filter by building">
                  <option value="">All Buildings</option>
                  <option>B</option><option>C</option><option>E</option><option>F</option>
                </select>
                <button class="btn" id="btnRefreshMaster"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
              </div>
              <div class="row-flex">
                 <button class="btn primary" id="btnMasterCreate"><i class="bi bi-plus-circle"></i> Create Plan</button>
              </div>
            </div>
            
            <div class="list" id="masterTableContainer">
               <div class="row h" style="grid-template-columns: 80px 60px 50px 50px 80px 140px 1fr 80px 100px 100px 100px;">
                 <div>Machine</div><div>Bldg</div><div>Line</div><div>Seq</div><div>Priority</div><div>OR No</div><div>Item</div><div>Qty</div><div>Start</div><div>End</div><div>Status</div>
               </div>
               <div id="masterTableBody"></div>
            </div>
            <div class="muted mini" style="margin-top:8px">Showing all scheduled plans. Use filters to narrow down.</div>
          </div>
        </div>
      </div>

      <!-- Timeline View -->
      <div id="timelineView" style="display:none; padding-bottom:100px;">
        <div class="toolbar glass">
            <div class="title">Machine Timeline</div>
            <div class="actions">
               <button class="btn" onclick="loadTimeline()"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
            </div>
        </div>
        <div id="timelineContainer" class="timeline-container">
           <!-- Rows will go here -->
        </div>
      </div>

  <!-- =========================
       NEW CREATE PLAN MODAL (Replaces Old Launcher)
       ========================= -->
  <div id="newCreatePlanModal" class="modal" aria-hidden="true" style="align-items: flex-start; padding-top: 50px;">
    <div class="modal-card"
      style="width: 1100px; max-width: 95vw; height: 85vh; display: flex; flex-direction: column;">

      <div class="modal-head">
        <div style="font-weight:700; font-size:1.1rem"><i class="bi bi-calendar-plus"
            style="margin-right:8px; color:var(--info)"></i> Create Production Plan</div>
        <div style="display:flex; gap:10px">
          <div class="search" style="width:250px">
            <i class="bi bi-search"></i>
            <input type="text" id="cpOrderSearch" placeholder="Search Orders..." style="width:100%">
          </div>
          <button class="btn icon ghost" id="cpClose"><i class="bi bi-x-lg"></i></button>
        </div>
      </div>

      <div class="modal-body" style="flex:1; display:flex; gap:0; padding:0; overflow:hidden">

        <!-- LEFT: Orders List -->
        <div
          style="width: 380px; border-right: 1px solid var(--border); display:flex; flex-direction:column; background: #f8fafc;">
          <div
            style="padding:10px 14px; font-weight:700; color:#64748b; font-size:0.85rem; border-bottom:1px solid var(--border); background:#fff">
            PENDING ORDERS
          </div>
          <div id="cpOrderList" style="flex:1; overflow-y:auto; padding:0;">
            <!-- Items injected here -->
            <div style="padding:20px; text-align:center" class="muted">Loading...</div>
          </div>
        </div>

        <!-- RIGHT: Details & Planning -->
        <div style="flex:1; display:flex; flex-direction:column; padding:0; background:#fff">

          <!-- Empty State -->
          <div id="cpEmptyState"
            style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#94a3b8">
            <i class="bi bi-arrow-left-circle" style="font-size:3rem; margin-bottom:10px; opacity:0.5"></i>
            <div>Select an Order to start planning</div>
          </div>

          <!-- Content State -->
          <div id="cpDetailContent" style="display:none; flex:1; flex-direction:column; overflow-y:auto">

            <!-- Order Header -->
            <div style="padding:15px; border-bottom:1px solid var(--border); background:#fff">
              <div style="font-size:1.2rem; font-weight:800; color:#1e293b" id="cpTitleOrderNo"></div>
              <div style="color:#64748b" id="cpTitleProduct"></div>
            </div>

            <!-- Moulds List -->
            <div style="padding:15px">
              <div style="font-weight:700; color:#475569; margin-bottom:10px">AVAILABLE MOULDS</div>
              <div id="cpMouldList" style="display:flex; flex-direction:column; gap:10px">
                <!-- Mould Cards -->
              </div>
            </div>

            <!-- Machine Selector (Dynamic) -->
            <div id="cpMachineSection"
              style="padding:15px; border-top:1px solid var(--border); background:#fdfdfd; display:none">
              <div style="font-weight:700; color:#475569; margin-bottom:10px">SELECT MACHINE</div>

              <div style="margin-bottom:10px; font-size:0.9rem">
                Target Tonnage: <span id="cpTargetTonnage" class="tag"
                  style="border-color:#3b82f6; color:#2563eb; background:#eff6ff"></span>
              </div>

              <div id="cpMachineList"
                style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:10px">
                <!-- Machines -->
              </div>
            </div>

          </div>

        </div>
      </div>

      <div class="modal-actions">
        <div style="margin-right:auto; font-size:0.9rem; color:#64748b" id="cpFooterStatus"></div>
        <button class="btn ghost" id="cpCancelBtn">Cancel</button>
        <button class="btn primary" id="cpSaveBtn" disabled>
          <i class="bi bi-check2-circle"></i> Create Plan
        </button>
      </div>

    </div>
  </div>

      <!-- Preview Modal (Balance / Auto-P1) -->
      <div class="modal" id="previewModal" aria-hidden="true">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="pmTitle">
          <div class="modal-head">
            <div class="row-flex"><i class="bi bi-eye"></i><strong id="pmTitle">Preview</strong></div>
            <button class="btn" id="pmClose" aria-label="Close"><i class="bi bi-x"></i></button>
          </div>
          <div class="modal-body">
            <div class="muted mini" id="pmSub">—</div>
            <div class="list" id="pmList" style="margin-top:8px">
              <div class="row h"><div>#</div><div>Machine</div><div>Orders (proposed)</div><div>Building</div><div>Line</div><div>Count</div></div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn ghost" id="pmCancel">Cancel</button>
            <button class="btn primary" id="pmCommit"><i class="bi bi-check2-square"></i> Commit</button>
          </div>
        </div>
      </div>

      <!-- Side sheet (legacy detailed queueing) -->
      <div class="sheet" id="planSheet" aria-hidden="true">
        <div class="sheet-card">
          <div class="sheet-head">
            <div class="row-flex">
              <i class="bi bi-list-check"></i><strong>Plan Queue</strong>
              <span class="chip" id="selMachineChip" style="display:none"></span>
            </div>
            <button class="btn" id="btnCloseSheet" title="Close"><i class="bi bi-x"></i></button>
          </div>
          <div class="sheet-body">
            <div class="row-flex" style="margin-bottom:10px">
              <div class="search"><i class="bi bi-search"></i><input id="ordersSearch" placeholder="Search orders (order no, item, mould)" aria-label="Search orders"/></div>
              <label class="chip select" id="btnSameMould"><i class="bi bi-layers"></i> Same mould</label>
              <label class="chip select" id="btnRefreshOrders"><i class="bi bi-arrow-clockwise"></i> Refresh</label>
            </div>

            <div class="list" id="ordersList">
              <div class="row h">
                <div>✓</div><div>Priority</div><div>Order • Item</div><div>Mould</div><div>Qty</div><div>Age</div>
              </div>
            </div>
            <div class="muted mini" style="margin-top:8px">Queue-first: no dates/shifts — jobs auto-start when the previous job completes.</div>
          </div>
          <div class="sheet-actions">
            <button class="btn primary" id="btnQueueSelected"><i class="bi bi-check2-circle"></i> Queue Selected</button>
          </div>
        </div>
      </div>

      <!-- Machine hover dialog -->
      <div id="hoverCard" class="hover-card" role="dialog" aria-modal="false">
        <div class="hdr">
          <div class="t" id="hcTitle">Machine</div>
          <button class="x" id="hcClose" title="Close dialog"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="r" id="hcLine">—</div>
        <div class="r" id="hcStatus">Status: —</div>
        <div class="r" id="hcJob">Job: —</div>
        <div class="r" id="hcQueue">Queue: —</div>
        <div class="r" id="hcIssue" style="display:none"></div>
        <div class="bar"></div>
        <div class="actions">
          ${canEdit ? `<button class="btn" id="hcPlanBtn" title="Create plan here"><i class="bi bi-plus-circle"></i> Create Plan</button>` : ''}
        </div>
      </div>
    `;

        /* ---------- helpers to render KPI cards with spark ---------- */
        function kpiCard(icon, label, key) {
          return `
        <div class="kpi-card" data-k="${key}">
          <div class="ico"><i class="bi ${icon}"></i></div>
          <div class="txt">
            <div class="t">${label}</div>
            <div class="v" id="kpi_${key}">—</div>
          </div>
          <div class="right">
            <canvas class="spark" id="spark_${key}" width="120" height="24"></canvas>
            <div class="delta" id="delta_${key}">—</div>
          </div>
        </div>`;
        }
        function setKpi(key, v, deltaPct, trend) {
          const el = document.getElementById('kpi_' + key); if (el) el.textContent = v;
          const d = document.getElementById('delta_' + key);
          if (d) {
            const up = (deltaPct || 0) >= 0;
            d.className = 'delta ' + (up ? 'up' : 'down');
            d.textContent = (up ? '+' : '') + (deltaPct || 0) + '% vs last';
          }
          if (trend) drawSpark('spark_' + key, trend);
        }
        function drawSpark(id, arr) {
          try {
            const c = document.getElementById(id); if (!c) return;
            const ctx = c.getContext('2d'); const w = c.width, h = c.height;
            ctx.clearRect(0, 0, w, h);
            const max = Math.max(...arr), min = Math.min(...arr);
            const norm = (v) => h - ((v - min) / (max - min || 1)) * h;
            ctx.lineWidth = 1.5; ctx.beginPath();
            arr.forEach((v, i) => { const x = (w / (arr.length - 1)) * i; const y = norm(v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
            ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand') || '#60a5fa';
            ctx.stroke();
          } catch { }
        }

        /* --------------------------- Helpers & Init --------------------------- */
        // 'api' is already in scope from line 1127



        // Global State
        let cpOrders = [];
        let cpSelectedOrder = null;
        let cpSelectedMould = null;
        let cpSelectedMachine = null;
        let allMachines = [];
        let allMasterPlans = [];
        let lastMachines = [];
        let lastOrders = [];
        let lastPreviewAssignments = [];
        let previewMode = 'balance';
        let horizon = 7;
        let showInactive = false;
        let selectedMachine = null;
        let dialogPinned = false;

        // Logic runs immediately as we are already in DOMContentLoaded

        api.get('/planning/kpis').then(res => {
          if (res && res.data) {
            const k = res.data;
            if (document.getElementById('kpiPending')) document.getElementById('kpiPending').textContent = k.pendingOrders || 0;
            if (document.getElementById('kpiInProgress')) document.getElementById('kpiInProgress').textContent = k.inProgress || 0;
          }
        }).catch(e => console.error('KPI Load Error:', e));

        /* ------------------ View Routing ------------------ */
        if (view === 'master') {
          document.querySelector('.kpi-deck').style.display = 'none';
          document.getElementById('mapWrap').style.display = 'none';
          document.querySelector('.toolbar').style.display = 'none';
          document.getElementById('masterView').style.display = 'block';
          loadMasterPlan();
        } else if (view === 'timeline') {
          document.querySelector('.kpi-deck').style.display = 'none';
          document.getElementById('mapWrap').style.display = 'none';
          document.querySelector('.toolbar').style.display = 'none';
          document.getElementById('timelineView').style.display = 'block';
          loadTimeline();
        } else {
          // Default Map View
          loadMachines();
          // Start Auto-Refresh for Map
          setInterval(loadMachines, 30000);
        }

        if (action === 'create') openCreatePlanLauncher();

        // Toggle map
        document.getElementById('btnToggleMap').addEventListener('click', () => {
          const wrap = document.getElementById('mapWrap');
          const nowOpen = (!wrap.style.display || wrap.style.display === 'none');
          wrap.style.display = nowOpen ? 'block' : 'none';
          wrap.setAttribute('aria-expanded', String(nowOpen));
          if (nowOpen && !lastMachines.length) loadMachines();
          document.getElementById('btnToggleMap').innerHTML =
            nowOpen ? '<i class="bi bi-eye-slash"></i> Hide Machine Map' : '<i class="bi bi-map"></i> View Machine Map';
          toast(nowOpen ? 'Map View' : 'Hidden Map');
        });

        // Horizon & inactive
        document.querySelectorAll('#horizonDays .chip').forEach(chip => {
          if (Number(chip.dataset.day) === horizon) chip.classList.add('active');
          chip.addEventListener('click', () => {
            document.querySelectorAll('#horizonDays .chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active'); horizon = Number(chip.dataset.day) || 1; loadMachines();
          });
          chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') chip.click(); });
        });
        document.getElementById('toggleInactive').addEventListener('click', () => {
          showInactive = !showInactive;
          document.getElementById('toggleInactive').classList.toggle('active', showInactive);
          renderFilteredGrid();
        });

        // Filters
        document.getElementById('buildingFilter').addEventListener('change', renderFilteredGrid);
        document.getElementById('machineSearch').addEventListener('input', renderFilteredGrid);

        // Factory scope change → refresh map if open
        document.addEventListener('factory:change', () => {
          if (document.getElementById('mapWrap').style.display === 'block') loadMachines();
        });

        // Create Plan entry
        document.getElementById('btnCreatePlan').addEventListener('click', openCreatePlanLauncher);

        // Balance + AutoP1
        document.getElementById('btnBalance').addEventListener('click', balanceLoad);
        document.getElementById('btnAutoP1').addEventListener('click', autoAssignP1);

        // Sheet (legacy plan editor)
        const planSheet = document.getElementById('planSheet');
        document.getElementById('btnCloseSheet').onclick = () => planSheet.style.display = 'none';
        document.getElementById('btnRefreshOrders').onclick = loadPendingOrders;
        document.getElementById('btnQueueSelected').onclick = queueSelected;
        document.getElementById('btnSameMould').onclick = selectSameMould;
        document.getElementById('ordersSearch').addEventListener('input', (e) => renderOrdersList(filterOrders(e.target.value)));

        // Machine hover dialog
        const hc = document.getElementById('hoverCard');
        document.getElementById('hcPlanBtn').addEventListener('click', () => {
          if (!selectedMachine) return;
          if (isSupervisor && (selectedMachine.is_maintenance || ['off', 'stopped'].includes((selectedMachine.status || '').toLowerCase()))) {
            return toast('Supervisor: cannot plan on maintenance/off machine');
          }
          openPlanSheet();
        });
        document.getElementById('hcClose').addEventListener('click', hideHover);
        hc.addEventListener('mouseenter', () => { dialogPinned = true; });
        hc.addEventListener('mouseleave', () => { dialogPinned = false; });

        /* ---------------------- KPIs ---------------------- */
        async function loadKPIs() {
          try {
            const k = await api.get('/planning/kpis');
            setKpi('pending', k.total_pending_orders, +k.pending_delta_pct || 0, k.pending_trend || [4, 5, 6, 6, 7, 5, 4]);
            setKpi('inprog', k.in_progress_moulding, +k.inprog_delta_pct || 0, k.inprog_trend || [2, 3, 3, 4, 5, 5, 5]);
            setKpi('variance', k.date_variance_above_3pct, +k.variance_delta_pct || -2, k.variance_trend || [3, 3, 2, 2, 1, 2, 2]);
            setKpi('upcoming', k.total_upcoming_orders, +k.upcoming_delta_pct || 1, k.upcoming_trend || [6, 6, 7, 8, 7, 7, 9]);

            // If data is real (not demo), hide demo badge if it was showing
            const demo = document.getElementById('demoBadge');
            if (demo && k && !k.is_demo) demo.style.display = 'none';

          } catch {
            // Fallback to zeros on error, NO DEMO DATA
            setKpi('pending', 0, 0, []);
            setKpi('inprog', 0, 0, []);
            setKpi('variance', 0, 0, []);
            setKpi('upcoming', 0, 0, []);
            const demo = document.getElementById('demoBadge'); if (demo) demo.style.display = 'none';
          }
        }

        /* ------------------ Timeline Logic ------------------ */
        async function loadTimeline() {
          const con = document.getElementById('timelineContainer');
          con.innerHTML = '<div style="padding:20px; text-align:center">Loading timeline...</div>';

          try {
            // 1. Fetch Machines
            const mRes = await api.get('/machines/status');
            const machines = (mRes && mRes.data) ? mRes.data : [];

            // 2. Fetch Plans
            const pRes = await api.get('/planning/board');
            const plans = (pRes && pRes.data && pRes.data.plans) ? pRes.data.plans : [];

            // 3. Group
            const groups = {};
            machines.forEach(m => groups[m.code] = []); // Init
            plans.forEach(p => {
              if (groups[p.machine]) groups[p.machine].push(p);
              // fallback if machine not in list?
              else { groups[p.machine] = [p]; }
            });

            con.innerHTML = '';

            // Render
            // Sort machines by building, then line
            machines.sort((a, b) => (a.building || '').localeCompare(b.building || '') || (a.line || '').localeCompare(b.line || ''));

            machines.forEach(m => {
              const mPlans = groups[m.code] || [];
              mPlans.sort((a, b) => a.seq - b.seq);

              const row = document.createElement('div');
              row.className = 'timeline-row';

              // Cards HTML
              const cardsHtml = mPlans.map(p => {
                let sClass = '';
                const st = (p.status || '').toLowerCase();
                if (st === 'running') sClass = 'running';
                else if (st === 'completed') sClass = 'completed';
                else if (st === 'stopped') sClass = 'stopped';

                return `
                      <div class="timeline-card ${sClass}" title="Order: ${p.orderNo}\nItem: ${p.itemName}\nQty: ${p.planQty}">
                          <div class="head">${p.orderNo}</div>
                          <div class="info">${p.itemName}</div>
                          <div class="meta">${p.planQty.toLocaleString()} • ${st}</div>
                      </div>`;
              }).join('');

              const emptyHtml = mPlans.length === 0 ? '<div class="timeline-empty">No plans queued</div>' : '';

              const displayName = m.code.includes('>') ? m.code.split('>').pop().trim() : m.code;

              row.innerHTML = `
                    <div class="timeline-header">
                        <div class="name">${displayName}</div>
                        <div class="sub">${m.building} - L${m.line}</div>
                    </div>
                    <div class="timeline-track">
                        ${cardsHtml}
                        ${emptyHtml}
                    </div>
                  `;
              con.appendChild(row);
            });

          } catch (e) {
            con.innerHTML = `<div class="error">Error: ${e.message}</div>`;
          }
        }

        /* -------------------- Machines Map -------------------- */
        async function loadMachines() {
          const grid = document.getElementById('machineGrid');
          grid.innerHTML = `<div class="line-row"><div class="line-title">Loading machines…</div></div>`;
          try {
            const url = `/machines/status?days=${horizon}${showInactive ? '&show_inactive=1' : ''}`;
            const list = await api.get(url);
            lastMachines = (list && list.data ? list.data : list || []).map(m => Object.assign({ queue_preview: [] }, m));
            renderFilteredGrid();
          } catch (e) {
            grid.innerHTML = `<div class="muted" style="padding:20px; color:var(--bad)">Failed to load machines: ${esc(e.message)}</div>`;
            const demo = document.getElementById('demoBadge'); if (demo) demo.style.display = 'none';
          }
        }

        function renderFilteredGrid() {
          const grid = document.getElementById('machineGrid');
          const b = document.getElementById('buildingFilter').value;
          const q = (document.getElementById('machineSearch').value || '').toLowerCase().trim();

          let list = lastMachines.slice();
          if (b) list = list.filter(x => String(x.building).toUpperCase() === b);
          if (q) list = list.filter(x => (x.code + ' ' + x.name).toLowerCase().includes(q));
          if (!showInactive) list = list.filter(x => !x.is_maintenance && (x.is_active !== false || (x.status || '').toLowerCase() !== 'off'));

          renderMachineGrid(list);
        }

        function renderMachineGrid(list) {
          const byB = groupBy(list, x => x.building || 'B');
          const grid = document.getElementById('machineGrid');
          grid.innerHTML = '';

          if (Object.keys(byB).length === 0) {
            grid.innerHTML = `<div class="muted" style="padding:20px">No machines found matching filters.</div>`;
            return;
          }

          Object.keys(byB).sort().forEach(building => {
            const lines = groupBy(byB[building], x => String(x.line || '1'));
            const section = document.createElement('div');
            section.className = 'line-row';

            const header = document.createElement('div');
            header.className = 'line-title';
            header.textContent = `Building ${building}`;
            section.appendChild(header);

            Object.keys(lines).sort((a, b) => Number(a) - Number(b)).forEach(line => {
              const wrap = document.createElement('div'); wrap.style.marginBottom = '8px';
              const title = document.createElement('div'); title.className = 'line-title'; title.textContent = `Line ${line}`;
              const row = document.createElement('div'); row.className = 'machine-row';
              lines[line].forEach(m => row.appendChild(machineSeat(m)));
              wrap.appendChild(title);
              wrap.appendChild(row);
              section.appendChild(wrap);
            });

            grid.appendChild(section);
          });
        }

        function machineSeat(m) {
          const sClass = cssStatus(m);
          // Robust Full Name Cleaning
          let displayName = esc(m.code);
          if (displayName.includes('>')) {
            displayName = displayName.split('>').pop().trim();
          }

          // Active Info (Line 2)
          const activeText = m.running_order ? esc(m.running_order) : prettyStatus(m);

          const btn = document.createElement('button');
          btn.className = `machine ${sClass}`;
          btn.title = `${m.code} - ${activeText}`;
          if (m.running_order) btn.title += ` (Running: ${m.running_order})`;

          btn.innerHTML = `
        <div class="name">${displayName}</div>
        <div class="sub">${activeText}</div>
        `;

          btn.addEventListener('mouseenter', (ev) => showHover(ev, m, false));
          btn.addEventListener('mousemove', (ev) => moveHover(ev));
          btn.addEventListener('mouseleave', () => { if (!dialogPinned) hideHover(); });
          btn.addEventListener('click', async (ev) => {
            ev.stopPropagation();
            await showHover(ev, m, true);
          });
          return btn;
        }

        function cssStatus(m) {
          const s = (m.status || '').toLowerCase();
          if (m.is_maintenance || s === 'maintenance') return 's-maint';
          if (s === 'running') return 's-running';
          if (s === 'stopped' || s === 'off') return 's-stopped';
          return 's-unplanned';
        }
        function prettyStatus(m) {
          if (m.is_maintenance) return 'Under Maintenance';
          switch ((m.status || '').toLowerCase()) {
            case 'running': return 'Running';
            case 'stopped': return m.is_active ? 'Stopped' : 'Off';
            case 'off': return 'Off';
            case 'maintenance': return 'Maintenance';
            default: return 'Unplanned';
          }
        }
        function groupBy(arr, keyFn) { const out = {}; (arr || []).forEach(x => { const k = keyFn(x); (out[k] = out[k] || []).push(x) }); return out; }

        /* ---------------------- Orders sheet (legacy) ---------------------- */
        function openPlanSheet() {
          const chip = document.getElementById('selMachineChip');
          if (selectedMachine) { chip.style.display = ''; chip.textContent = `${selectedMachine.code} • ${selectedMachine.name} `; }
          else { chip.style.display = 'none'; }
          document.getElementById('planSheet').style.display = 'block';
          loadPendingOrders();
        }

        async function loadPendingOrders() {
          const listEl = document.getElementById('ordersList');
          injectOrdersSkeleton(listEl);
          try {
            let orders;
            try { orders = await api.get('/orders/pending?unplanned=1'); }
            catch { orders = await api.get('/orders?status=Pending'); }
            lastOrders = normalizeOrders(orders);
            renderOrdersList(lastOrders);
          } catch (e) {
            listEl.innerHTML = `<div style="padding:10px; color:var(--bad)">Failed to load orders: ${esc(e.message)}</div>`;
            const demo = document.getElementById('demoBadge'); if (demo) demo.style.display = 'none';
          }
        }
        function normalizeOrders(arr) {
          return (arr || []).map(o => ({
            id: o.id, order_no: o.order_no || o.orderNo || `ORD - ${o.id} `,
            item_name: o.item_name || o.item || 'Item',
            mould_id: o.mould_id || o.mouldId || null,
            mould_code: o.mould_code || o.mouldCode || (o.mould_id ? ('M-' + o.mould_id) : '-'),
            qty: Number(o.qty || o.quantity || 0),
            priority: o.priority || o.pri || 'Normal',
            age_days: o.age_days != null ? o.age_days : (Math.floor(Math.random() * 10) + 1)
          }));
        }
        function injectOrdersSkeleton(el) {
          while (el.children.length > 1) el.removeChild(el.lastChild);
          for (let i = 0; i < 6; i++) {
            const r = document.createElement('div'); r.className = 'row';
            r.innerHTML = `<div><input type="checkbox" disabled></div>
          <div class="muted">—</div><div class="muted">Loading…</div>
          <div class="muted">—</div><div class="muted">—</div><div class="muted">—</div>`;
            el.appendChild(r);
          }
        }
        function renderOrdersList(rows) {
          const el = document.getElementById('ordersList'); while (el.children.length > 1) el.removeChild(el.lastChild);
          rows.forEach(o => {
            const r = document.createElement('div'); r.className = 'row'; r.dataset.id = o.id;
            const priClass = (o.priority || 'Normal');
            r.innerHTML = `
            <div><input type="checkbox" class="ck" /></div>
          <div><span class="tag ${esc(priClass)}">${esc(o.priority)}</span></div>
          <div><strong>${esc(o.order_no)}</strong> • <span class="muted">${esc(o.item_name)}</span></div>
          <div>${esc(o.mould_code || '-')}</div>
          <div>${o.qty.toLocaleString()}</div>
          <div>${o.age_days}d</div>`;
            el.appendChild(r);
          });
        }
        function filterOrders(q) {
          q = (q || '').toLowerCase().trim(); if (!q) return lastOrders;
          return lastOrders.filter(o => (`${o.order_no} ${o.item_name} ${o.mould_code} `.toLowerCase().includes(q)));
        }
        function selectedOrderIds(containerSel = '#ordersList') {
          const ids = []; document.querySelectorAll(`${containerSel} .row`).forEach(r => { const ck = r.querySelector('.ck'); if (ck && ck.checked) ids.push(Number(r.dataset.id)); });
          return ids;
        }
        function selectSameMould() {
          const ids = selectedOrderIds(); if (!ids.length) return toast('Select one order first');
          const first = lastOrders.find(o => o.id === ids[0]); if (!first || !first.mould_code) return toast('Selected order has no mould');
          document.querySelectorAll('#ordersList .row').forEach(r => {
            const id = Number(r.dataset.id); const o = lastOrders.find(x => x.id === id);
            if (o && o.mould_code === first.mould_code) { const ck = r.querySelector('.ck'); if (ck) ck.checked = true; }
          });
        }
        async function queueSelected() {
          if (!selectedMachine) return toast('Select a machine first');
          const ids = selectedOrderIds(); if (!ids.length) return toast('Select at least one order');

          if (isSupervisor && (selectedMachine.is_maintenance || ['off'].includes((selectedMachine.status || '').toLowerCase()))) {
            return toast('Supervisor: cannot plan on maintenance/off machine');
          }

          try {
            const out = await api.post('/planning/queue', { machine_id: selectedMachine.id, order_ids: ids, remarks: null });
            toast(out?.message || 'Queued');
            document.getElementById('planSheet').style.display = 'none';
            await loadMachines();
          } catch (e) { toast(e?.message || 'Failed to queue'); }
        }

        /* ------------------ Create Plan Launcher ------------------ */



        function openCreatePlanLauncher() {
          console.log('Opening Create Plan Modal...');

          // Verify DOM elements exist
          if (!document.getElementById('newCreatePlanModal')) {
            return alert('Error: Modal HTML not found. Please refresh.');
          }

          openModal('newCreatePlanModal');
          loadCpOrders();
        }

        // --- Helpers for Create Plan ---

        async function loadCpOrders() {
          const list = document.getElementById('cpOrderList');
          if (!list) return;
          list.innerHTML = '<div style="padding:20px;text-align:center" class="muted">Loading Pending Orders...</div>';
          try {
            const res = await api.get('/planning/orders/pending');
            cpOrders = res && res.data ? res.data : [];
            renderCpOrders();
          } catch (e) {
            list.innerHTML = `<div class="error" style="padding:20px">Error: ${esc(e.message)}</div>`;
          }
        }

        function renderCpOrders(filter = '') {
          const list = document.getElementById('cpOrderList');
          if (!list) return;
          list.innerHTML = '';

          const q = filter.toLowerCase();
          const visible = cpOrders.filter(o =>
            (o.orderNo || '').toLowerCase().includes(q) ||
            (o.productName || '').toLowerCase().includes(q)
          );

          if (!visible.length) {
            list.innerHTML = '<div style="padding:20px;text-align:center" class="muted">No orders found.</div>';
            return;
          }

          visible.forEach(o => {
            const el = document.createElement('div');
            el.className = 'cp-order-item';
            el.style.padding = '12px 14px';
            el.style.borderBottom = '1px solid #f1f5f9';
            el.style.cursor = 'pointer';
            el.style.transition = 'background 0.1s';

            el.innerHTML = `
                   <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                      <div style="font-weight:700; color:#334155">${esc(o.orderNo)}</div>
                      <div class="tag small">${esc(o.status || 'Pending')}</div>
                   </div>
                   <div style="font-size:0.85rem; color:#64748b; line-height:1.2">${esc(o.productName)}</div>
                   <div style="font-size:0.8rem; color:#94a3b8; margin-top:4px">Qty: ${esc(o.qty)}</div>
                `;

            el.onmouseover = () => el.style.background = '#f1f5f9';
            el.onmouseout = () => { if (cpSelectedOrder !== o) el.style.background = 'transparent'; else el.style.background = '#e2e8f0'; };

            el.onclick = () => selectCpOrder(o, el);

            if (cpSelectedOrder === o) {
              el.style.background = '#e2e8f0';
            }

            list.appendChild(el);
          });
        }

        async function selectCpOrder(order, el) {
          cpSelectedOrder = order;
          cpSelectedMould = null;
          cpSelectedMachine = null;

          // UI Highlight
          const list = document.getElementById('cpOrderList');
          if (list) Array.from(list.children).forEach(c => c.style.background = 'transparent');
          if (el) el.style.background = '#e2e8f0';

          // Show Detail View
          const empty = document.getElementById('cpEmptyState');
          const content = document.getElementById('cpDetailContent');
          if (empty) empty.style.display = 'none';
          if (content) content.style.display = 'flex';

          const tOrder = document.getElementById('cpTitleOrderNo');
          const tProd = document.getElementById('cpTitleProduct');
          if (tOrder) tOrder.textContent = order.orderNo;
          if (tProd) tProd.textContent = order.productName;

          // clear mould list
          const mList = document.getElementById('cpMouldList');
          if (mList) mList.innerHTML = '<div class="muted">Loading Moulds...</div>';

          const macSec = document.getElementById('cpMachineSection');
          if (macSec) macSec.style.display = 'none';

          const saveBtn = document.getElementById('cpSaveBtn');
          if (saveBtn) saveBtn.disabled = true;

          try {
            const res = await api.get(`/planning/orders/${encodeURIComponent(order.orderNo)}/details`);
            renderCpMoulds(res.data || []);
          } catch (e) {
            if (mList) mList.innerHTML = `<div class="error">Failed to load details: ${esc(e.message)}</div>`;
          }
        }

        function renderCpMoulds(moulds) {
          const con = document.getElementById('cpMouldList');
          if (!con) return;
          con.innerHTML = '';

          if (!moulds.length) {
            con.innerHTML = '<div class="muted">No detailed mould lines found.</div>';
            return;
          }

          moulds.forEach(m => {
            const row = document.createElement('div');
            row.style.border = '1px solid var(--border)';
            row.style.borderRadius = '8px';
            row.style.padding = '10px';
            row.style.cursor = 'pointer';
            row.style.background = '#fff';

            // Info logic
            const tonnage = m.masterMachineRaw || 'N/A';
            const hasMaster = !!m.mould_id;
            const masterBadge = hasMaster ? '<i class="bi bi-database-check" title="Linked to Mould Master" style="color:var(--ok)"></i>' : '<i class="bi bi-exclamation-triangle" title="Missing Master Link" style="color:var(--warn)"></i>';

            row.innerHTML = `
                   <div style="display:flex; gap:10px; align-items:center">
                      <input type="radio" name="cpMouldSelect" style="transform:scale(1.2)">
                      <div style="flex:1">
                         <div style="font-weight:700; color:#334155">${esc(m.mould_name)} ${masterBadge}</div>
                         <div style="font-size:0.85rem; color:#64748b">Item: ${esc(m.item_code)} • Qty: ${esc(m.plan_qty)}</div>
                         <div style="font-size:0.85rem; color:#64748b; margin-top:2px">
                            Tonnage: <strong>${esc(tonnage)}</strong> • Cav: ${esc(m.masterCavity || '-')} • CT: ${esc(m.masterCycleTime || '-')}s
                         </div>
                      </div>
                   </div>
                `;

            row.onclick = () => {
              const radio = row.querySelector('input');
              if (radio) radio.checked = true;
              selectCpMould(m);
              // Highlights
              Array.from(con.children).forEach(c => c.style.borderColor = 'var(--border)');
              row.style.borderColor = '#3b82f6';
            };

            con.appendChild(row);
          });
        }

        async function selectCpMould(mould) {
          cpSelectedMould = mould;
          cpSelectedMachine = null;

          const saveBtn = document.getElementById('cpSaveBtn');
          if (saveBtn) saveBtn.disabled = true;

          const sec = document.getElementById('cpMachineSection');
          if (sec) sec.style.display = 'block';

          const t = document.getElementById('cpTargetTonnage');
          if (t) t.textContent = mould.masterMachineRaw || 'Unknown';

          const list = document.getElementById('cpMachineList');
          if (list) list.innerHTML = '<div class="muted">Finding compatible machines...</div>';

          if (!mould.masterMachineRaw) {
            if (list) list.innerHTML = '<div class="error">No tonnage info in master. Cannot match machines.</div>';
            return;
          }

          try {
            const res = await api.get(`/planning/machines/compatible?tonnage=${encodeURIComponent(mould.masterMachineRaw)}`);
            renderCpMachines(res.data || []);
          } catch (e) {
            if (list) list.innerHTML = `<div class="error">Error: ${esc(e.message)}</div>`;
          }
        }

        function renderCpMachines(machines) {
          const list = document.getElementById('cpMachineList');
          if (!list) return;
          list.innerHTML = '';

          if (!machines.length) {
            list.innerHTML = '<div class="muted" style="grid-column:1/-1">No compatible machines found.</div>';
            return;
          }

          machines.forEach(mac => {
            const isFree = mac.isFree;
            const statusColor = isFree ? 'var(--ok)' : 'var(--warn)';
            const statusTxt = isFree ? 'AVAILABLE' : (mac.currentStatus || 'BUSY');

            const el = document.createElement('div');
            el.className = 'machine-card-select';
            el.style.border = '1px solid var(--border)';
            el.style.borderRadius = '8px';
            el.style.padding = '10px';
            el.style.cursor = 'pointer';
            el.style.background = '#fff';
            el.style.position = 'relative';

            if (isFree) el.style.borderColor = 'var(--ok)';

            el.innerHTML = `
                   <div style="font-weight:800; font-size:1rem">${esc(mac.machine)}</div>
                   <div style="font-size:0.8rem; color:#64748b">${mac.building} - L${mac.line}</div>
                   <div style="font-size:0.8rem; margin-top:6px; font-weight:700; color:${statusColor}">
                      ${statusTxt}
                   </div>
                   ${!isFree ? `<div style="font-size:0.75rem; color:#94a3b8">Running: ${esc(mac.currentOrder || '-')}</div>` : ''}
                   <div style="position:absolute; top:10px; right:10px; font-weight:700; color:#cbd5e1">${esc(mac.tonnage)}T</div>
                `;

            el.onclick = () => {
              cpSelectedMachine = mac;
              // Highlights
              Array.from(list.children).forEach(c => {
                c.style.background = '#fff';
                c.style.borderColor = 'var(--border)';
                if (c.querySelector('.status-txt') === 'AVAILABLE') c.style.borderColor = 'var(--ok)';
              });
              el.style.background = '#eff6ff';
              el.style.borderColor = '#3b82f6';

              const sBtn = document.getElementById('cpSaveBtn');
              if (sBtn) sBtn.disabled = false;
            };

            list.appendChild(el);
          });
        }




        function renderDirectOrders(rows) {
          const el = document.getElementById('directOrders'); while (el.children.length > 1) el.removeChild(el.lastChild);
          rows.forEach(o => {
            const r = document.createElement('div'); r.className = 'row'; r.dataset.id = o.id;
            const priClass = (o.priority || 'Normal');
            r.innerHTML = `
            <div><input type="checkbox" class="ck" /></div>
          <div><span class="tag ${esc(priClass)}">${esc(o.priority)}</span></div>
          <div><strong>${esc(o.order_no)}</strong> • <span class="muted">${esc(o.item_name)}</span></div>
          <div>${esc(o.mould_code || '-')}</div>
          <div>${o.qty.toLocaleString()}</div>
          <div>${o.age_days}d</div>`;
            el.appendChild(r);
          });
        }

        /* ------------------ Balance Load (Preview → Commit) ------------------ */
        async function balanceLoad() {
          previewMode = 'balance';
          const payload = {
            horizon_days: horizon,
            include_inactive: !!showInactive,
            building: document.getElementById('buildingFilter').value || null,
            factory_ids: (window.JMS?.session?.factories || []).map(f => String(f.id || f)).filter(Boolean)
          };
          try {
            const res = await api.post('/planning/balance', payload);
            const assignments = Array.isArray(res?.assignments) ? res.assignments : [];
            if (assignments.length) {
              lastPreviewAssignments = assignments;
              showPreview('Balance preview from server', assignments);
              return;
            }
            // if server returns message but no assignments, just refresh
            toast(res?.message || 'Balanced via server');
            await loadMachines(); await loadKPIs();
            return;
          } catch {/* fallback client demo */ }
          await clientBalancePreview('Balance preview (demo)');
        }

        async function clientBalancePreview(subtitle) {
          if (!lastOrders.length) await loadPendingOrders();
          if (!lastMachines.length) await loadMachines();

          let scope = lastMachines.filter(m => !m.is_maintenance && (m.is_active !== false) && (m.status || '').toLowerCase() !== 'off');
          const b = document.getElementById('buildingFilter').value;
          const q = (document.getElementById('machineSearch').value || '').toLowerCase().trim();
          if (b) scope = scope.filter(x => String(x.building).toUpperCase() === b);
          if (q) scope = scope.filter(x => (x.code + ' ' + x.name).toLowerCase().includes(q));
          if (!scope.length) { toast('No eligible machines'); return; }

          scope.forEach(m => { m.load = Number(m.load_pct || m.utilization || Math.floor(10 + Math.random() * 60)); m.queue_preview = []; m.queue_effort = 0; });

          const rateFor = (o) => { const base = 100; return (o.priority === 'Urgent') ? base * 1.2 : (o.priority === 'High') ? base * 1.0 : base * 0.85; };
          const tasks = lastOrders.slice().sort((a, b) => {
            const pr = { Urgent: 0, High: 1, Normal: 2 }; const pa = pr[a.priority] ?? 3, pb = pr[b.priority] ?? 3;
            return (pa - pb) || ((b.qty || 0) - (a.qty || 0));
          }).map(o => ({ id: o.id, label: o.order_no, effort: Math.max(1, Math.round((o.qty || 1000) / rateFor(o))) }));

          tasks.forEach(t => {
            const target = scope.reduce((best, m) => { const proj = (m.load || 0) + (m.queue_effort || 0); return (!best || proj < best.proj) ? { m, proj } : best; }, null)?.m;
            if (target) { target.queue_preview.push(t.label); target.queue_effort = (target.queue_effort || 0) + t.effort; }
          });

          const assignments = scope.filter(m => m.queue_preview.length)
            .map(m => ({ machine_id: m.id, machine_code: m.code, building: m.building, line: m.line, orders: m.queue_preview.slice() }));

          lastPreviewAssignments = assignments;
          showPreview(subtitle, assignments);
        }

        /* ------------------ Auto-Assign P1 (Urgent) ------------------ */
        async function autoAssignP1() {
          previewMode = 'p1';
          const payload = {
            limit: 20,
            building: document.getElementById('buildingFilter').value || null,
            factory_ids: (window.JMS?.session?.factories || []).map(f => String(f.id || f)).filter(Boolean)
          };
          try {
            const res = await api.post('/planning/auto-assign-p1', payload);
            const assignments = Array.isArray(res?.assignments) ? res.assignments : [];
            if (assignments.length) {
              lastPreviewAssignments = assignments;
              showPreview('Auto-Assign P1 (server)', assignments);
              return;
            }
            toast(res?.message || 'P1 assigned via server'); await loadMachines(); await loadKPIs(); return;
          } catch {/* fallback */ }
          await clientP1Preview('Auto-Assign P1 (demo)');
        }

        async function clientP1Preview(subtitle) {
          if (!lastOrders.length) await loadPendingOrders();
          if (!lastMachines.length) await loadMachines();

          let scope = lastMachines.filter(m => !m.is_maintenance && (m.is_active !== false) && (m.status || '').toLowerCase() !== 'off');
          if (!scope.length) { toast('No eligible machines'); return; }

          const urgent = lastOrders.filter(o => String(o.priority).toLowerCase() === 'urgent');
          if (!urgent.length) { toast('No Urgent (P1) orders'); return; }

          scope.forEach(m => { m.load = Number(m.load_pct || m.utilization || Math.floor(10 + Math.random() * 60)); m.queue_preview = []; m.queue_effort = 0; });

          // Assign top-N urgent to earliest available machines
          urgent.sort((a, b) => (b.qty || 0) - (a.qty || 0));
          urgent.forEach(o => {
            const target = scope.reduce((best, m) => { const proj = (m.load || 0) + (m.queue_effort || 0); return (!best || proj < best.proj) ? { m, proj } : best; }, null)?.m;
            if (target) { target.queue_preview.push(o.order_no); target.queue_effort = (target.queue_effort || 0) + 1; }
          });

          const assignments = scope.filter(m => m.queue_preview.length)
            .map(m => ({ machine_id: m.id, machine_code: m.code, building: m.building, line: m.line, orders: m.queue_preview.slice() }));

          lastPreviewAssignments = assignments;
          showPreview(subtitle, assignments);
        }

        /* ------------------ Preview Modal utils ------------------ */
        function showPreview(subtitle, assignments) {
          const modal = document.getElementById('previewModal');
          modal.querySelector('#pmTitle').textContent = (previewMode === 'p1' ? 'Auto-Assign P1 — Preview' : 'Balance Load — Preview');
          modal.querySelector('#pmSub').textContent = subtitle + ` • ${assignments.length} machine(s)`;
          const list = modal.querySelector('#pmList');
          while (list.children.length > 1) list.removeChild(list.lastChild);
          assignments.forEach((a, idx) => {
            const row = document.createElement('div'); row.className = 'row';
            row.innerHTML = `
            <div>${idx + 1}</div>
          <div><strong>${esc(a.machine_code || a.machine_id)}</strong></div>
          <div class="mini">${(a.orders || []).map(x => esc(x)).join(', ') || '—'}</div>
          <div>${esc(a.building || '-')}</div>
          <div>${esc(a.line || '-')}</div>
          <div>${(a.orders || []).length}</div>`;
            list.appendChild(row);
          });

          modal.querySelector('#pmCommit').onclick = async () => {
            if (!lastPreviewAssignments.length) { closeModal('previewModal'); return; }
            try {
              const out = await api.post(
                previewMode === 'p1' ? '/planning/auto-assign-p1/commit' : '/planning/balance/commit',
                { assignments: lastPreviewAssignments }
              );
              toast(out?.message || 'Committed');
              closeModal('previewModal');
              await loadMachines(); await loadKPIs();
            } catch (e) { toast(e?.message || 'Commit failed'); }
          };
          modal.querySelector('#pmClose').onclick = () => closeModal('previewModal');
          modal.querySelector('#pmCancel').onclick = () => closeModal('previewModal');
          openModal('previewModal');
        }

        /* ------------------ Modal helpers ------------------ */
        function openModal(id) {
          const m = document.getElementById(id);
          if (!m) return;
          m.classList.add('show'); m.setAttribute('aria-hidden', 'false');
          document.body.setAttribute('data-lock', '1');
        }
        function closeModal(id) {
          const m = document.getElementById(id);
          if (!m) return;
          m.classList.remove('show'); m.setAttribute('aria-hidden', 'true');
          document.body.removeAttribute('data-lock');
        }

        /* ------------------ Utility ------------------ */
        function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

        // Backdrop for mobile sidebar
        const backdrop = document.getElementById('sidebarBackdrop');
        if (backdrop) backdrop.addEventListener('click', () => {
          document.body.classList.remove('sidebar-open');
          document.body.removeAttribute('data-lock');
        });

        /* --------------- Keyboard shortcuts --------------- */
        document.addEventListener('keydown', (e) => {
          if (e.key === 'b' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); balanceLoad(); }
          if (e.key === 'p' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); openCreatePlanLauncher(); }
        });

        // Initial data
        await loadMachines();
        if (!lastOrders.length) try { await loadPendingOrders(); } catch (e) { }


        /* ------------------ View Routing ------------------ */
        if (view === 'master') {
          document.querySelector('.kpi-deck').style.display = 'none';
          document.getElementById('mapWrap').style.display = 'none';
          document.querySelector('.toolbar').style.display = 'none'; // hide default toolbar
          document.getElementById('masterView').style.display = 'block';
          loadMasterPlan();
        }

        // Master View Events
        document.getElementById('btnRefreshMaster').onclick = loadMasterPlan;
        document.getElementById('masterBuilding').onchange = filterMasterPlan;
        document.getElementById('masterSearch').oninput = filterMasterPlan;
        document.getElementById('btnMasterCreate').onclick = openCreatePlanLauncher;



        window.openCreatePlanLauncher = function () {
          console.log('Opening Create Plan Launcher...');
          // alert('Debug: Open Create Plan'); // Toggle if needed
          try {
            openModal('newCreatePlanModal');

            const cpClose = document.getElementById('cpClose');
            if (cpClose) cpClose.onclick = () => closeModal('newCreatePlanModal');

            const cpCancel = document.getElementById('cpCancelBtn');
            if (cpCancel) cpCancel.onclick = () => closeModal('newCreatePlanModal');

            // Re-bind Save Button explicitly here to ensure freshness
            const cpSave = document.getElementById('cpSaveBtn');
            if (cpSave) {
              // Remove old listener to avoid duplicates enabled by setting onclick property
              cpSave.onclick = async () => {
                alert('DEBUG: Create Plan Clicked\nOrder: ' + (cpSelectedOrder?.order_no || 'None'));
                console.log('Create Plan Clicked!');
                console.log('State:', { cpSelectedOrder, cpSelectedMould, cpSelectedMachine });

                if (!cpSelectedOrder || !cpSelectedMould || !cpSelectedMachine) {
                  let missing = [];
                  if (!cpSelectedOrder) missing.push("Order");
                  if (!cpSelectedMould) missing.push("Mould");
                  if (!cpSelectedMachine) missing.push("Machine");
                  return toast('Please select: ' + missing.join(', '), 'error');
                }

                try {
                  cpSave.disabled = true;
                  cpSave.innerHTML = '<i class="bi bi-hourglass-split"></i> Saving...';

                  const payload = {
                    planId: `PLN-${Date.now()}`,
                    plant: 'DUNGRA',
                    machine: cpSelectedMachine.machine,
                    orderNo: cpSelectedOrder.order_no,
                    itemCode: cpSelectedMould.item_code,
                    itemName: cpSelectedOrder.item_name,
                    mouldName: cpSelectedMould.mould_name,
                    planQty: cpSelectedMould.plan_qty,
                    balQty: cpSelectedMould.plan_qty,
                    startDate: new Date().toISOString()
                  };

                  console.log('Sending Payload:', payload);
                  const res = await api.post('/planning/create', payload);

                  if (res && res.ok) {
                    toast('Plan created successfully!', 'success');
                    closeModal('newCreatePlanModal');
                    loadMasterPlan();
                  } else {
                    toast(res.error || 'Failed to create plan', 'error');
                  }
                } catch (e) {
                  console.error(e);
                  toast(e.message, 'error');
                } finally {
                  cpSave.disabled = false;
                  cpSave.innerHTML = '<i class="bi bi-check2-circle"></i> Create Plan';
                }
              };
            } else {
              console.error('cpSaveBtn NOT FOUND in DOM');
            }

            loadCpOrders();
          } catch (e) {
            console.error('Error opening Create Plan:', e);
            alert('Error opening Create Plan: ' + e.message);
          }
        };

        async function loadMasterPlan() {
          const tbody = document.getElementById('masterTableBody');
          tbody.innerHTML = `<div class="row"><div style="grid-column:1/-1; text-align:center; padding:20px" class="muted">Loading master plan...</div></div>`;

          try {
            const res = await api.get('/planning/board');
            const plans = (res && res.data && res.data.plans) ? res.data.plans : [];
            allMasterPlans = plans;
            renderMasterTable(plans);
            toast(`Loaded ${plans.length} plans`);
          } catch (e) {
            tbody.innerHTML = `<div class="row"><div style="grid-column:1/-1; text-align:center; padding:20px" class="error">Failed to load: ${e.message}</div></div>`;
          }
        }

        function renderMasterTable(list) {
          const tbody = document.getElementById('masterTableBody');
          tbody.innerHTML = '';
          if (!list.length) {
            tbody.innerHTML = `<div class="row"><div style="grid-column:1/-1; text-align:center; padding:20px" class="muted">No plans found.</div></div>`;
            return;
          }

          // Sort by Machine then Seq
          list.sort((a, b) => (a.machine || '').localeCompare(b.machine || '') || (a.seq - b.seq));

          list.forEach(p => {
            const row = document.createElement('div');
            row.className = 'row';
            // Adjusted 12 columns
            row.style.gridTemplateColumns = '80px 60px 40px 40px 60px 130px 1fr 70px 90px 90px 90px 40px';

            // Status Color
            let sClass = 'tag';
            const st = (p.status || '').toLowerCase();
            if (st === 'running') sClass += ' g';
            else if (st === 'completed') sClass += ' b';
            else if (st === 'stopped') sClass += ' r';
            else sClass += ' Normal';

            const priClass = (p.priority === 'Urgent' ? 'Urgent' : p.priority === 'High' ? 'High' : 'Normal');

            // Action Button (Activate)
            let actionHtml = '';
            if (!['running', 'completed'].includes(st)) {
              actionHtml = `<button class="btn icon mini primary" title="Activate Plan" onclick="activatePlan('${p.id}', '${esc(p.orderNo)}')"><i class="bi bi-play-fill"></i></button>`;
              // Remove
              actionHtml += `<button class="btn icon mini ghost" style="color:var(--bad); margin-left:4px" title="Remove Plan" onclick="removePlan('${p.id}', '${esc(p.orderNo)}')"><i class="bi bi-trash"></i></button>`;
            }

            row.innerHTML = `
            <div style="font-weight:bold">${esc(p.machine)}</div>
               <div>${esc(p.building)}</div>
               <div>${esc(p.line)}</div>
               <div>${p.seq}</div>
               <div><span class="tag ${priClass}">${esc(p.priority || '-')}</span></div>
               <div><span style="font-family:monospace">${esc(p.orderNo)}</span></div>
               <div style="font-size:0.9em; overflow:hidden; text-overflow:ellipsis" title="${esc(p.itemName)}">${esc(p.itemName)}</div>
               <div>${(p.planQty || 0).toLocaleString()}</div>
               <div class="mini">${p.startDate ? p.startDate.split('T')[0] : '-'}</div>
               <div class="mini">${p.endDate ? p.endDate.split('T')[0] : '-'}</div>
               <div><span class="${sClass}">${esc(p.status || 'Pending')}</span></div>
               <div>${actionHtml}</div>
          `;
            tbody.appendChild(row);
          });
        }

        function filterMasterPlan() {
          const b = document.getElementById('masterBuilding').value;
          const q = (document.getElementById('masterSearch').value || '').toLowerCase();

          const filtered = allMasterPlans.filter(p => {
            if (b && String(p.building) !== b) return false;
            if (q) {
              const text = `${p.machine} ${p.orderNo} ${p.itemName} ${p.mouldName} ${p.status} `.toLowerCase();
              if (!text.includes(q)) return false;
            }
            return true;
          });
          renderMasterTable(filtered);
        }

        window.activatePlan = async function (id, orderNo) {
          if (!confirm(`Activate Order ${orderNo}? This will push it to the Supervisor Queue.`)) return;
          try {
            const res = await api.post('/planning/run', { rowId: id });
            if (res && res.ok) {
              toast('Plan Activated successfully!', 'success');
              loadMasterPlan(); // Refresh
            } else {
              toast(res.error || 'Failed to activate', 'error');
            }
          } catch (e) {
            toast(e.message, 'error');
          }
        };

        window.removePlan = async function (id, orderNo) {
          if (!confirm(`Remove Plan for Order ${orderNo}?`)) return;
          try {
            const res = await api.post('/planning/delete', { rowId: id });
            if (res && res.ok) {
              toast('Plan removed', 'success');
              loadMasterPlan();
            } else {
              toast(res.error || 'Failed to remove', 'error');
            }
          } catch (e) {
            toast(e.message, 'error');
          }
        };





        // (Restored catch block for main init try wrapper)
      } catch (err) {
        console.error('Main Init Error:', err);
        if (typeof toast === 'function') toast('Init Error: ' + err.message, 'error');
      }

      if (window.JMS && window.JMS.ui) {
        window.JMS.ui.enableRowSelection('#masterTableBody', '.row');
        window.JMS.ui.enableRowSelection('#pmList', '.row');
      }

      // -------------------------------------------------------------
      // AUTO-OPEN PLAN LAUNCHER FROM URL ?order=...
      // -------------------------------------------------------------
      const urlParams = new URLSearchParams(window.location.search);
      const autoOrder = urlParams.get('order');
      if (autoOrder) {
        // Wait a tick for initiation
        setTimeout(() => {
          openCreatePlanLauncher();

          // Switch to Direct Tab
          const launcher = document.getElementById('createPlanLauncher');
          const directTab = launcher.querySelector('.tab[data-tab="direct"]');
          if (directTab) directTab.click();

          // Fill Search & Trigger
          const searchInput = launcher.querySelector('#directOrderSearch');
          if (searchInput) {
            searchInput.value = autoOrder;
            searchInput.dispatchEvent(new Event('input')); // Trigger filter
          }
          toast('Pre-filtering for Order: ' + autoOrder);
        }, 800);
      }


    });
  