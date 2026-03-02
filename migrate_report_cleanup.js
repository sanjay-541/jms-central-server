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

        console.log('Dropping Unique Constraints on mould_planning_report to allow duplicates (Restoring Replace Mode)...');

        // Drop all variants of the constraint
        try {
            await client.query(`ALTER TABLE mould_planning_report DROP CONSTRAINT IF EXISTS mould_report_uniq_idx`);
        } catch (e) { }
        try {
            await client.query(`ALTER TABLE mould_planning_report DROP CONSTRAINT IF EXISTS mould_report_strict_uniq_idx`);
        } catch (e) { }

        await client.query('COMMIT');
        console.log('Constraint removal successful.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
