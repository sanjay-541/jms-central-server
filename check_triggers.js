
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
    try {
        console.log('--- Trigger Definition ---');
        const funcRes = await pool.query(`
        SELECT proname, prosrc 
        FROM pg_proc 
        WHERE proname = 'update_last_updated_at'
    `);
        console.log(funcRes.rows);

        console.log('\n--- Table Columns ---');
        const colRes = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'or_jr_report'
    `);
        console.log(colRes.rows.map(r => r.column_name));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

check();
