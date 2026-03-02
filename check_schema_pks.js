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
        const tables = ['shift_teams'];
        for (const t of tables) {
            console.log(`--- Checking ${t} Columns ---`);
            const res = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = '${t}'
            `);
            console.log(res.rows.map(r => r.column_name));

            console.log(`--- Checking ${t} Constraints ---`);
            const res2 = await pool.query(`
                SELECT kcu.column_name, tc.constraint_name, tc.constraint_type
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                  ON tc.constraint_name = kcu.constraint_name
                WHERE tc.table_name = '${t}'
            `);
            console.log(res2.rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
