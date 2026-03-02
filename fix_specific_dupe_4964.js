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
        const orNo = 'JR/JG/2526/4964';
        console.log(`Cleaning up duplicate for ${orNo}...`);

        // Delete the one with empty job card
        const res = await pool.query(`
            DELETE FROM or_jr_report 
            WHERE or_jr_no = $1 
              AND (job_card_no IS NULL OR TRIM(job_card_no) = '')
        `, [orNo]);

        console.log(`Deleted ${res.rowCount} row(s).`);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
