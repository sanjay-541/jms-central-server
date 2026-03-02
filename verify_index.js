
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
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'or_jr_report' 
      AND indexname = 'idx_or_jr_composite_unique'
    `);
        console.log('Index Found:', res.rows.length > 0);
        if (res.rows.length) console.log(res.rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
