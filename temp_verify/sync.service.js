const fetch = require('node-fetch');
const { Pool } = require('pg');
const express = require('express');
const router = express.Router();

let pool;
let SERVER_TYPE = 'MAIN'; // Default
let MAIN_SERVER_URL = ''; // e.g. https://vps.example.com
let LOCAL_FACTORY_ID = null;
let API_KEY = 'jpsms-sync-key'; // Simple shared secret

const SYNC_INTERVAL_MS = 60 * 1000; // 1 Minute (Real-Time)

const SYNC_ALL = [
    'app_settings',
    'assembly_lines',
    'assembly_plans',
    'assembly_scans',
    'bom_components',
    'bom_master',
    'dispatch_items',
    'dpr_hourly',
    'dpr_reasons',
    'factories',
    'grinding_logs',
    'grn_entries',
    'jc_details',
    'jc_summaries',
    'job_cards',
    'jobs_queue',
    'machine_operators',
    'machine_status_logs',
    'machines',
    'mould_audit_logs',
    'mould_planning_report',
    'mould_planning_summary',
    'moulds',
    'operator_history',
    'or_jr_report',
    'orders',
    'plan_audit_logs',
    'plan_board',
    'plan_history',
    'planning_drops',
    'purchase_order_items',
    'purchase_orders',
    'qc_deviations',
    'qc_issue_memos',
    'qc_online_reports',
    'qc_training_sheets',
    'roles',
    'shift_teams',
    'shifting_records',
    'std_actual',
    'user_factories',
    'users',
    'vendor_dispatch',
    'vendor_payments',
    'vendor_users',
    'vendors',
    'wip_inventory',
    'wip_outward_logs'
];

const TABLES_TO_PUSH = [...SYNC_ALL];
const TABLES_TO_PULL = [...SYNC_ALL];

/* ============================================================
   ROUTER DEFINITIONS (Mounted at /api/sync)
   ============================================================ */

