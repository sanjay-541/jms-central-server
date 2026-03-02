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
        console.log('--- Checking dpr_reasons columns ---');
        const res1 = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'dpr_reasons'
        `);
        console.log('dpr_reasons columns:', res1.rows.map(r => r.column_name).join(', '));

        console.log('\n--- Checking orders constraints ---');
        const res2 = await pool.query(`
            SELECT con.conname, pg_get_constraintdef(con.oid)
            FROM pg_catalog.pg_constraint con
            INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
            INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = connamespace
            WHERE nsp.nspname = 'public'
            AND rel.relname = 'orders';
        `);
        console.log(res2.rows);

        console.log('\n--- Checking columns for orders ---');
        const res3 = await pool.query(`
             SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'orders'
        `);
        console.log('orders columns:', res3.rows.map(r => r.column_name).join(', '));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
