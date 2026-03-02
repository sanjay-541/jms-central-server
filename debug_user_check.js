require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function checkUsers() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT username, role_code, is_active FROM users LIMIT 5');
        console.log('Users found:', res.rows.length);
        console.table(res.rows);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        client.release();
        pool.end();
    }
}

checkUsers();
