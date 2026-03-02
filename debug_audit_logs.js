
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

    console.log("--- Recent Mould Audit Logs ---");
    const res = await client.query(`
        SELECT * FROM mould_audit_logs 
        ORDER BY changed_at DESC 
        LIMIT 5
    `);
    console.table(res.rows);

    await client.end();
}

run().catch(e => console.error(e));
