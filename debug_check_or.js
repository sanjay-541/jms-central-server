const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    try {
        const orNo = 'JR/JG/2526/3971';
        console.log(`Fetching data for ${orNo} from or_jr_report...`);

        const res = await pool.query(`
        SELECT 
            or_jr_no, 
            job_card_no, 
            mld_status, 
            is_closed, 
            jr_close,
            item_code,
            product_name
        FROM or_jr_report 
        WHERE or_jr_no = $1
    `, [orNo]);

        console.log('Rows Found:', res.rows.length);
        console.table(res.rows);

        // Also check orders table
        const orders = await pool.query(`SELECT * FROM orders WHERE order_no = $1`, [orNo]);
        console.log('\nOrders Table Entries:', orders.rows.length);
        console.table(orders.rows);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
