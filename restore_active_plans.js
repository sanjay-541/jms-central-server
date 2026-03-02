
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function restore() {
    console.log('Restoring deleted active plans...');

    try {
        // 1. Get Orphans (from DPR last 48h to be safe, filtering those missing in plan_board)
        const recentDpr = await pool.query(`
        SELECT DISTINCT d.plan_id, d.machine, d.order_no, d.mould_no, d.line, d.jobcard_no
        FROM dpr_hourly d
        WHERE d.created_at > NOW() - INTERVAL '3 DAYS' -- Extended range
    `);

        let restoredCount = 0;

        for (const d of recentDpr.rows) {
            // Check if exists
            const check = await pool.query('SELECT 1 FROM plan_board WHERE plan_id = $1 OR CAST(id AS TEXT) = $1', [d.plan_id]);
            if (check.rows.length > 0) continue; // It exists, safe.

            console.log(`Restoring Plan ${d.plan_id} for ${d.order_no} on ${d.machine}`);

            // Fetch details from plan_board (any sibling?) OR Order Report
            // We need: item_code, item_name, mould_name, plan_qty

            // 1. Try to find other plans for this order to copy details
            const sibling = await pool.query('SELECT * FROM plan_board WHERE order_no = $1 LIMIT 1', [d.order_no]);
            let details = {};

            if (sibling.rows.length > 0) {
                const s = sibling.rows[0];
                details = {
                    item_code: s.item_code,
                    item_name: s.item_name,
                    mould_name: s.mould_name,
                    plant: s.plant,
                    building: s.building,
                    plan_qty: s.plan_qty // Copy Qty or use default?
                };
            } else {
                // Fallback to OR-JR Report
                const rep = await pool.query('SELECT * FROM or_jr_report WHERE or_jr_no = $1', [d.order_no]);
                if (rep.rows.length > 0) {
                    const r = rep.rows[0];
                    details = {
                        item_code: r.item_code,
                        item_name: r.product_name,
                        mould_name: r.product_name, // fallback
                        plant: 'DUNGRA', // Default
                        building: 'MAIN',
                        plan_qty: r.jr_qty
                    };
                }
            }

            // Use d.mould_no to find mould_name if missing
            if (!details.mould_name && d.mould_no) {
                const mRes = await pool.query('SELECT product_name FROM moulds WHERE erp_item_code = $1 LIMIT 1', [d.mould_no]);
                if (mRes.rows.length) details.mould_name = mRes.rows[0].product_name;
            }

            // Insert restored plan
            // If plan_id looks like an int (legacy ID), we might need to be careful.
            // dpr_hourly.plan_id is string.
            // We will insert with provided plan_id.

            await pool.query(`
            INSERT INTO plan_board (
                plan_id, machine, line, order_no, 
                item_code, item_name, mould_name, 
                plan_qty, bal_qty, 
                start_date, status, updated_at,
                plant, building
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7,
                $8, $8,
                NOW(), 'RUNNING', NOW(),
                $9, $10
            ) 
        `, [
                d.plan_id, d.machine, d.line, d.order_no,
                details.item_code || 'Unknown', details.item_name || 'Restored Plan', details.mould_name || 'Unknown',
                details.plan_qty || 0,
                details.plant || 'DUNGRA', details.building || 'MAIN'
            ]);

            restoredCount++;
        }

        console.log(`\nSuccess! Restored ${restoredCount} active plans.`);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

restore();
