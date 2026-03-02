const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function updateDB() {
    const client = await pool.connect();
    try {
        console.log('Updating database for V2...');

        // 1. Add id to machines if missing
        await client.query(`ALTER TABLE machines ADD COLUMN IF NOT EXISTS id SERIAL;`);
        console.log('Updated machines table');

        // 2. Create Orders Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_no VARCHAR(255) UNIQUE,
                item_code VARCHAR(255),
                item_name VARCHAR(255),
                mould_code VARCHAR(255),
                qty NUMERIC,
                balance NUMERIC,
                priority VARCHAR(50) DEFAULT 'Normal',
                status VARCHAR(50) DEFAULT 'Pending',
                age_days INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('Created/Verified orders table');

        // 3. Ensure users have role_code (existing scripts did this, just double check)
        // No-op

        console.log('Database updated successfully!');
    } catch (err) {
        console.error('Error updating DB:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

updateDB();
