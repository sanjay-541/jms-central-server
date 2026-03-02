
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function checkSummary() {
    const count = await pool.query('SELECT COUNT(*) FROM mould_planning_summary');
    console.log(`Summary Count: ${count.rows[0].count}`);

    const distinct = await pool.query('SELECT COUNT(DISTINCT or_jr_no) FROM mould_planning_summary');
    console.log(`Distinct Orders in Summary: ${distinct.rows[0].count}`);

    // Check if they match plan_board count
    pool.end();
}

checkSummary();
