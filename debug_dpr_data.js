
const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

const run = async () => {
    try {
        const date = new Date().toISOString().split('T')[0];
        const shift = 'Day'; // Default to Day for testing

        console.log(`Checking data for ${date} - ${shift}`);

        // 1. Check Raw DPR Data
        const resDpr = await pool.query(`
            SELECT id, machine, hour_slot, mould_no, plan_id, good_qty 
            FROM dpr_hourly 
            WHERE dpr_date::date = $1::date 
            LIMIT 5
        `, [date]);

        console.log("\n--- Raw DPR Entries (First 5) ---");
        if (resDpr.rows.length === 0) console.log("No DPR entries found for today.");
        else console.table(resDpr.rows);

        // 2. Check Join
        const resJoin = await pool.query(`
            SELECT 
                d.machine, d.mould_no, 
                m.erp_item_code, m.product_name, m.pcs_per_hour
            FROM dpr_hourly d
            LEFT JOIN moulds m ON TRIM(m.erp_item_code) = TRIM(d.mould_no)
            WHERE d.dpr_date::date = $1::date
            LIMIT 5
        `, [date]);

        console.log("\n--- Joined Data (First 5) ---");
        console.table(resJoin.rows);

        // 4. Test the FINAL/PROPOSED Query that was added to server.js
        console.log("\n--- Testing Proposed Query Fix ---");
        const resFix = await pool.query(`
          SELECT 
            d.machine, d.hour_slot, d.good_qty, 
            d.mould_no as dpr_mould_no,
            mps.mould_no as plan_mould_no,
            COALESCE(d.mould_no, mps.mould_no) as effective_mould_no,
            COALESCE(m.product_name, m.erp_item_name, mps.mould_name, d.mould_no, mps.mould_no) as mould_name
          FROM dpr_hourly d
          LEFT JOIN (
              SELECT DISTINCT ON (machine_name, plan_date) machine_name, plan_date, mould_no, mould_name 
              FROM mould_planning_summary
          ) mps ON mps.machine_name = d.machine AND mps.plan_date = d.dpr_date::date
          LEFT JOIN moulds m ON TRIM(m.erp_item_code) = TRIM(COALESCE(d.mould_no, mps.mould_no))
          WHERE d.dpr_date::date = $1::date
          LIMIT 5
        `, [date]);

        console.table(resFix.rows);

        // 3. Check specific Mould Code if found in DPR but not in Join
        if (resDpr.rows.length > 0 && resDpr.rows[0].mould_no) {
            const mCode = resDpr.rows[0].mould_no;
            const resMould = await pool.query(`SELECT * FROM moulds WHERE TRIM(erp_item_code) = TRIM($1)`, [mCode]);
            console.log(`\n--- Looking up Mould '${mCode}' in Moulds Table ---`);
            console.table(resMould.rows);
        } else {
            console.log("\n--- Inspecting assembly_plans Schema ---");
            const cols = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'assembly_plans'`);
            console.table(cols.rows);

            console.log("\n--- Sample assembly_plans Data (All Columns) ---");
            const samp = await pool.query(`SELECT id, table_id, item_name, start_time, end_time FROM assembly_plans ORDER BY created_at DESC LIMIT 5`);
            console.table(samp.rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
};

run();
