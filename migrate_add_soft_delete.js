const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function migrate() {
    try {
        console.log('Checking or_jr_report for is_deleted column...');

        // Check if column exists
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='or_jr_report' AND column_name='is_deleted'
        `);

        if (res.rows.length === 0) {
            console.log('Adding is_deleted column...');
            await pool.query(`
                ALTER TABLE or_jr_report 
                ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE
            `);
            console.log('Column added successfully.');
        } else {
            console.log('Column is_deleted already exists.');
        }

    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
    }
}

migrate();
