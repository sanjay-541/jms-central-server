
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function checkPending() {
    console.log('Checking Pending Qty for PLANNED items...');

    try {
        // 1. Join with OR-JR and see how many have pending_qty = 0 or NULL
        // Also check date
        const res = await pool.query(`
        SELECT COUNT(*) as count, 
               SUM(CASE WHEN r.jr_qty IS NULL OR r.jr_qty = 0 THEN 1 ELSE 0 END) as zero_qty,
               SUM(CASE WHEN r.plan_date < '2025-10-01' THEN 1 ELSE 0 END) as old_date
        FROM plan_board pb
        JOIN or_jr_report r ON r.or_jr_no = pb.order_no
        WHERE pb.status = 'PLANNED'
    `);

        console.log('PLANNED Analysis:');
        console.log(res.rows[0]);

        // Check logic: If we have dpr entries matching total?
        // This is expensive.

        // User Mention: "Today Morning... showing 550 plans".
        // This suggests that something CHANGED that made 4000 old plans appear.
        // Did I *insert* them? No.
        // Did I *change status*? No.

        // Maybe the DUPLICATES issue was masking them? Or the user logic was filtering them?

        // Wait... if I had 14000 duplicates.
        // Maybe filtering was broken because of duplicates?

        // Corrective Action: Identify "Completed" plans and update status.
        // Logic: If OR-JR "jr_close" is 'Closed' or similar?
        // Let's check status columns in OR-JR.
        const orStatus = await pool.query(`
        SELECT jr_close, COUNT(*) 
        FROM or_jr_report 
        GROUP BY jr_close
    `);
        console.log('\nOR-JR Statuses:');
        orStatus.rows.forEach(r => console.log(r));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkPending();
