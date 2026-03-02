
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function checkTime() {
    try {
        const res = await pool.query("SELECT NOW() as db_time, NOW()::__timezones__ AS tz"); // Intentional error to verify query, simpler: just select now()
        const res2 = await pool.query("SELECT NOW() as db_time, current_setting('TIMEZONE') as tz");

        console.log('System Time:', new Date().toString());
        console.log('DB Time:    ', res2.rows[0].db_time);
        console.log('DB Timezone:', res2.rows[0].tz);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

checkTime();
