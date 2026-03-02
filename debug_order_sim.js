
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:Sanjay%40541%23%23@localhost:5432/jpsms',
});

async function run() {
    const client = await pool.connect();
    try {
        const orderNo = 'JR/JG/2526/4620';
        console.log(`--- Testing Info Query for ${orderNo} ---`);
        const infoRes = await client.query(`
      SELECT 
        pb.plan_qty, 
        pb.item_code,
        s.article_act as act_weight,
        COALESCE(m.std_wt_kg, m2.std_wt_kg) as std_weight, 
        COALESCE(m.cycle_time, m2.cycle_time) as std_cycle,
        COALESCE(m.no_of_cav, m2.no_of_cav) as std_cavity
      FROM plan_board pb 
      LEFT JOIN std_actual s ON s.plan_id = pb.plan_id
      LEFT JOIN moulds m ON m.product_name = pb.mould_name
      LEFT JOIN moulds m2 ON m2.erp_item_name = pb.mould_name
      WHERE TRIM(pb.order_no) = $1
      LIMIT 1
    `, [orderNo]);
        console.table(infoRows = infoRes.rows);

        console.log(`--- Testing Logs Query for ${orderNo} ---`);
        const logsRes = await client.query(`
      SELECT 
        colour, 
        good_qty, 
        downtime_min, 
        downtime_breakup
      FROM dpr_hourly 
      WHERE TRIM(order_no) = $1
    `, [orderNo]);
        console.log(`Logs Found: ${logsRes.rows.length}`);
        const stats = {};
        logsRes.rows.forEach(r => {
            const c = r.colour || 'Unknown';
            if (!stats[c]) stats[c] = 0;
            stats[c] += Number(r.good_qty);
        });
        console.log('Colour Aggregation (Number Test): ', stats);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
