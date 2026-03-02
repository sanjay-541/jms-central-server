const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('Dropping Unique Constraint on orders(order_no)...');

        // Drop Constraint
        try {
            await client.query(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_order_no_key`);
        } catch (e) {
            console.log('Error dropping constraint (might not exist):', e.message);
        }

        // Also drop index if it exists explicitly
        try {
            await client.query(`DROP INDEX IF EXISTS orders_order_no_key`);
        } catch (e) { }

        await client.query('COMMIT');
        console.log('Migration successful: orders table now allows duplicate order_no.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
