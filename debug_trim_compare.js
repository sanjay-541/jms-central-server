
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

        // 1. Verify Setup Data (with TRIM now applied implicitly by the mock query if logic matched)
        // Server logic uses: TRIM(pb.order_no)
        const res = await client.query(`
      SELECT 
        s.machine, 
        TRIM(pb.order_no) as order_no,
        length(pb.order_no) as raw_len,
        length(TRIM(pb.order_no)) as trimmed_len
      FROM std_actual s
      LEFT JOIN plan_board pb ON pb.plan_id = s.plan_id
      WHERE s.machine = $1 AND s.dpr_date::date = $2::date
    `, [machine, date]);

        console.log('Setups (TRIMMED):');
        console.table(res.rows);

        // 2. Verify Entry Data (Matches server.js logic)
        const eRes = await client.query(`
      SELECT 
        id, 
        TRIM(order_no) as order_no
      FROM dpr_hourly
      WHERE machine = $1 AND dpr_date::date = $2::date
      LIMIT 5
    `, [machine, date]);

        console.log('Entries (TRIMMED):');
        console.table(eRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
