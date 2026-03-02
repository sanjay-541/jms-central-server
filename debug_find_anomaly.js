
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function findAnomaly() {
    console.log('Searching for anomalies...');

    try {
        // 1. Search for OrJrNo ending in 488 or 550
        const orRes = await pool.query(`
        SELECT or_jr_no, jr_qty FROM or_jr_report 
        WHERE or_jr_no LIKE '%488' OR or_jr_no LIKE '%550'
    `);
        if (orRes.rows.length > 0) {
            console.log('\n[OR-JR] Found specific suffixes:');
            orRes.rows.forEach(r => console.log(r));
        }

        // 2. Search for Plan Qty 488 or 550
        const planRes = await pool.query(`
        SELECT * FROM plan_board 
        WHERE plan_qty = 488 OR plan_qty = 550
    `);
        if (planRes.rows.length > 0) {
            console.log('\n[Plan Board] Found specific quantities:');
            planRes.rows.forEach(r => console.log(`${r.plan_id}: ${r.order_no} (Qty: ${r.plan_qty})`));
        }

        // 3. Search for huge quantities in Summary
        const hugeRes = await pool.query(`
        SELECT id, or_jr_no, mould_item_qty FROM mould_planning_summary 
        WHERE mould_item_qty > 14000
        LIMIT 10
    `);
        if (hugeRes.rows.length > 0) {
            console.log('\n[Summary] Found Huge Quantities (>14000):');
            hugeRes.rows.forEach(r => console.log(r));
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

findAnomaly();
