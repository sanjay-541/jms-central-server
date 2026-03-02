
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:Sanjay%40541%23%23@localhost:5432/jpsms',
});

async function run() {
    const client = await pool.connect();
    try {
        const machine = 'B -L1>HYD-350-1';
        const date = '2026-01-24';
        const shift = 'Day';

        console.log('--- Simulating API Query with TRIM() ---');

        // Query mimicking the updated server.js logic
        const res = await client.query(`
      SELECT 
        d.machine, 
        TRIM(d.mould_no) as trimmed_mould_no,
        TRIM(d.order_no) as trimmed_order_no,
        d.shots
      FROM dpr_hourly d
      WHERE d.machine = $1 AND d.dpr_date::date = $2::date AND d.shift = $3
      LIMIT 5
    `, [machine, date, shift]);

        console.table(res.rows);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
