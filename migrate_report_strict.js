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

        console.log('Migrating mould_planning_report to stricter uniqueness (OR + Mould)...');

        // 1. Deduplicate based on NEW Key: (or_jr_no, mould_no)
        // Keep MAX(id)
        console.log('Removing duplicates (collapsing items for same mould)...');
        await client.query(`
        DELETE FROM mould_planning_report
        WHERE id NOT IN (
            SELECT MAX(id)
            FROM mould_planning_report
            GROUP BY or_jr_no, mould_no
        )
    `);

        // 2. Drop Old Constraint
        try {
            await client.query(`ALTER TABLE mould_planning_report DROP CONSTRAINT IF EXISTS mould_report_uniq_idx`);
        } catch (e) { }

        // 3. Add New Looser Constraint
        // Note: If or_jr_no or mould_no are null, we handled that in previous migration.
        try {
            await client.query(`ALTER TABLE mould_planning_report DROP CONSTRAINT IF EXISTS mould_report_strict_uniq_idx`);
        } catch (e) { }

        await client.query(`ALTER TABLE mould_planning_report ADD CONSTRAINT mould_report_strict_uniq_idx UNIQUE (or_jr_no, mould_no)`);

        await client.query('COMMIT');
        console.log('Migration successful.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
