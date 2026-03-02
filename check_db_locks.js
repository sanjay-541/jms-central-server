const { Pool } = require('pg');
require('dotenv').config();

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
        console.log("Checking for active queries and locks...");
        const res = await client.query(`
            SELECT pid, state, query, age(clock_timestamp(), query_start) as duration
            FROM pg_stat_activity 
            WHERE state != 'idle' AND pid <> pg_backend_pid()
            ORDER BY duration DESC;
        `);

        if (res.rows.length === 0) {
            console.log("No active blocking queries found.");
        } else {
            console.log("Active Queries:");
            res.rows.forEach(r => {
                console.log(`PID: ${r.pid} | State: ${r.state} | Duration: ${r.duration}`);
                console.log(`Query: ${r.query}`);
                console.log('--------------------------------------------------');
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}
run();
