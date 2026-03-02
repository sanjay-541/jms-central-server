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
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'plan_board'
    `);
        console.log("Plan Board Columns:", res.rows);
        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
}
run();
