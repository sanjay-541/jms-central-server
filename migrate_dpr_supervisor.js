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
        // Check if column exists
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'dpr_hourly' AND column_name = 'supervisor';
    `);

        if (res.rows.length === 0) {
            console.log("Column 'supervisor' does not exist. Adding it...");
            await pool.query('ALTER TABLE dpr_hourly ADD COLUMN supervisor TEXT');
            console.log("Column added.");
        } else {
            console.log("Column 'supervisor' already exists.");
        }
        pool.end();
    } catch (e) {
        console.error(e);
    }
}
run();
