
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function testCreateLimit() {
    const client = await pool.connect();
    try {
        console.log('--- Testing Create Plan API Logic ---');

        // 1. Get a valid machine
        const mRes = await client.query('SELECT machine FROM machines LIMIT 1');
        const machine = mRes.rows[0].machine;
        console.log('Using Machine:', machine);

        // 2. Get Max Seq
        const res = await client.query(`SELECT COALESCE(MAX(seq),0) AS mx FROM plan_board WHERE plant='DUNGRA' AND machine=$1`, [machine]);
        console.log('Current Max Seq:', res.rows[0].mx);

        // 3. Simulate Insert
        console.log('Simulating Insert...');
        const planId = `TEST-${Date.now()}`;
        const insertRes = await client.query(`
            INSERT INTO plan_board
            (plan_id, plant, building, line, machine, seq,
             order_no, item_code, item_name, mould_name,
             plan_qty, bal_qty, start_date, end_date, status, updated_at)
            VALUES
            ($1, 'DUNGRA', 'B1', 'L1', $2, 999,
             'TEST-ORDER', 'TEST-ITEM', 'Test Product', 'Test Mould',
             100, 100, NOW(), null, 'PLANNED', NOW())
            RETURNING id
        `, [planId, machine]);

        console.log('Insert Success. ID:', insertRes.rows[0].id);

        // 4. Clean up
        await client.query('DELETE FROM plan_board WHERE id = $1', [insertRes.rows[0].id]);
        console.log('Cleaned up test row.');

    } catch (err) {
        console.error('API Test Failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

testCreateLimit();
