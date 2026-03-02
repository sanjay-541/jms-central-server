const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function verify() {
    const client = await pool.connect();
    try {
        const orderNo = 'JR/JG/2526/4454';

        await client.query('BEGIN');

        // 1. Insert Dummy Plan
        const insertRes = await client.query(`
        INSERT INTO plan_board (plan_id, plant, machine, order_no, status, start_date)
        VALUES ('TEST-PLAN-1', 'DUNGRA', 'TEST-MACH', $1, 'PLANNED', NOW())
        RETURNING id, plan_id
    `, [orderNo]);
        const newPlanId = insertRes.rows[0].plan_id;
        console.log(`Inserted Dummy Plan: ${newPlanId}`);

        // 2. Count Orphans for this order
        const orphans = await client.query(`
        SELECT count(*) as count, sum(good_qty) as total_qty 
        FROM dpr_hourly dh
        LEFT JOIN plan_board pb ON pb.id::TEXT = dh.plan_id::TEXT
        WHERE dh.order_no = $1 
        AND pb.id IS NULL
    `, [orderNo]);
        console.log(`Orphans for ${orderNo}: Count=${orphans.rows[0].count}, Qty=${orphans.rows[0].total_qty}`);

        // 3. Run the NEW Logic Query
        const newLogic = await client.query(`
        SELECT
            pb.plan_id,
            dpr.qty as produced_qty
        FROM plan_board pb
        LEFT JOIN LATERAL (
            SELECT SUM(good_qty) as qty
            FROM dpr_hourly dh
            WHERE dh.plan_id = pb.plan_id
            OR (
                dh.order_no = pb.order_no 
                AND dh.plan_id IS NOT NULL
                AND dh.plan_id != ''
                AND NOT EXISTS (SELECT 1 FROM plan_board pb_check WHERE pb_check.plan_id = dh.plan_id)
            )
        ) dpr ON true
        WHERE pb.plan_id = $1
    `, [newPlanId]);

        console.log('Result with NEW Logic (Should match Orphan Qty if correct):');
        console.table(newLogic.rows);

        await client.query('ROLLBACK');
        console.log('Rolled back test data.');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

verify();
