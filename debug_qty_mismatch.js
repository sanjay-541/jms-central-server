
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function debugQty() {
    const ord = 'JR/JG/2526/4395';
    console.log(`Debug Qty for: ${ord}`);

    try {
        // 1. Summary (Master Plan)
        const sumRes = await pool.query('SELECT id, mould_no, jr_qty, mould_item_qty FROM mould_planning_summary WHERE or_jr_no = $1', [ord]);
        console.log('\n[Master Plan] mould_planning_summary:');
        sumRes.rows.forEach(r => console.log(r));

        // 2. Plan Board (Running/Planned)
        const boardRes = await pool.query('SELECT id, plan_id, status, plan_qty, bal_qty, machine FROM plan_board WHERE order_no = $1', [ord]);
        console.log('\n[Plan Board] plan_board:');
        boardRes.rows.forEach(r => console.log(r));

        // 3. Check for specific numbers mentioned (488, 550, 14000)
        // Maybe they are in the result?

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

debugQty();
