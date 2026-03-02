const { Pool } = require('pg');

// Safe config using object (handles special chars in password)
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function migrate() {
    try {
        console.log('Connecting...');
        const client = await pool.connect();
        try {
            console.log('Running Migration...');
            await client.query(`
                ALTER TABLE or_jr_report 
                ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT FALSE,
                ADD COLUMN IF NOT EXISTS manual_closed_at TIMESTAMP,
                ADD COLUMN IF NOT EXISTS manual_closed_by TEXT,
                ADD COLUMN IF NOT EXISTS manual_closed_by_name TEXT,
                ADD COLUMN IF NOT EXISTS manual_reopened_at TIMESTAMP,
                ADD COLUMN IF NOT EXISTS manual_reopened_by TEXT,
                ADD COLUMN IF NOT EXISTS manual_reopened_by_name TEXT;
            `);
            console.log('Migration Complete: Columns Added (if they were missing).');
        } finally {
            client.release();
        }
    } catch (e) {
        console.error('Migration Failed:', e);
    } finally {
        await pool.end();
    }
}

migrate();
