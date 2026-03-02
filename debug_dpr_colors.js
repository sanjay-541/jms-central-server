
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:Sanjay%40541%23%23@localhost:5432/jpsms',
});

async function run() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT id, dpr_date, hour_slot, shots, colour, plan_id, created_at
      FROM dpr_hourly 
      WHERE shots IN (77, 45, 62, 73)
      ORDER BY created_at DESC 
      LIMIT 10
    `);
        console.log('Matching DPR Entries (shots 77, 45, 62, 73):');
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
