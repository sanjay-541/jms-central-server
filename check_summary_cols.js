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
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'mould_planning_summary' 
      ORDER BY ordinal_position
    `);

        console.log("Summary Columns:", res.rows.map(r => r.column_name));
        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
}
run();
