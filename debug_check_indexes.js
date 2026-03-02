require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function check() {
    console.log('--- Checking Indexes on or_jr_report ---');
    try {
        const res = await pool.query(`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'or_jr_report';
        `);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
