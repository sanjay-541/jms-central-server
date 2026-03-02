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
        console.log('--- Testing DPR Recent SQL Fix ---');
        // Simulate: line = undefined (so null), machine = 'B -L4>AKAR-110-3'
        const line = null;
        const machine = 'B -L4>AKAR-110-3'; // A known machine from previous dump

        const res = await pool.query(`
            SELECT id, dpr_date, hour_slot
            FROM dpr_hourly
            WHERE machine = $2 AND ($1::text IS NULL OR line = $1)
            ORDER BY dpr_date DESC, created_at DESC
            LIMIT 5
        `, [line, machine]);

        console.log(`Query returned ${res.rowCount} rows.`);
        if (res.rowCount > 0) {
            console.log('Sample Row:', res.rows[0]);
        } else {
            console.log('No rows returned. Is machine name correct?');
        }

        console.log('\n--- Checking partial Mould 4704 ---');
        const m = await pool.query("SELECT erp_item_code, product_name FROM moulds WHERE erp_item_code LIKE '4704%'");
        console.table(m.rows);

    } catch (e) {
        console.error('SQL Error:', e);
    } finally {
        pool.end();
    }
}

check();
