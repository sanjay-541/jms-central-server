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
        console.log("\n--- Last 5 Shift Teams ---");
        const res = await pool.query("SELECT id, line, shift_date, shift, entry_person FROM shift_teams ORDER BY updated_at DESC LIMIT 5");
        console.log(JSON.stringify(res.rows, null, 2));

        // Also check for specific date/shift if possible to match what user is doing
        const res2 = await pool.query("SELECT * FROM shift_teams WHERE shift_date='2026-01-08' OR shift_date='2026-01-07' ORDER BY updated_at DESC");
        console.log("\n--- Today/Tomorrow Shift Teams ---");
        console.log(JSON.stringify(res2.rows, null, 2));

        pool.end();
    } catch (e) {
        console.error(e);
    }
}
run();
