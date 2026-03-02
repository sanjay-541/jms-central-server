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
        console.log(`Checking entries for: ${orNo}`);

        const res = await pool.query(`
            SELECT or_jr_no, job_card_no, created_date, mld_status, jr_close 
            FROM or_jr_report 
            WHERE or_jr_no ILIKE $1
            ORDER BY created_date ASC
        `, [`%${orNo}%`]);

        if (res.rows.length === 0) {
            console.log('No entries found.');
        } else {
            console.log(`Found ${res.rows.length} entries:`);
            res.rows.forEach((r, i) => {
                console.log(`[${i + 1}] OR: ${r.or_jr_no}, JC: '${r.job_card_no || ''}', Status: ${r.mld_status}, Closed: ${r.jr_close}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
