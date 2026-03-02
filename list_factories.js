const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'jpsms'
});

async function run() {
    const client = await pool.connect();
    try {
        console.log("Fetching Remote Factories...");
        const res = await client.query("SELECT id, name, code FROM factories WHERE is_active = true ORDER BY id");
        console.log("------------------------------------------------");
        console.log("REMOTE FACTORIES FOUND:");
        console.log(JSON.stringify(res.rows, null, 2));
        console.log("------------------------------------------------");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
