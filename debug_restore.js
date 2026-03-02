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
        console.log("Starting Restore...");

        const res = await pool.query(`
            INSERT INTO orders (order_no, item_code, item_name, client_name, qty, priority, status, created_at, updated_at)
            SELECT 
                or_jr_no, item_code, product_name, client_name, plan_qty, 'Normal', 'Completed', NOW(), NOW()
            FROM or_jr_report r
            WHERE LOWER(r.mld_status) IN ('completed', 'cancelled')
              AND NOT EXISTS (
                  SELECT 1 FROM orders o WHERE o.order_no = r.or_jr_no
              )
        `);

        console.log(`Restored ${res.rowCount} closed orders.`);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
