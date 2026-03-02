
const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    try {
        console.log('--- INVESTIGATION START ---');
        const orderNo = 'JR/JG/2526/5046';
        const machine = 'B -L1>HYD-350-2';

        // 1. Fetch Plans
        const plans = await pool.query(`
      SELECT id, plan_id, status, plan_qty, bal_qty, machine, order_no
      FROM plan_board 
      WHERE order_no = $1
    `, [orderNo]);

        console.log(`Found ${plans.rows.length} plans for Order ${orderNo}:`);

        for (const p of plans.rows) {
            console.log(`\nPLAN: ID=${p.id} | PlanID=${p.plan_id} | Status=${p.status} | Machine=${p.machine} | Qty=${p.plan_qty}`);

            // 2. Fetch DPR Sum for this Plan
            const dpr = await pool.query(`
        SELECT COUNT(*) as cnt, SUM(good_qty) as total_good
        FROM dpr_hourly
        WHERE plan_id = $1
      `, [p.plan_id]);

            const res = dpr.rows[0];
            console.log(`   -> DPR Entries: ${res.cnt} | Total Good: ${res.total_good || 0}`);

            const bal = p.plan_qty - (res.total_good || 0);
            console.log(`   -> Calculated Balance: ${bal}`);

            // 3. Check Colors
            const dprColors = await pool.query(`SELECT colour, SUM(good_qty) as total FROM dpr_hourly WHERE plan_id = $1 GROUP BY colour`, [p.plan_id]);
            console.log('   -> DPR Counts Summary:');
            dprColors.rows.forEach(r => console.log(`      Color: "${r.colour}" | Total: ${r.total}`));

            // 4. Check JC Details (Fuzzy)
            const jc = await pool.query(`
        SELECT data 
        FROM jc_details 
        WHERE UPPER(data->>'or_jr_no') = UPPER($1)
      `, [orderNo]);

            console.log(`   -> JC Details found: ${jc.rows.length}`);
            jc.rows.forEach(r => {
                console.log('      JC Object Keys:', Object.keys(r.data));
                // Try to find the name fields
                const name = r.data.mould_item_name || r.data.mold_item_name || r.data.item_name || r.data.ItemName;
                const qty = r.data.mould_item_qty || r.data.mold_item_qty || r.data.item_qty || r.data.plan_qty;
                console.log('      JC Item:', name, ' Qty:', qty);
            });

        }

        console.log('\n--- MACHINES CHECK ---');
        // Check if machine string matches exactly
        const mCheck = await pool.query(`SELECT machine FROM plan_board WHERE machine LIKE $1`, ['%HYD-350-2%']);
        console.log(`Machines matching %HYD-350-2%:`, mCheck.rows.map(r => r.machine));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
