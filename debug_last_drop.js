const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'jpsms',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    port: process.env.PGPORT || 5432,
});

async function run() {
    try {
        console.log('--- CHECKING LAST DROP ---');

        // 1. Get most recent drop
        const dropRes = await pool.query(`SELECT * FROM planning_drops ORDER BY created_at DESC LIMIT 1`);
        if (!dropRes.rows.length) {
            console.log('No drops found.');
            return;
        }
        const drop = dropRes.rows[0];
        console.log('Last Drop:', drop);
        const orderNo = drop.order_no;

        // 2. Check Order Status
        const ordRes = await pool.query('SELECT status FROM orders WHERE order_no = $1', [orderNo]);
        const dStatus = (ordRes.rows[0] || {}).status;
        console.log(`Order ${orderNo} Status: ${dStatus}`);

        // 3. Run Logic check
        // A. Report Total
        const reportRes = await pool.query(
            `SELECT COUNT(DISTINCT mould_name)::int as total FROM mould_planning_report WHERE or_jr_no = $1`,
            [orderNo]
        );
        let total = (reportRes.rows[0] && reportRes.rows[0].total) ? Number(reportRes.rows[0].total) : 0;

        // B. Planned
        const planRes = await pool.query(
            `SELECT COUNT(DISTINCT mould_name)::int as cnt FROM plan_board WHERE order_no = $1`,
            [orderNo]
        );
        const planned = (planRes.rows[0] && planRes.rows[0].cnt) ? Number(planRes.rows[0].cnt) : 0;

        // C. Dropped
        const dropCountRes = await pool.query(
            `SELECT COUNT(DISTINCT mould_name)::int as cnt FROM planning_drops WHERE order_no = $1`,
            [orderNo]
        );
        const dropped = (dropCountRes.rows[0] && dropCountRes.rows[0].cnt) ? Number(dropCountRes.rows[0].cnt) : 0;

        console.log(`\n--- ANALYSIS ---`);
        console.log(`Order: ${orderNo}`);
        console.log(`Total (Report): ${total}`);
        console.log(`Planned:        ${planned}`);
        console.log(`Dropped:        ${dropped}`);
        console.log(`Sum (P+D):      ${planned + dropped}`);

        if ((planned + dropped) >= total && total > 0) {
            console.log(`RESULT: Should be COMPLETED.`);
        } else {
            console.log(`RESULT: Still Pending.`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
