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
      WHERE table_name = 'dpr_hourly';
    `);
        console.log("Columns:", JSON.stringify(res.rows, null, 2));
        pool.end();
    } catch (e) {
        console.error(e);
    }
}
run();
