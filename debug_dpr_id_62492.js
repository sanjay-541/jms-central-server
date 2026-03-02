const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function check() {
    try {
        const id = 62492;
        console.log(`--- Inspecting DPR ID: ${id} ---`);

        // 1. Get Record Details
        const res = await pool.query(`
            SELECT * FROM dpr_hourly WHERE id = $1
        `, [id]);

        if (res.rowCount === 0) {
            console.log('Record not found!');
            return;
        }

        const row = res.rows[0];
        console.table([row]);

        // 2. Check if Machine exists and is active
        console.log(`\nChecking Machine: '${row.machine}'...`);
        const m = await pool.query(`
            SELECT * FROM machines WHERE machine = $1
        `, [row.machine]);

        if (m.rowCount > 0) {
            console.log('Machine Status:', m.rows[0].is_active ? 'ACTIVE' : 'INACTIVE');
        } else {
            console.log('Machine NOT FOUND in master table!');
        }

        // 3. Simulate Summary Query for this specific Machine/Date/Shift
        console.log(`\nSimulating Summary Query for ${row.dpr_date} (${row.shift})...`);
        const summary = await pool.query(`
             SELECT 
                d.machine, d.hour_slot, 
                TRIM(COALESCE(d.mould_name, pb.mould_name, mps.mould_name)) as mould_name,
                TRIM(COALESCE(d.product_name, pb.item_name)) as product_name
            FROM dpr_hourly d
            LEFT JOIN plan_board pb ON CAST(pb.id AS TEXT) = CAST(d.plan_id AS TEXT)
            LEFT JOIN mould_planning_summary mps ON mps.or_jr_no = d.order_no AND mps.mould_name = pb.mould_name
            WHERE d.id = $1
        `, [id]);

        console.table(summary.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
