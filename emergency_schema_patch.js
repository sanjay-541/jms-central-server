const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:SecureJPSMS_ProdDB_2026!@postgres:5432/jpsms'
});

async function runPatch() {
    const client = await pool.connect();
    try {
        console.log('Running missing schema patch...');
        await client.query('BEGIN');

        console.log('Adding global_access to users...');
        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS global_access BOOLEAN DEFAULT FALSE;
            -- Update superadmin
            UPDATE users SET global_access = TRUE WHERE role_code = 'superadmin' OR username = 'superadmin';
        `);

        console.log('Ensuring all transactional tables have sync_id and factory_id...');
        await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

        const transactionalTables = [
            'machines', 'moulds', 'plan_board', 'std_actual', 'dpr_hourly',
            'qc_online_reports', 'qc_issue_memos', 'qc_deviations',
            'shifting_records', 'machine_status_logs', 'operator_history',
            'planning_drops', 'assembly_plans', 'shift_teams',
            'or_jr_report', 'mould_planning_summary', 'date_master',
            'users'
        ];

        // We assume factory 1 exists (Dungra Plant 1) from the successful run 3
        for (const table of transactionalTables) {
            const check = await client.query(`SELECT to_regclass('public.${table}');`);
            if (check.rows[0].to_regclass) {
                await client.query(`
                    ALTER TABLE ${table} 
                    ADD COLUMN IF NOT EXISTS factory_id INTEGER DEFAULT 1,
                    ADD COLUMN IF NOT EXISTS sync_id UUID DEFAULT uuid_generate_v4();
                `);
            }
        }

        console.log('Ensuring role_code is created on Users if missing...');
        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS role_code VARCHAR(50) DEFAULT 'operator';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
            ALTER TABLE users ADD COLUMN IF NOT EXISTS line VARCHAR(50);
        `);

        await client.query('COMMIT');
        console.log('Patch complete!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Patch failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

runPatch();
