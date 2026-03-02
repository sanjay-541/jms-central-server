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
                count(mould_no) as has_mould_no,
                count(order_no) as has_order_no
            FROM dpr_hourly
        `);
        console.table(res.rows);

        // Check if we can link to moulds
        const linkTest = await pool.query(`
            SELECT count(*) as linkable_moulds
            FROM dpr_hourly d
            JOIN moulds m ON m.erp_item_code = d.mould_no
            WHERE d.mould_name IS NULL
        `);
        console.log('Records recoverable via Mould Master:', linkTest.rows[0].linkable_moulds);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
