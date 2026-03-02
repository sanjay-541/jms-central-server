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

        console.log('Migrating mould_planning_report...');

        // 1. Ensure or_jr_no is NOT NULL
        await client.query(`UPDATE mould_planning_report SET or_jr_no = '' WHERE or_jr_no IS NULL`);
        await client.query(`ALTER TABLE mould_planning_report ALTER COLUMN or_jr_no SET DEFAULT ''`);
        await client.query(`ALTER TABLE mould_planning_report ALTER COLUMN or_jr_no SET NOT NULL`);

        // 2. Ensure mould_item_code is NOT NULL (Detail Key)
        await client.query(`UPDATE mould_planning_report SET mould_item_code = '' WHERE mould_item_code IS NULL`);
        await client.query(`ALTER TABLE mould_planning_report ALTER COLUMN mould_item_code SET DEFAULT ''`);
        await client.query(`ALTER TABLE mould_planning_report ALTER COLUMN mould_item_code SET NOT NULL`);

        // 3. Deduplicate
        // Key: or_jr_no + mould_no + mould_item_code
        console.log('Removing duplicates...');
        await client.query(`
        DELETE FROM mould_planning_report
        WHERE id NOT IN (
            SELECT MAX(id)
            FROM mould_planning_report
            GROUP BY or_jr_no, mould_no, mould_item_code
        )
    `);

        // 4. Add Unique Constraint
        try {
            await client.query(`ALTER TABLE mould_planning_report DROP CONSTRAINT IF EXISTS mould_report_uniq_idx`);
        } catch (e) { }

        await client.query(`ALTER TABLE mould_planning_report ADD CONSTRAINT mould_report_uniq_idx UNIQUE (or_jr_no, mould_no, mould_item_code)`);

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
