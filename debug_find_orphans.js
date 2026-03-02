
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function findOrphans() {
    console.log('Searching for recently active plans that were deleted...');

    try {
        // Look for DPR entries in the last 24 hours
        // GROUP BY plan_id to get distinct plans
        const recentDpr = await pool.query(`
        SELECT DISTINCT d.plan_id, d.machine, d.order_no, d.mould_no, d.line 
        FROM dpr_hourly d
        WHERE d.created_at > NOW() - INTERVAL '24 HOURS'
    `);

        console.log(`Found ${recentDpr.rows.length} active plans in DPR (last 24h).`);

        const orphans = [];

        for (const d of recentDpr.rows) {
            // Check if plan exists
            const res = await pool.query('SELECT 1 FROM plan_board WHERE plan_id = $1 OR CAST(id AS TEXT) = $1', [d.plan_id]); // Handle int/string mix
            if (res.rows.length === 0) {
                orphans.push(d);
            }
        }

        console.log(`Found ${orphans.length} ORPHANED plans (Deleted but were active).`);

        if (orphans.length > 0) {
            console.log('Example Orphans:');
            orphans.slice(0, 5).forEach(o => console.log(o));

            // Strategy: We can restore these!
            // We need: order_no, machine, mould_no, line.
            // We lack: plan_qty (we can assume balance or copy from Master), item_code, etc.
            // We can fetch details from valid orders/moulds using order_no.
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

findOrphans();
