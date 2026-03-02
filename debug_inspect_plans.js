
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function inspect() {
    console.log('Inspecting PLANNED items...');

    try {
        const res = await pool.query(`
        SELECT pb.id, pb.order_no, pb.plan_qty, r.jr_qty, pb.updated_at
        FROM plan_board pb
        LEFT JOIN or_jr_report r ON r.or_jr_no = pb.order_no
        WHERE pb.status = 'PLANNED'
        LIMIT 20
    `);

        res.rows.forEach(r => {
            console.log(`ID ${r.id}: ${r.order_no} | Plan: ${r.plan_qty} | JR: ${r.jr_qty} | Updated: ${r.updated_at}`);
        });

        // Check count of orders having Multiple PLANNED items
        const dupes = await pool.query(`
        SELECT order_no, COUNT(*) 
        FROM plan_board 
        WHERE status = 'PLANNED' 
        GROUP BY order_no 
        HAVING COUNT(*) > 1
        LIMIT 10
    `);
        console.log('\nOrders with multiple PLANNED items:');
        dupes.rows.forEach(r => console.log(`${r.order_no}: ${r.count}`));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

inspect();
