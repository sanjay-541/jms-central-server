require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function run() {
    console.log('--- Applying Index Fixes ---');
    try {
        // 1. Drop old strict indexes
        await pool.query(`DROP INDEX IF EXISTS idx_or_jr_report_unique_no`);
        console.log('Dropped idx_or_jr_report_unique_no');

        await pool.query(`DROP INDEX IF EXISTS idx_or_jr_unique_strict`);
        console.log('Dropped idx_or_jr_unique_strict');

        // 2. Drop PK if it exists (legacy)
        await pool.query(`ALTER TABLE or_jr_report DROP CONSTRAINT IF EXISTS or_jr_report_pkey`);
        console.log('Dropped pkey constraint');

        // 3. Create New Composite Index
        await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_or_jr_composite_unique 
            ON or_jr_report (
                or_jr_no, 
                COALESCE(plan_date, '1970-01-01'::date), 
                COALESCE(job_card_no, '')
            )
        `);
        console.log('Created idx_or_jr_composite_unique');

    } catch (e) {
        console.error('Error applying fixes:', e);
    } finally {
        pool.end();
    }
}

run();
