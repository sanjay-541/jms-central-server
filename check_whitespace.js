
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function check() {
    try {
        const res = await pool.query(`
      SELECT or_jr_no, mould_no 
      FROM mould_planning_summary 
      WHERE or_jr_no <> TRIM(or_jr_no) 
         OR mould_no <> TRIM(mould_no)
      LIMIT 10
    `);

        if (res.rows.length > 0) {
            console.log('Found rows with whitespace:', res.rows);
        } else {
            console.log('No whitespace issues found.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

check();
