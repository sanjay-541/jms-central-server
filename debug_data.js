
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function debugData() {
    const client = await pool.connect();
    try {
        console.log('--- Top 5 Moulds ---');
        const moulds = await client.query('SELECT id, erp_item_code, machine FROM moulds LIMIT 5');
        console.table(moulds.rows);

        console.log('\n--- Searching for 3668 in Moulds ---');
        // fuzzy search
        const search = await client.query("SELECT * FROM moulds WHERE erp_item_code LIKE '%3668%'");
        console.log('Found:', search.rows.length);
        if (search.rows.length) console.table(search.rows);

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}

debugData();
