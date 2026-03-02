const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function check() {
    try {
        const orderNo = 'JR/JG/2526/4741';
        console.log(`Searching for duplicates for: ${orderNo}`);

        const res = await pool.query(`
            SELECT or_jr_no, job_card_no, created_date, edited_date, jr_close, mld_status 
            FROM or_jr_report 
            WHERE or_jr_no ILIKE $1
            ORDER BY created_date ASC
        `, [`%${orderNo}%`]);

        console.log(`Found ${res.rows.length} rows:`);
        res.rows.forEach((r, i) => {
            console.log(`Row ${i + 1}:`);
            console.log(`  OR No: '${r.or_jr_no}'`);
            console.log(`  JC No: '${r.job_card_no}' (Type: ${typeof r.job_card_no}) (Len: ${r.job_card_no ? r.job_card_no.length : 0})`);
            console.log(`  Created: ${r.created_date}`);
            console.log(`  JR Close: ${r.jr_close}`);
            console.log(`  MLD Status: ${r.mld_status}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
