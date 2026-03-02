const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    try {
        console.log("\n--- Shift Teams Updated in Last 24 Hours ---");
        const res = await pool.query("SELECT * FROM shift_teams WHERE updated_at > NOW() - INTERVAL '24 hours' ORDER BY updated_at DESC");
        if (res.rows.length === 0) {
            console.log("No entries found updated in last 24 hours.");
        } else {
            console.log(JSON.stringify(res.rows, null, 2));
        }
        pool.end();
    } catch (e) {
        console.error(e);
    }
}
run();
