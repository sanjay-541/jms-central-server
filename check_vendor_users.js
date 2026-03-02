const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function check() {
    try {
        const t = 'vendors';
        console.log(`--- Checking ${t} columns ---`);
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${t}'
        `);
        console.log(res.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
