
const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    await client.connect();
    console.log("--- Checking Product Name in Mould Planning Summary ---");

    // Get a few rows where we expect data
    const res = await client.query(`
        SELECT or_jr_no, product_name, item_code 
        FROM mould_planning_summary 
        LIMIT 5
    `);

    console.table(res.rows);

    // Check specific Order if possible (optional, just listing general first)

    await client.end();
}

run().catch(e => console.error(e));
