
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
        const orNo = 'JR/JG/2526/4422';
        console.log(`Checking rows for ${orNo}...`);

        const res = await pool.query(`
      SELECT id, or_jr_no, mould_no, plan_date, mould_name 
      FROM mould_planning_summary 
      WHERE or_jr_no LIKE $1
    `, [`%${orNo}%`]); // Use LIKE to catch whitespace variants

        console.log('Rows found:', res.rows);

        if (res.rows.length > 0) {
            console.log('\n--- Detail Inspection ---');
            res.rows.forEach(r => {
                console.log(`ID: ${r.id}`);
                console.log(`OR: '${r.or_jr_no}' (Length: ${r.or_jr_no.length})`);
                console.log(`Mould: '${r.mould_no}' (Length: ${r.mould_no.length})`);
                console.log(`Date: '${r.plan_date}' (Type: ${typeof r.plan_date})`);
                console.log('---');
            });
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

check();
