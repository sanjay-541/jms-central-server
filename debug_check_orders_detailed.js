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
        const term = '%2526/3841%';
        console.log(`Fetching orders matching ${term}...`);

        const res = await pool.query(`
        SELECT 
            id,
            order_no,
            encode(order_no::bytea, 'hex') as hex_or,
            status,
            encode(status::bytea, 'hex') as hex_status,
            created_at
        FROM orders 
        WHERE order_no LIKE $1
    `, [term]);

        console.table(res.rows);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
