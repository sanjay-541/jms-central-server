const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function run() {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'machines'");
        console.log("Machines Columns:", res.rows.map(r => r.column_name));

        const rows = await client.query("SELECT * FROM machines LIMIT 1");
        console.log("First Row:", rows.rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}
run();
