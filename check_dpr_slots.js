
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
        const res = await pool.query(`
      SELECT shift, hour_slot, COUNT(*) 
      FROM dpr_hourly 
      WHERE shift = 'Night' 
      GROUP BY shift, hour_slot 
      ORDER BY hour_slot
    `);
        console.log('Night Shift Slots:');
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
