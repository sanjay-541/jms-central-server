const { Pool } = require('pg');
require('dotenv').config();

// Fix for strict ssl in some envs
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const orderNo = 'JR/JG/2526/4617';
        console.log(`Checking duplicates for ${orderNo}...`);

        const res = await pool.query(`
            SELECT id, or_jr_no, job_card_no, created_at 
            FROM or_jr_report 
            WHERE TRIM(or_jr_no) = TRIM($1)
        `, [orderNo]);

        console.log(`Found ${res.rows.length} rows:`);
        console.table(res.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
