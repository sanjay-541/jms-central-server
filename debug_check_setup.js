const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function check() {
    const planId = 'PLN-1769927400251';
    console.log(`--- Checking Setup for Plan ID: ${planId} ---`);
    const res = await pool.query('SELECT * FROM std_actual WHERE plan_id = $1', [planId]);

    if (res.rowCount > 0) {
        console.table(res.rows);
    } else {
        console.log('No setup found for this plan ID.');
    }
    pool.end();
}

check();
