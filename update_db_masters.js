const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function updateDBMasters() {
    const client = await pool.connect();
    try {
        console.log('Updating DB for Masters...');

        // 1. Moulds Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS moulds (
                id SERIAL PRIMARY KEY,
                mould_code VARCHAR(255) UNIQUE,
                mould_name VARCHAR(255),
                item_code VARCHAR(255),
                cavity INTEGER,
                cycle_time NUMERIC,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('Created moulds table');

        // 2. Clear demo data if requested? 
        // User asked to "Remove all demo data". 
        // We'll truncate tables to ensure clean slate if user wants strict "real data".
        // BUT, user might have just seeded "real data" via my script. 
        // I will NOT truncate automatically to avoid deleting the "real data" I just seeded.
        // Instead, I will assume "demo data" referred to the hardcoded JS fallbacks.

    } catch (err) {
        console.error('Error updating DB:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

updateDBMasters();
