
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
    try {
        const res = await pool.query(`SELECT id, plan_id, mould_name, article_act, created_at FROM std_actual ORDER BY created_at DESC LIMIT 20`);
        console.table(res.rows);

        // Also check if 'act_weight' column even exists or if it's just in my head
        // Note: The previous code tried to access 'act_weight' from result, but if query didn't select it, it would be undefined.
        // The table schema def in server.js showed 'article_act'.

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
