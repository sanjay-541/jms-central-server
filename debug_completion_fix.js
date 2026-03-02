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
        console.log('--- STARTING DIAGNOSTIC ---');

        // 1. Get all Incomplete Orders that have activity
        const res = await pool.query(`
      SELECT DISTINCT order_no FROM plan_board
      WHERE status != 'Completed'
      UNION
      SELECT DISTINCT order_no FROM planning_drops
    `);

        // Also check orders table status
        const candidates = [];
        for (const r of res.rows) {
            const oRes = await pool.query(`SELECT status FROM orders WHERE order_no = $1`, [r.order_no]);
            if (oRes.rows.length && oRes.rows[0].status !== 'Completed') {
                candidates.push(r.order_no);
            }
        }

        console.log(`Found ${candidates.length} candidate pending orders with activity.`);

        for (const orderNo of candidates) {
            // A. Total
            // UPDATED LOGIC: Use mould_planning_report
            const reportRes = await pool.query(
                `SELECT COUNT(DISTINCT mould_name)::int as total FROM mould_planning_report WHERE or_jr_no = $1`,
                [orderNo]
            );
            let total = (reportRes.rows[0] && reportRes.rows[0].total) ? Number(reportRes.rows[0].total) : 0;

            // Fallback (Logic from server.js)
            if (total === 0) {
                const mRes = await pool.query(`SELECT item_code FROM orders WHERE order_no = $1`, [orderNo]);
                if (mRes.rows.length) {
                    const mm = await pool.query('SELECT COUNT(*)::int as total FROM moulds WHERE erp_item_code = $1', [mRes.rows[0].item_code]);
                    total = (mm.rows[0] && mm.rows[0].total) ? Number(mm.rows[0].total) : 0;
                }
            }

            // B. Planned
            const planRes = await pool.query(
                `SELECT COUNT(DISTINCT mould_name)::int as cnt FROM plan_board WHERE order_no = $1`,
                [orderNo]
            );
            const planned = (planRes.rows[0] && planRes.rows[0].cnt) ? Number(planRes.rows[0].cnt) : 0;

            // C. Dropped
            const dropRes = await pool.query(
                `SELECT COUNT(DISTINCT mould_name)::int as cnt FROM planning_drops WHERE order_no = $1`,
                [orderNo]
            );
            const dropped = (dropRes.rows[0] && dropRes.rows[0].cnt) ? Number(dropRes.rows[0].cnt) : 0;

            console.log(`Order: ${orderNo} | Total: ${total} | Planned: ${planned} | Dropped: ${dropped}`);

            if (total > 0 && (planned + dropped) >= total) {
                console.log(`>>> FIXING: Order ${orderNo} should be COMPLETED.`);
                await pool.query(
                    `UPDATE orders SET status = 'Completed', updated_at = NOW() WHERE order_no = $1`,
                    [orderNo]
                );
            } else {
                console.log(`... Pending (Needs ${total - (planned + dropped)} more)`);
            }
        }

        console.log('--- DONE ---');

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
