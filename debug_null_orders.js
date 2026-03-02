
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:Sanjay%40541%23%23@localhost:5432/jpsms',
});

async function run() {
    const client = await pool.connect();
    try {
        const machine = 'B -L1>HYD-350-1';
        const date = '2026-01-24';

        console.log(`Checking for NULL Order No entries for ${machine}...`);

        const res = await client.query(`
      SELECT id, mould_no, order_no, shots, created_at
      FROM dpr_hourly
      WHERE machine = $1 
        AND dpr_date::TEXT LIKE $2
        AND (order_no IS NULL OR order_no = '')
    `, [machine, date + '%']);

        if (res.rows.length > 0) {
            console.log(`FOUND ${res.rows.length} Problematic Entries (No Order No):`);
            console.table(res.rows);
        } else {
            console.log('No entries found with missing Order No.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
