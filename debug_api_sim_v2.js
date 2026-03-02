
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:Sanjay%40541%23%23@localhost:5432/jpsms',
});

async function run() {
    const client = await pool.connect();
    try {
        // 1. Identify Machine for shots=77 (or similar problematic ones like 45, 62)
        // We already know Line: B -L4,C -L4, Machine: C -L4>OM-100-14 from previous step?
        // Wait, step 394 said: Found Entry for Line: B -L4,C -L4, Machine: C -L4>OM-100-14

        // Let's re-query to be safe
        const mRes = await client.query(`SELECT line, machine FROM dpr_hourly WHERE shots=77 LIMIT 1`);
        if (!mRes.rows.length) { console.log('No entry found with 77 shots'); return; }

        const { line, machine } = mRes.rows[0];
        console.log(`Testing with Line: ${line}, Machine: ${machine}`);

        // 2. Simulate API Query with NEW Logic
        const query = `
      SELECT
        id           AS "UniqueID",
        shots        AS "Shots",
        plan_id,
        COALESCE(colour, 
          (SELECT data->>'mould_item_name' FROM jc_details WHERE data->>'or_jr_no' = dpr_hourly.order_no AND data->>'mould_no' = dpr_hourly.mould_no LIMIT 1),
          (SELECT jd.data->>'mould_item_name' 
             FROM plan_board pb 
             JOIN jc_details jd ON jd.data->>'or_jr_no' = pb.order_no 
             WHERE (pb.plan_id = dpr_hourly.plan_id OR CAST(pb.id AS TEXT) = dpr_hourly.plan_id)
             -- Try to match specific item/mould code if possible to pick right color
             AND (jd.data->>'mould_no' = pb.item_code OR jd.data->>'item_code' = pb.item_code)
             LIMIT 1
          )
        ) AS "Colour"
      FROM dpr_hourly
      WHERE line = $1 AND machine = $2
      ORDER BY dpr_date DESC, created_at DESC
      LIMIT 10
    `;

        const res = await client.query(query, [line, machine]);

        console.log('API Simulation Output (New Logic):');
        console.table(res.rows);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
