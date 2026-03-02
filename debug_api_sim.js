
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:Sanjay%40541%23%23@localhost:5432/jpsms',
});

async function run() {
    const client = await pool.connect();
    try {
        // 1. Identify Machine for shots=77
        const mRes = await client.query(`SELECT line, machine FROM dpr_hourly WHERE shots=77 LIMIT 1`);
        if (!mRes.rows.length) { console.log('No entry found with 77 shots'); return; }

        const { line, machine } = mRes.rows[0];
        console.log(`Found Entry for Line: ${line}, Machine: ${machine}`);

        // 2. Simulate API Query
        const res = await client.query(`
      SELECT
        id           AS "UniqueID",
        shots        AS "Shots",
        colour       AS "Colour"
      FROM dpr_hourly
      WHERE line = $1 AND machine = $2
      ORDER BY dpr_date DESC, created_at DESC
      LIMIT 5
    `, [line, machine]);

        console.log('API Simulation Output:');
        console.table(res.rows);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
