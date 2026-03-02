const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function check() {
    const machineName = 'B -L3>OM-150-7';
    // Use the current date as provided in metadata: 2026-02-07
    const queryDate = '2026-02-07';
    const shifts = ['Day', 'Night'];

    try {
        console.log(`--- Checking DPR for Machine: '${machineName}' on ${queryDate} ---`);

        for (const shift of shifts) {
            console.log(`\n=== SHIFT: ${shift} ===`);

            // 1. Raw Count
            const raw = await pool.query(`
                SELECT count(*) as cnt, array_agg(hour_slot) as slots 
                FROM dpr_hourly 
                WHERE machine = $1 AND dpr_date = $2 AND shift = $3
            `, [machineName, queryDate, shift]);

            console.log(`Raw DPR Hourly Count: ${raw.rows[0].cnt}`);
            console.log(`Slots: ${raw.rows[0].slots}`);

            // 2. Summary Logic Simulation
            const summary = await pool.query(`
                SELECT 
                    d.machine, d.hour_slot, 
                    TRIM(COALESCE(d.mould_name, pb.mould_name, mps.mould_name)) as mould_name,
                    TRIM(COALESCE(d.product_name, pb.item_name)) as product_name
                FROM dpr_hourly d
                LEFT JOIN plan_board pb ON CAST(pb.id AS TEXT) = CAST(d.plan_id AS TEXT)
                LEFT JOIN mould_planning_summary mps ON mps.or_jr_no = d.order_no AND mps.mould_name = pb.mould_name
                WHERE d.dpr_date = $1 AND d.shift = $2 AND d.machine = $3
            `, [queryDate, shift, machineName]);

            console.log(`Summary Matrix Count: ${summary.rowCount}`);
            if (summary.rowCount > 0) {
                console.log('Summary Data Sample:');
                console.table(summary.rows);
            } else {
                console.log('No rows returned by summary query.');
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

check();
