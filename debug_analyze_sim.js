
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:Sanjay%40541%23%23@localhost:5432/jpsms',
});

async function run() {
    const client = await pool.connect();
    try {
        // Simulate /api/analyze/order/:orderNo
        const orderNo = 'JR/JG/2526/4620';
        console.log(`Analyzing Order: ${orderNo}`);

        // 1. Fetch Logs
        const res = await client.query(`
      SELECT 
        d.colour, 
        d.good_qty, 
        d.reject_qty, 
        d.downtime_min, 
        d.created_at,
        d.reject_breakup,
        d.downtime_breakup,
        d.act_weight,
        d.actual_cavity,
        d.votes,
        pb.plan_qty,
        pb.item_code,
        COALESCE(pb.mould_name, d.mould_name) as mould_name
      FROM dpr_hourly d
      LEFT JOIN plan_board pb ON CAST(pb.id AS TEXT) = CAST(d.plan_id AS TEXT) OR pb.plan_id = d.plan_id
      WHERE TRIM(d.order_no) = $1 OR TRIM(pb.order_no) = $1
      ORDER BY d.created_at DESC
    `, [orderNo]);

        // Simulate aggregation
        const logs = res.rows;
        let totalGood = 0;
        let totalRej = 0;

        console.log(`Found ${logs.length} entries.`);
        logs.forEach(l => {
            totalGood += Number(l.good_qty || 0);
            totalRej += Number(l.reject_qty || 0);
        });

        console.log(`Total Good (Number): ${totalGood}`);
        console.log(`Total Rej (Number): ${totalRej}`);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
