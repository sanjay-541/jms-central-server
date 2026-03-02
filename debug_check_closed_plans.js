
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function checkClosed() {
    console.log('Checking PLANNED items linked to Closed Orders...');

    try {
        const res = await pool.query(`
        SELECT COUNT(*) as count
        FROM plan_board pb
        JOIN or_jr_report r ON r.or_jr_no = pb.order_no
        WHERE pb.status = 'PLANNED'
          AND r.jr_close = 'Close'
    `);

        console.log(`Found ${res.rows[0].count} PLANNED items that are Closed in OR-JR.`);

        // Also check date filtering?

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkClosed();
