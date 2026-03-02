
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function checkSchema() {
    try {
        const client = await pool.connect();

        console.log('--- MACHINES Columns ---');
        const resMachines = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'machines';
        `);
        resMachines.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

        console.log('\n--- MOULDS Columns ---');
        const resMoulds = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'moulds';
        `);
        resMoulds.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkSchema();
