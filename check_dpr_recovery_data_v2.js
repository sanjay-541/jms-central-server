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
        console.log('--- MACHINES ---');
        const r = await pool.query('SELECT machine FROM machines ORDER BY machine');
        console.log(r.rows.map(x => x.machine));

        console.log('--- MOULDS SAMPLE (3146%) ---');
        const m = await pool.query("SELECT erp_item_code, product_name FROM moulds WHERE erp_item_code LIKE '3146%'");
        console.table(m.rows);

        // Also check if any exact match exists for typical DPR mould_no
        const total = await pool.query("SELECT count(*) FROM dpr_hourly");
        console.log('Total DPR Rows:', total.rows[0].count);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
