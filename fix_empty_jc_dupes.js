const { Pool } = require('pg');
const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'jpsms',
    port: process.env.PGPORT || 5432,
    ssl: false
});

(async () => {
    const client = await pool.connect();
    try {
        console.log('Scanning for Empty JC duplicates...');
        await client.query('BEGIN');

        // Logic: Find ORs that have BOTH an empty/null JC AND a non-empty JC
        // Then Delete the empty ones
        const sql = `
      DELETE FROM or_jr_report 
      WHERE id IN (
        SELECT r1.id
        FROM or_jr_report r1
        JOIN or_jr_report r2 ON r1.or_jr_no = r2.or_jr_no
        WHERE (r1.job_card_no IS NULL OR TRIM(r1.job_card_no) = '') 
          AND (r2.job_card_no IS NOT NULL AND TRIM(r2.job_card_no) <> '')
          AND r1.id <> r2.id
      )
    `;

        const res = await client.query(sql);
        console.log(`Deleted ${res.rowCount} rows with empty Job Cards (superseded by valid ones).`);

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
    } finally {
        client.release();
    }
})();
