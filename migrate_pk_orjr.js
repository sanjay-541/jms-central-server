const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("1. Updating NULL job_card_no to empty string...");
        await client.query(`UPDATE or_jr_report SET job_card_no = '' WHERE job_card_no IS NULL`);

        console.log("2. Setting job_card_no to NOT NULL DEFAULT ''...");
        await client.query(`ALTER TABLE or_jr_report ALTER COLUMN job_card_no SET DEFAULT '', ALTER COLUMN job_card_no SET NOT NULL`);

        console.log("3. Dropping existing Primary Key...");
        await client.query(`ALTER TABLE or_jr_report DROP CONSTRAINT or_jr_report_pkey`);

        console.log("4. Adding new Composite Primary Key...");
        await client.query(`ALTER TABLE or_jr_report ADD PRIMARY KEY (or_jr_no, job_card_no)`);

        await client.query('COMMIT');
        console.log("Migration Successful!");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration Failed:", e);
    } finally {
        client.release();
        pool.end();
    }
}
run();
