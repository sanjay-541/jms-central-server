const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

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

async function forceFullSync() {
    const client = await pool.connect();
    try {
        console.log('Forcing FULL RESYNC from Local...');

        // 1. Reset LAST_PUSH to epoch
        await client.query("INSERT INTO server_config (key, value) VALUES ('LAST_PUSH', '1970-01-01') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value");
        console.log('[OK] Reset LAST_PUSH to 1970-01-01');

        // 2. Ensure factory_id is set (default to 1 if missing)
        const FID = process.env.LOCAL_FACTORY_ID || 1;
        console.log(`[INFO] Setting missing factory_id to ${FID}...`);

        for (const table of SYNC_ALL) {
            try {
                // Determine if factory_id column exists
                const res = await client.query(`
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_name = $1 AND column_name = 'factory_id'
                `, [table]);

                if (res.rows.length > 0) {
                    await client.query(`UPDATE ${table} SET factory_id = $1 WHERE factory_id IS NULL`, [FID]);
                }

                // 3. Touch updated_at to force "Last Write Wins" dominance
                // checking valid updated_at column
                const res2 = await client.query(`
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_name = $1 AND column_name = 'updated_at'
                `, [table]);

                if (res2.rows.length > 0) {
                    await client.query(`UPDATE ${table} SET updated_at = NOW()`); // Force Local to be Newest
                    process.stdout.write('.');
                }

            } catch (e) {
                console.error(`Error processing ${table}:`, e.message);
            }
        }
        console.log('\n[DONE] All data marked for push.');

    } catch (e) {
        console.error('Script Error:', e);
    } finally {
        client.release();
        pool.end();
    }
}

forceFullSync();
