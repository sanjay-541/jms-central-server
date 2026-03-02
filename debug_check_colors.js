require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function run() {
    try {
        const orTerm = 'JR/JG/2526/4462';
        const mouldParam = '9717-LID/CLIP';

        console.log(`--- DEBUG: Simulating Server Query ---`);
        console.log(`OR: ${orTerm}`);
        console.log(`Mould Param: ${mouldParam}`);

        const res = await pool.query(`
      SELECT id, data->>'mould_no' as m_no
      FROM jc_details 
      WHERE data->>'or_jr_no' = $1
      AND (
          UPPER(TRIM(data->>'mould_no')) = UPPER($2) 
          OR UPPER(TRIM(data->>'mould_code')) = UPPER($2)
          OR SPLIT_PART(UPPER(TRIM(data->>'mould_no')), '-', 1) = SPLIT_PART(UPPER($2), '-', 1)
      )
    `, [orTerm, mouldParam]);

        console.log(`\nFound ${res.rowCount} rows.`);
        res.rows.forEach(r => console.log(`Matched: ${r.m_no}`));

        if (res.rowCount > 0) {
            console.log('\nSUCCESS: Logic matches!');
        } else {
            console.log('\nFAILURE: Logic did NOT match.');
        }

        console.log('\n--- End of Debug ---');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

run();
