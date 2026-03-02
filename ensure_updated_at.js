
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

async function ensureUpdatedAt() {
    const client = await pool.connect();
    try {
        console.log('Checking updated_at columns for SYNC_ALL tables...');

        for (const table of SYNC_ALL) {
            try {
                // Check if column exists
                const res = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = $1 AND column_name = 'updated_at'
                `, [table]);

                if (res.rows.length === 0) {
                    console.log(`[FIX] Adding updated_at to ${table}...`);
                    await client.query(`ALTER TABLE ${table} ADD COLUMN updated_at TIMESTAMP DEFAULT NOW()`);
                } else {
                    // console.log(`[OK] ${table} has updated_at`);
                    process.stdout.write('.');
                }
            } catch (e) {
                console.error(`Error checking ${table}:`, e.message);
                // Continue to next table even if one fails (e.g. table doesn't exist)
            }
        }
        console.log('\nDone.');

    } catch (e) {
        console.error('Script Error:', e);
    } finally {
        client.release();
        pool.end();
    }
}

ensureUpdatedAt();
