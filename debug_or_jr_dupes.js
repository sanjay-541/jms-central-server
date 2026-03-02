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
    console.log('--- Checking for duplicate OR/JR numbers ---');
    try {
        const res = await pool.query(`
            SELECT or_jr_no, COUNT(*) 
            FROM or_jr_report 
            GROUP BY or_jr_no 
            HAVING COUNT(*) > 1
        `);

        if (res.rows.length === 0) {
            console.log('No duplicates found based on or_jr_no.');
        } else {
            console.log(`Found ${res.rows.length} duplicate entries:`);
            console.table(res.rows);

            // detailed check for the first one
            const first = res.rows[0].or_jr_no;
            console.log(`\nDetails for ${first}:`);
            const details = await pool.query('SELECT id, or_jr_no, created_at FROM or_jr_report WHERE or_jr_no = $1', [first]);
            console.table(details.rows);
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
