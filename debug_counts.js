
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function checkCounts() {
    console.log('Checking Plan Counts...');

    try {
        const res = await pool.query(`
        SELECT status, COUNT(*) 
        FROM plan_board 
        GROUP BY status
    `);

        console.log('Counts by Status:');
        res.rows.forEach(r => console.log(`  ${r.status}: ${r.count}`));

        const total = res.rows.reduce((sum, r) => sum + Number(r.count), 0);
        console.log(`TOTAL: ${total}`);

        // Check suffix counts again
        const suffix = await pool.query(`
        SELECT COUNT(*) 
        FROM plan_board 
        WHERE order_no LIKE '%488' OR order_no LIKE '%550'
    `);
        console.log(`Suffix 488/550 count: ${suffix.rows[0].count}`);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkCounts();