// Receive Push Data (from Local)
router.post('/push', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Service initializing' });
    try {
        const { factoryId, table, data, apiKey } = req.body;
        if (apiKey !== API_KEY) return res.status(403).json({ error: 'Invalid Key' });
        if (!TABLES_TO_PUSH.includes(table)) return res.status(400).json({ error: 'Invalid Table' });

        console.log(`[Sync] Received ${data.length} rows for ${table} from Factory ${factoryId}`);

        // Inject Source Factory ID and ensure Sync ID
        data.forEach(row => {
            row.factory_id = factoryId;
            if (!row.sync_id) row.sync_id = row.global_id; // Fallback if needed
        });

        await upsertData(table, data);
        res.json({ ok: true, rows: data.length });
    } catch (e) {
        console.error('[Sync] Push Receive Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Serve Pull Data (to Local)
router.get('/pull', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Service initializing' });
    try {
        const { table, lastSync, apiKey } = req.query;
        if (apiKey !== API_KEY) return res.status(403).json({ error: 'Invalid Key' });
        if (!TABLES_TO_PULL.includes(table)) return res.status(400).json({ error: 'Invalid Table' });

        const rows = await getChanges(table, lastSync);
        res.json({ ok: true, data: rows });
    } catch (e) {
        console.error('[Sync] Pull Serve Error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Get Sync Status
router.get('/status', async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'Service initializing' });
    try {
        let lastSync = 'Never';
        let lastPush = 'Never';
        let lastPull = 'Never';

        const result = await pool.query("SELECT * FROM server_config WHERE key IN ('LAST_SYNC', 'LAST_PUSH', 'LAST_PULL')");
        result.rows.forEach(r => {
            if (r.key === 'LAST_SYNC') lastSync = r.value;
            if (r.key === 'LAST_PUSH') lastPush = r.value;
            if (r.key === 'LAST_PULL') lastPull = r.value;
        });

        res.json({
            ok: true,
            type: SERVER_TYPE,
            factory_id: LOCAL_FACTORY_ID,
            main_url: MAIN_SERVER_URL,
            last_sync: lastSync,
            last_push: lastPush,
            last_pull: lastPull
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

/* ============================================================
   CORE SYNC LOGIC
   ============================================================ */

async function init(dbPool) {
    pool = dbPool;
    try {
        const res = await pool.query("SELECT key, value FROM server_config");
        const config = {};
        res.rows.forEach(r => config[r.key] = r.value);

        if (config.SERVER_TYPE) SERVER_TYPE = config.SERVER_TYPE;
        if (config.MAIN_SERVER_URL) MAIN_SERVER_URL = config.MAIN_SERVER_URL;
        if (config.LOCAL_FACTORY_ID) LOCAL_FACTORY_ID = parseInt(config.LOCAL_FACTORY_ID);
        if (config.SYNC_API_KEY) API_KEY = config.SYNC_API_KEY;

        console.log(`[Sync] Init. Type: ${SERVER_TYPE}, Factory: ${LOCAL_FACTORY_ID}, Main: ${MAIN_SERVER_URL}`);

        if (SERVER_TYPE === 'LOCAL') {
            startSchedule();
        }
    } catch (e) {
        console.error('[Sync] Init Failed:', e);
    }
}

let syncTimer = null;
function startSchedule() {
    console.log('[Sync] Starting Schedule...');
    setTimeout(runSyncCycle, 10000);
}

// Trigger Sync immediately (Debounced)
let triggerTimeout = null;
function triggerSync() {
    if (SERVER_TYPE !== 'LOCAL') return;
    console.log('[Sync] Trigger requested...');
    if (triggerTimeout) clearTimeout(triggerTimeout);
    triggerTimeout = setTimeout(() => {
        console.log('[Sync] Triggering Immediate Cycle!');
        runSyncCycle();
    }, 2000); // 2s debounce
}

let lastSyncTime = null;
let lastPushTime = null;
let lastPullTime = null;

async function runSyncCycle() {
    if (!pool || !LOCAL_FACTORY_ID) return;
    console.log('[Sync] Running Cycle...');
    lastSyncTime = new Date();

    try {
        if (TABLES_TO_PUSH.length > 0) {
            await pushChanges();
            lastPushTime = new Date();
        }
        if (TABLES_TO_PULL.length > 0) {
            await pullChanges();
            lastPullTime = new Date();
        }
        // Persist Last Sync
        await pool.query(`INSERT INTO server_config (key, value) VALUES ('LAST_SYNC', NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`);
    } catch (e) {
        console.error('[Sync] Cycle Failed:', e);
    }

    if (syncTimer) clearTimeout(syncTimer);
    syncTimer = setTimeout(runSyncCycle, SYNC_INTERVAL_MS);
}

async function pushChanges() {
    const res = await pool.query(`SELECT value FROM server_config WHERE key = 'LAST_PUSH'`);
    const lastPush = res.rows.length ? res.rows[0].value : '1970-01-01';

    for (const table of TABLES_TO_PUSH) {
        const rows = await pool.query(`
            SELECT * FROM ${table} 
            WHERE updated_at > $1 
            AND factory_id = $2
            LIMIT 100
        `, [lastPush, LOCAL_FACTORY_ID]);

        if (rows.rows.length > 0) {
            console.log(`[Sync] Pushing ${rows.rows.length} rows for ${table}...`);
            const payload = {
                factoryId: LOCAL_FACTORY_ID,
                table,
                data: rows.rows,
                apiKey: API_KEY
            };

            const response = await fetch(`${MAIN_SERVER_URL}/api/sync/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const text = await response.text();
                console.error(`[Sync] Push Failed Details for ${table}:`, text);
                throw new Error(`Push failed: ${response.status} ${response.statusText} - ${text}`);
            }
        }
    }
    await pool.query(`INSERT INTO server_config (key, value) VALUES ('LAST_PUSH', NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`);
}

async function pullChanges() {
    const res = await pool.query(`SELECT value FROM server_config WHERE key = 'LAST_PULL'`);
    const lastPull = res.rows.length ? res.rows[0].value : '1970-01-01';

    for (const table of TABLES_TO_PULL) {
        try {
            const response = await fetch(`${MAIN_SERVER_URL}/api/sync/pull?table=${table}&since=${lastPull}&apiKey=${API_KEY}`);
            if (!response.ok) continue;

            const json = await response.json();
            const data = json.data || [];

            if (data.length > 0) {
                console.log(`[Sync] Pulled ${data.length} rows for ${table}...`);
                await upsertData(table, data); // Reuse upsert logic
            }
        } catch (e) {
            console.error(`[Sync] Pull Failed ${table}:`, e);
        }
    }
    await pool.query(`INSERT INTO server_config (key, value) VALUES ('LAST_PULL', NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`);
}

const CONFLICT_KEYS = {
    'users': 'id',
    'roles': 'code',
    'orders': 'id',
    'plan_audit_logs': 'id',
    'plan_history': 'id',
    'purchase_order_items': 'id',
    'purchase_orders': 'id',
    'user_factories': 'id',
    'dpr_reasons': 'id',
    'mould_planning_report': 'id',
    'mould_planning_summary': 'id',
    'jc_details': 'id',
    'jc_summaries': 'id',
    'job_cards': 'id',
    'machine_operators': 'id',
    'machine_status_logs': 'id',
    'mould_audit_logs': 'id',
    'qc_deviations': 'id',
    'qc_issue_memos': 'id',
    'qc_online_reports': 'id',
    'qc_training_sheets': 'id',
    'shifting_records': 'id',
    'std_actual': 'id',
    'vendor_dispatch': 'id',
    'vendor_payments': 'id',
    'vendor_users': 'id',
    'wip_inventory': 'id',
    'wip_outward_logs': 'id',
    'assembly_lines': 'line_id',
    'assembly_plans': 'id',
    'assembly_scans': 'id',
    'vendors': 'id',
    'app_settings': 'key',
    'factories': 'id',
    'grinding_logs': 'id'
    // Add others as needed. Default is 'sync_id' if present, else 'id'
};

const TRANSFORMERS = {
    'vendors': (row) => {
        if (row.factory_access) {
            console.log(`[Sync] Vendors Debug: type=${typeof row.factory_access}, value=${JSON.stringify(row.factory_access)}`);
            // Fix malformed JSON like {"1"} which some legacy data might have as string
            if (typeof row.factory_access === 'string') {
                if (row.factory_access.includes('{') && !row.factory_access.includes(':')) {
                    // It's likely a malformed set-like string e.g. {"1"} -> convert to array [1]
                    try {
                        const clean = row.factory_access.replace(/["{}]/g, '').split(',');
                        row.factory_access = JSON.stringify(clean.map(Number).filter(n => !isNaN(n)));
                        console.log(`[Sync] Fixed vendor access to: ${row.factory_access}`);
                    } catch (e) {
                        row.factory_access = '[]';
                        console.log('[Sync] Failed to fix vendor access, set to []');
                    }
                }
            } else if (typeof row.factory_access === 'object') {
                // Check if it's already an object but maybe invalid structure?
                console.log('[Sync] Vendor access is object:', JSON.stringify(row.factory_access));
                row.factory_access = JSON.stringify(row.factory_access); // Explicitly stringify for PG
            }
        }
        return row;
    }
};

async function upsertData(table, data) {
    if (!data.length) return;
    const client = await pool.connect();
    try {
        console.log(`[Sync] DEBUG: Starting upsert for table=${table} rows=${data.length}`);
        await client.query('BEGIN');
        for (let row of data) {

            // Apply Transformers
            if (TRANSFORMERS[table]) {
                console.log(`[Sync] DEBUG: Applying transformer for ${table}`);
                row = TRANSFORMERS[table](row);
            } else {
                // Check if factory_access exists anyway
                if (row.factory_access) {
                    console.log(`[Sync] DEBUG: Table ${table} has factory_access but no transformer! Value:`, row.factory_access);
                }
            }

            const keys = Object.keys(row);
            const vals = Object.values(row);
            const idx = keys.map((_, i) => `$${i + 1}`);
            const setClause = keys.map((k, i) => `${k} = EXCLUDED.${k}`).join(', ');

            // Determine Conflict Key
            let conflictKey = 'id'; // Default default
            if (CONFLICT_KEYS[table]) {
                conflictKey = CONFLICT_KEYS[table];
            } else if (row.sync_id) {
                conflictKey = 'sync_id';
            }

            let whereClause = `WHERE (EXCLUDED.updated_at > ${table}.updated_at OR ${table}.updated_at IS NULL)`;

            if (table === 'plan_board') {
                // [GUARD 1] Prevent overwriting 'Running' with inactive status
                whereClause += ` AND NOT (${table}.status = 'Running' AND EXCLUDED.status IN ('Planned', 'Stopped', 'Pending'))`;

                // [GUARD 2] FRESHNESS HYSTERESIS: 
                // Don't overwrite if Local Data was updated in the last 60 seconds.
                whereClause += ` AND (${table}.updated_at < NOW() - INTERVAL '60 seconds' OR ${table}.updated_at IS NULL)`;
            }

            const sql = `
                INSERT INTO ${table} (${keys.join(',')}) 
                VALUES (${idx.join(',')})
                ON CONFLICT (${conflictKey}) 
                DO UPDATE SET ${setClause}
                ${whereClause}
            `;

            try {
                await client.query(sql, vals);
            } catch (innerErr) {
                console.error(`[Sync] Row Error in ${table}:`, innerErr.message);
                console.error('Failed Row:', JSON.stringify(row));
                console.error('SQL:', sql);
                // Optionally continue or throw. Throwing to rollback batch.
                throw innerErr;
            }
        }
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(`[Sync] Upsert Batch Error ${table}:`, e);
        throw e;
    } finally {
        client.release();
    }
}

async function getChanges(table, since) {
    let sql = `SELECT * FROM ${table}`;
    const params = [];
    if (since) {
        // Ensure we don't pick up null updated_at rows unless we want to? 
        // Usually we only want changed rows.
        sql += ` WHERE updated_at > $1`;
        params.push(since);
    }
    sql += ` LIMIT 1000`;
    const rows = await pool.query(sql, params);
    return rows.rows;
}

module.exports = { init, router, triggerSync };
