
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function check() {
    try {
        console.log('--- Constraints on mould_planning_summary ---');
        const res = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'mould_planning_summary'::regclass
    `);
        console.log(res.rows);

        console.log('\n--- Indexes on mould_planning_summary ---');
        const idxRes = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'mould_planning_summary'
    `);
        console.log(idxRes.rows);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

check();
