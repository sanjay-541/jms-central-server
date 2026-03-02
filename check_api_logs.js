
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

    console.log("--- Checking APITester Logs ---");
    const res = await client.query(`
        SELECT * FROM mould_audit_logs 
        WHERE changed_by = 'ApiTester'
        ORDER BY changed_at DESC 
        LIMIT 1
    `);
    console.table(res.rows);

    await client.end();
}

run().catch(e => console.error(e));
