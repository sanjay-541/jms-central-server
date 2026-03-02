
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:Sanjay%40541%23%23@localhost:5432/jpsms',
});

async function run() {
    const client = await pool.connect();
    try {
        const machine = 'B -L1>HYD-350-1';
        const date = '2026-01-24'; // Match screenshot

        console.log(`--- Debugging Matching for ${machine} on ${date} ---`);

        // 1. Fetch Setups (std_actual)
        const setups = await client.query(`
      SELECT plan_id, mould_name, mould_no, created_at, order_no, article_act, machine
      FROM std_actual
      WHERE machine = $1 AND dpr_date = $2
    `, [machine, date]);
        console.log('Setups (std_actual):');
        console.table(setups.rows);

        // 2. Fetch Entries (dpr_hourly) - REMOVED mould_name
        const entries = await client.query(`
      SELECT id, mould_no, order_no, shots, colour, plan_id
      FROM dpr_hourly
      WHERE machine = $1 AND dpr_date = $2
    `, [machine, date]);
        console.log('Entries (dpr_hourly):');
        console.table(entries.rows);

        // 3. Check Plan Board for context
        if (setups.rows.length) {
            const pbRes = await client.query(`SELECT * FROM plan_board WHERE plan_id = $1`, [setups.rows[0].plan_id]);
            console.log('Plan Board for Setup:', pbRes.rows[0]);
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
