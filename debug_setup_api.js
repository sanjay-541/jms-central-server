
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

        // Verify Setup Data Query (from server.js)
        const res = await client.query(`
      SELECT 
        s.machine, s.plan_id, s.mould_name, pb.order_no,
        COALESCE(m.erp_item_code, m2.erp_item_code) as mould_no,
        m.product_name as m1_name,
        m.erp_item_code as m1_code,
        m2.product_name as m2_name,
        m2.erp_item_code as m2_code
      FROM std_actual s
      LEFT JOIN plan_board pb ON pb.plan_id = s.plan_id
      LEFT JOIN moulds m ON TRIM(m.erp_item_code) = TRIM(COALESCE(pb.mould_code, ''))
      LEFT JOIN moulds m2 ON m2.product_name = s.mould_name OR m2.erp_item_name = s.mould_name
      WHERE s.dpr_date::date = $1::date AND s.shift = $2 AND s.machine = $3
    `, [date, shift, machine]);

        console.log('Simulated API Setup Response:');
        console.table(res.rows);

        // Verify Entry Data
        const eRes = await client.query(`
        SELECT mould_no, mould_name, order_no, shots, plan_id 
        FROM dpr_hourly 
        WHERE dpr_date::date = $1::date AND shift = $2 AND machine = $3
    `, [date, shift, machine]);
        console.log('Entries:');
        console.table(eRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
