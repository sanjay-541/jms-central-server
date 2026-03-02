
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'jpsms',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    port: process.env.PGPORT || 5432,
});

async function run() {
    try {
        const client = await pool.connect();
        console.log('Connected');

        const sql = `SELECT $1 - $2 as res`;
        const params = [100, 10]; // JS Numbers

        console.log('Running:', sql, params);

        try {
            const res = await client.query(sql, params);
            console.log('Success:', res.rows[0]);
        } catch (err) {
            console.error('QUERY FAILED:', err.message);
        }

        client.release();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
