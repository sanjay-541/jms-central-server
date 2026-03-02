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
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='users'");
        console.log(res.rows.map(x => x.column_name));

        // Also check Vipin user
        const u = await pool.query("SELECT * FROM users WHERE username ILIKE '%Vipin%'");
        console.log(u.rows[0]);
        pool.end();
    } catch (e) {
        console.error(e);
    }
}
run();
