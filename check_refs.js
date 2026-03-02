
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
        const res = await pool.query(`
      SELECT
          conname AS constraint_name,
          conrelid::regclass AS table_name,
          a.attname AS column_name
      FROM pg_constraint c
      JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
      WHERE confrelid = 'mould_planning_summary'::regclass
    `);

        if (res.rows.length > 0) {
            console.log('Found FK references TO mould_planning_summary:', res.rows);
        } else {
            console.log('No tables reference mould_planning_summary via FK.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

check();
