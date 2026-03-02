
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function checkDates() {
    console.log('Checking Plan Dates...');

    try {
        const res = await pool.query(`
        SELECT 
           CASE 
             WHEN start_date < '2026-01-10' THEN 'Before Jan 10'
             WHEN start_date >= '2026-01-10' AND start_date <= '2026-01-26' THEN 'In Range (Jan 10-25)'
             ELSE 'Future'
           END as range,
           COUNT(*),
           MIN(start_date) as earliest,
           MAX(start_date) as latest
        FROM plan_board
        GROUP BY 1
    `);

        console.log('Date Distribution:');
        res.rows.forEach(r => console.log(r));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkDates();
