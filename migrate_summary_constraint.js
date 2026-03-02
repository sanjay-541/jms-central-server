
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration for mould_planning_summary constraint...');
        await client.query('BEGIN');

        // 1. Find the existing unique constraint
        const res = await client.query(`
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'mould_planning_summary'::regclass 
      AND contype = 'u'
    `);

        if (res.rows.length > 0) {
            for (const r of res.rows) {
                console.log(`Dropping constraint: ${r.conname}`);
                await client.query(`ALTER TABLE mould_planning_summary DROP CONSTRAINT "${r.conname}"`);
            }
        } else {
            console.log('No existing unique constraint found to drop.');
        }

        // 2. Add the new expanded constraint
        console.log('Adding new constraint (or_jr_no, mould_no, plan_date)...');
        await client.query(`
      ALTER TABLE mould_planning_summary 
      ADD CONSTRAINT mould_planning_summary_composite_key UNIQUE (or_jr_no, mould_no, plan_date)
    `);

        await client.query('COMMIT');
        console.log('Migration successful!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
