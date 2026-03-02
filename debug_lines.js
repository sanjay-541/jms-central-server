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
        console.log("--- Active Machines Lines ---");
        const mRes = await pool.query("SELECT DISTINCT line FROM machines WHERE is_active=true ORDER BY line");
        console.log(mRes.rows.map(r => r.line));

        console.log("\n--- Shift Teams Today ---");
        // Fetch recent shift teams to see what was saved
        const sRes = await pool.query("SELECT line, shift, shift_date, entry_person FROM shift_teams ORDER BY updated_at DESC LIMIT 5");
        console.log(sRes.rows);

        pool.end();
    } catch (e) {
        console.error(e);
    }
}
run();
