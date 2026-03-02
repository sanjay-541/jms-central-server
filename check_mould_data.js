const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres', host: 'localhost', database: 'jpsms', password: process.env.PGPASSWORD || 'Sanjay@541##', port: 5432
});

async function check() {
    try {
        console.log('--- Sample Moulds Data ---');
        const res = await pool.query(`
            SELECT id, erp_item_code, product_name, no_of_cav, machine 
            FROM moulds 
            LIMIT 20
        `);
        console.table(res.rows);

        console.log('\n--- Checking for 1322 ---');
        const res2 = await pool.query(`
            SELECT id, erp_item_code, product_name, no_of_cav 
            FROM moulds 
            WHERE erp_item_code::text LIKE '%1322%'
        `);
        console.table(res2.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
check();
