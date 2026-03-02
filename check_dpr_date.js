
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
        // Check for potential date mismatches in Night Shift
        // Logic: If created_at hour is < 8 (post-midnight), dpr_date should be (created_at date - 1 day)
        // We check last 50 entries
        const res = await pool.query(`
      SELECT dpr_date, shift, hour_slot, created_at
      FROM dpr_hourly 
      WHERE shift = 'Night' AND EXTRACT(HOUR FROM created_at) < 8
      ORDER BY created_at DESC
      LIMIT 20
    `);
        console.log('Post-Midnight Night Entries Check:');
        console.table(res.rows.map(r => ({
            dpr_date: r.dpr_date.toISOString().split('T')[0],
            created_at: r.created_at.toLocaleString(),
            slot: r.hour_slot
        })));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
