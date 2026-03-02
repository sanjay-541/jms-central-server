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
        console.log('--- DPR Hourly Samples ---');
        const res = await pool.query(`
            SELECT mould_no, order_no, machine, dpr_date 
            FROM dpr_hourly 
            LIMIT 10
        `);
        console.table(res.rows);

        console.log('--- Mould Master Samples ---');
        const mRes = await pool.query(`SELECT erp_item_code, product_name FROM moulds LIMIT 5`);
        console.table(mRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
