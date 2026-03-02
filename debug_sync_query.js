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
        console.log('--- TESTING SQL QUERY ---');

        const srcSql = `
        SELECT or_jr_no, mld_status, jr_close
        FROM or_jr_report 
        WHERE 
          (
            mld_status IS NULL 
            OR TRIM(mld_status) = '' 
            OR TRIM(LOWER(mld_status)) NOT IN ('completed', 'cancelled')
          )
          AND TRIM(LOWER(jr_close)) = 'open'
    `;

        const res = await pool.query(srcSql);
        console.log(`Query returned ${res.rows.length} rows.`);

        // Scan for bad data in result
        let badCount = 0;
        res.rows.forEach(r => {
            const m = (r.mld_status || '').toLowerCase().trim();
            const j = (r.jr_close || '').toLowerCase().trim();

            if (m === 'completed' || m === 'cancelled' || j !== 'open') {
                console.log(`[BAD ROW] ID: ${r.or_jr_no}, MLD: '${r.mld_status}', JR: '${r.jr_close}'`);
                badCount++;
            }
        });

        if (badCount === 0) {
            console.log('SUCCESS: No bad rows found in the query result.');
            console.log('HYPOTHESIS: The "Bad" rows in the UI are leftover from PREVIOUS fetches. They are not being deleted.');
        } else {
            console.log('FAILURE: The query IS returning bad rows.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
