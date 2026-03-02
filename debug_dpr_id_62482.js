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
        const id = 62482;
        console.log(`--- Inspecting DPR ID: ${id} ---`);

        // 1. Get Record
        const res = await pool.query('SELECT * FROM dpr_hourly WHERE id = $1', [id]);
        if (res.rowCount === 0) return console.log('Record not found');

        const r = res.rows[0];
        console.table([r]);

        // 2. Check if it appears in Summary Query (New Logic)
        console.log('\n--- Simulation (New Logic) ---');
        const sumRes = await pool.query(`
            SELECT 
                d.id, d.machine, d.hour_slot, d.good_qty,
                COALESCE(TRIM(d.mould_no), TRIM(pb.item_code), TRIM(mps.mould_no)) as mould_no,
                TRIM(COALESCE(d.mould_name, pb.mould_name, mps.mould_name)) as mould_name,
                TRIM(COALESCE(d.product_name, pb.item_name)) as product_name
            FROM dpr_hourly d
            LEFT JOIN plan_board pb ON CAST(pb.id AS TEXT) = CAST(d.plan_id AS TEXT)
            LEFT JOIN mould_planning_summary mps ON mps.or_jr_no = d.order_no AND mps.mould_name = pb.mould_name
            WHERE d.id = $1
        `, [id]);

        console.table(sumRes.rows);

        // 3. Check Machine Line
        const m = await pool.query('SELECT line FROM machines WHERE machine = $1', [r.machine]);
        if (m.rowCount > 0) console.log(`Machine Line: ${m.rows[0].line}`);
        else console.log('Machine NOT in Master!');

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
