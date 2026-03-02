require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: process.env.DB_PORT || process.env.PGPORT || 5432,
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.DB_NAME || process.env.PGDATABASE || 'jpsms'
});

(async () => {
    try {
        const client = await pool.connect();
        const res = await client.query("SELECT DISTINCT shift, count(*) FROM dpr_hourly WHERE dpr_date = CURRENT_DATE GROUP BY shift");
        console.log('Today Shifts:', res.rows);
        client.release();
    } catch (e) { console.error(e); }
    finally { pool.end(); }
})();
