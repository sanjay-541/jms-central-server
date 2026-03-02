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

        console.log('Reverting mould_planning_report to include Item Code in uniqueness...');

        // 1. Drop Strict Constraint (OR + Mould)
        try {
            await client.query(`ALTER TABLE mould_planning_report DROP CONSTRAINT IF EXISTS mould_report_strict_uniq_idx`);
        } catch (e) { }

        // 2. Add Original Constraint (OR + Mould + Item Code)
        // No need to deduplicate again because the stricter constraint (OR+Mould) has already ensured 
        // there are no duplicates even at the looser level (OR+Mould+ItemCode).
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
