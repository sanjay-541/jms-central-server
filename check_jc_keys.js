
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
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT data FROM jc_details LIMIT 1');
        if (res.rows.length) {
            console.log('Sample Keys:', Object.keys(res.rows[0].data));
            console.log('Sample Data:', res.rows[0].data);
        } else {
            console.log('No data in jc_details');
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

check();
