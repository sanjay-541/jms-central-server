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
        console.log('Checking for remarks column in plan_board...');

        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='plan_board' AND column_name='remarks'
        `);

        if (res.rows.length === 0) {
            console.log('Adding remarks column...');
            await client.query(`ALTER TABLE plan_board ADD COLUMN remarks TEXT;`);
            console.log('remarks column added.');
        } else {
            console.log('remarks column already exists.');
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
