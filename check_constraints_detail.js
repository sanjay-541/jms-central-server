
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
    const client = await pool.connect();
    try {
        const tables = ['mould_planning_report', 'jc_details'];

        for (const t of tables) {
            console.log(`\n--- Constraints for ${t} ---`);
            const res = await client.query(`
        SELECT conname, pg_get_constraintdef(oid) as def
        FROM pg_constraint 
        WHERE conrelid = '${t}'::regclass 
        AND contype = 'u'
      `);
            if (res.rows.length === 0) console.log('No unique constraints.');
            res.rows.forEach(r => console.log(`${r.conname}: ${r.def}`));
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

check();
