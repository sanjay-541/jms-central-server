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
        console.log('Checking columns...');

        // Check completed_by
        const resBy = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='plan_board' AND column_name='completed_by'
        `);
        if (resBy.rows.length === 0) {
            console.log('Adding completed_by...');
            await client.query(`ALTER TABLE plan_board ADD COLUMN completed_by VARCHAR(50);`);
        } else {
            console.log('completed_by exists.');
        }

        // Check completed_at
        const resAt = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='plan_board' AND column_name='completed_at'
        `);
        if (resAt.rows.length === 0) {
            console.log('Adding completed_at...');
            await client.query(`ALTER TABLE plan_board ADD COLUMN completed_at TIMESTAMPTZ;`);
        } else {
            console.log('completed_at exists.');
        }

        console.log('Migration Complete.');
    } catch (e) {
        console.error('Migration Failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
