const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    try {
        await client.connect();

        console.log('--- INDEXES on dpr_hourly ---');
        const res = await client.query("SELECT indexdef FROM pg_indexes WHERE tablename = 'dpr_hourly'");
        res.rows.forEach(r => console.log(r.indexdef));

        console.log('\n--- CONSTRAINT Definitions ---');
        const res2 = await client.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'dpr_hourly'::regclass;
        `);
        res2.rows.forEach(r => console.log(`${r.conname}: ${r.pg_get_constraintdef}`));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
