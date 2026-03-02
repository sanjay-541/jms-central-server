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
        const tables = ['dpr_hourly', 'machines', 'jobs_queue', 'plan_board'];
        for (const t of tables) {
            const res = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [t]);
            console.log(`Table '${t}' columns:`, res.rows.map(r => r.column_name).join(', '));
        }
        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
}
run();
