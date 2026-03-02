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
        const res = await pool.query(`
            SELECT 
                count(*) as total, 
                count(mould_name) as has_name, 
                count(*) - count(mould_name) as missing_name 
            FROM dpr_hourly
        `);
        console.log('DPR Hourly Stats:');
        console.table(res.rows);

        if (parseInt(res.rows[0].missing_name) > 0) {
            console.log('Sample Missing Names:');
            const missing = await pool.query('SELECT id, plan_id, dpr_date, machine FROM dpr_hourly WHERE mould_name IS NULL LIMIT 5');
            console.table(missing.rows);
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
