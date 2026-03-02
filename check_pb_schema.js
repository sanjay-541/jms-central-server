
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function check() {
    try {
        console.log('Checking plan_board schema...');

        // Check Columns
        const cols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'plan_board'
        `);
        console.log('Columns:', cols.rows.map(r => r.column_name).join(', '));

        const hasSyncId = cols.rows.some(r => r.column_name === 'sync_id');
        console.log('Has sync_id:', hasSyncId);

        // Check Indexes
        const idx = await pool.query(`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'plan_board'
        `);
        console.log('Indexes:');
        idx.rows.forEach(r => console.log(` - ${r.indexname}: ${r.indexdef}`));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
