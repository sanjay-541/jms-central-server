
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

        // 1. Verify Setup Data
        const res = await client.query(`
      SELECT 
        s.machine, s.plan_id, s.mould_name, pb.order_no,
        COALESCE(m.erp_item_code, m2.erp_item_code) as mould_no,
        pb.item_code as pb_item_code
      FROM std_actual s
      LEFT JOIN plan_board pb ON pb.plan_id = s.plan_id
      LEFT JOIN moulds m ON TRIM(m.erp_item_code) = TRIM(COALESCE(pb.mould_code, ''))
      LEFT JOIN moulds m2 ON m2.product_name = s.mould_name OR m2.erp_item_name = s.mould_name
      WHERE s.machine = $1 AND s.dpr_date::TEXT LIKE $2
    `, [machine, date + '%']);

        console.log(`Setups Found: ${res.rows.length}`);
        if (res.rows.length) console.table(res.rows);

        // 2. Verify Entry Data (Fixed Columns)
        const eRes = await client.query(`
        SELECT id, mould_no, order_no, shots, plan_id 
        FROM dpr_hourly 
        WHERE machine = $1 AND dpr_date::TEXT LIKE $2
        LIMIT 10
    `, [machine, date + '%']);

        console.log(`Entries Found: ${eRes.rows.length}`);
        if (eRes.rows.length) console.table(eRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
