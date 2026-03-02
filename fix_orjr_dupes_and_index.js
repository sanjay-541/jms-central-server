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
        console.log('Starting OR-JR Fix...');
        await client.query('BEGIN');

        // 1. Identify and Delete Duplicates (Keep Latest ID)
        // Group by OR + JC. If count > 1, delete all EXCEPT MAX(id)
        const sqlDupes = `
      DELETE FROM or_jr_report a USING (
        SELECT MIN(id) as min_id, MAX(id) as max_id, or_jr_no, COALESCE(job_card_no, '') as jc
        FROM or_jr_report 
        GROUP BY or_jr_no, COALESCE(job_card_no, '')
        HAVING COUNT(*) > 1
      ) b
      WHERE a.or_jr_no = b.or_jr_no 
        AND COALESCE(a.job_card_no, '') = b.jc 
        AND a.id <> b.max_id -- Keep MAX ID (Latest)
    `;
        const resDel = await client.query(sqlDupes);
        console.log(`Deleted ${resDel.rowCount} duplicate rows.`);

        // 2. Drop Old Index
        await client.query(`DROP INDEX IF EXISTS idx_or_jr_composite_unique`);

        // 3. Create New Index (Without Plan Date)
        // Normalized JC to empty string for consistency
        await client.query(`
      CREATE UNIQUE INDEX idx_or_jr_unique_strict 
      ON or_jr_report (or_jr_no, COALESCE(job_card_no, ''))
    `);
        console.log('Created new unique index: idx_or_jr_unique_strict');

        await client.query('COMMIT');
        console.log('Fix Applied Successfully.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration Failed:', e);
    } finally {
        client.release();
    }
})();
