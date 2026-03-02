const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function checkOrdersSchema() {
    await client.connect();

    console.log('--- ORDERS Columns ---');
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'orders';
    `);
    res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

    await client.end();
}

checkOrdersSchema().catch(e => console.error(e));
