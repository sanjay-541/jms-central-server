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
        console.log('Testing Candidates Query for JR/JG/2526/3971...');

        const srcSql = `
        SELECT *
        FROM or_jr_report
        WHERE
        (
            mld_status IS NULL 
            OR TRIM(mld_status) = '' 
            OR TRIM(LOWER(mld_status)) NOT IN('completed', 'cancelled')
        )
        AND (is_closed IS FALSE OR is_closed IS NULL)
        AND or_jr_no = 'JR/JG/2526/3971'
    `;

        const candidates = await pool.query(srcSql);
        console.log('Candidates Found:', candidates.rows.length);
        console.table(candidates.rows.map(r => ({ or: r.or_jr_no, status: r.mld_status, closed: r.is_closed })));

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
