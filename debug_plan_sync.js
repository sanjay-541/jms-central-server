
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function checkPlan() {
    try {
        const res = await pool.query("SELECT id, order_no, machine, status, updated_at, sync_id, factory_id FROM plan_board WHERE status = 'Running'");
        if (res.rows.length === 0) {
            console.log('No Running Plans found.');
            // Check planned
            const res2 = await pool.query("SELECT id, order_no, machine, status, updated_at, sync_id, factory_id FROM plan_board ORDER BY updated_at DESC LIMIT 5");
            console.log('Recent Plans:');
            res2.rows.forEach(r => console.log(JSON.stringify(r)));
        } else {
            console.log('Running Plans:');
            res.rows.forEach(r => console.log(JSON.stringify(r)));
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkPlan();
