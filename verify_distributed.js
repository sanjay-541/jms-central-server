const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'jpsms',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    port: process.env.PGPORT || 5432,
});

async function verify() {
    console.log('--- JMS Distributed System Verification ---');

    const client = await pool.connect();
    try {
        // 1. Check Tables
        const tables = ['factories', 'user_factories', 'server_config', 'users'];
        for (const t of tables) {
            const res = await client.query(`SELECT to_regclass('public.${t}')`);
            if (res.rows[0].to_regclass) {
                console.log(`[OK] Table '${t}' exists.`);
            } else {
                console.error(`[FAIL] Table '${t}' MISSING!`);
            }
        }

        // 2. Check Columns in Users
        const userCols = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name IN ('global_access', 'id', 'factory_id', 'sync_id')
        `);
        const foundCols = userCols.rows.map(r => r.column_name);
        if (foundCols.includes('global_access')) console.log('[OK] users.global_access exists.');
        else console.error('[FAIL] users.global_access MISSING');

        // 3. Check Sync Columns in Transactional Table
        const dprCols = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'dpr_hourly' AND column_name IN ('factory_id', 'sync_id')
        `);
        if (dprCols.rows.length === 2) console.log('[OK] dpr_hourly has sync columns.');
        else console.error(`[FAIL] dpr_hourly missing sync columns. Found: ${dprCols.rows.map(r => r.column_name)}`);

        // 4. Check Server Config
        const config = await client.query('SELECT * FROM server_config');
        console.log('[INFO] Server Config:', config.rows);

    } catch (e) {
        console.error('Verification Failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

verify();
