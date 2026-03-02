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

        console.log('Migrating mould_planning_report uniqueness to include Plan Date...');

        // 1. Ensure plan_date is NOT NULL (for Text column)
        await client.query(`UPDATE mould_planning_report SET plan_date = '' WHERE plan_date IS NULL`);
        await client.query(`ALTER TABLE mould_planning_report ALTER COLUMN plan_date SET DEFAULT ''`);
        await client.query(`ALTER TABLE mould_planning_report ALTER COLUMN plan_date SET NOT NULL`);

        // 2. Remove Duplicates based on NEW KEY: (or_jr_no, mould_no, mould_item_code, plan_date)
        console.log('Removing strict duplicates...');
        await client.query(`
        DELETE FROM mould_planning_report
        WHERE id NOT IN (
            SELECT MAX(id)
            FROM mould_planning_report
            GROUP BY or_jr_no, mould_no, mould_item_code, plan_date
        )
    `);

        // 3. Drop Old Constraints
        try {
            await client.query(`ALTER TABLE mould_planning_report DROP CONSTRAINT IF EXISTS mould_report_uniq_idx`);
        } catch (e) { }
        try {
            await client.query(`ALTER TABLE mould_planning_report DROP CONSTRAINT IF EXISTS mould_report_strict_uniq_idx`);
        } catch (e) { }

        // 4. Add New Constraint
        await client.query(`ALTER TABLE mould_planning_report ADD CONSTRAINT mould_report_date_uniq_idx UNIQUE (or_jr_no, mould_no, mould_item_code, plan_date)`);

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
