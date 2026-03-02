const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

(async () => {
    const client = await pool.connect();
    try {
        console.log('Starting migration for mould_planning_summary...');

        await client.query('BEGIN');

        // 1. Drop the existing primary key constraint on or_jr_no (if exists)
        // We catch error in case it's named differently, but usually it's table_pkey
        try {
            await client.query(`ALTER TABLE mould_planning_summary DROP CONSTRAINT mould_planning_summary_pkey`);
            console.log('Dropped old PK constraint.');
        } catch (e) {
            console.log('Error dropping PK (might not exist or different name):', e.message);
        }

        // 2. Add ID column if not exists
        await client.query(`ALTER TABLE mould_planning_summary ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY`);
        console.log('Added ID column as Primary Key.');

        // 3. Create Index on or_jr_no for faster lookups since it's no longer PK
        await client.query(`CREATE INDEX IF NOT EXISTS idx_summary_or_jr_no ON mould_planning_summary(or_jr_no)`);
        console.log('Created index on or_jr_no.');

        await client.query('COMMIT');
        console.log('Migration successful!');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
})();
