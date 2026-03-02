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
        const res = await client.query("SELECT machine FROM machines WHERE machine LIKE '%300-%' ORDER BY machine");
        console.log("Machines with 300-:", res.rows.map(r => r.machine));
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}
run();
