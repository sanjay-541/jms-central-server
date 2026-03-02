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

        console.log('--- Migrating Moulds Table ---');

        // 1. Add Column
        try {
            await client.query("ALTER TABLE moulds ADD COLUMN sfg_qty text");
            console.log('Added column sfg_qty.');
        } catch (e) {
            console.log('Column sfg_qty likely exists:', e.message);
        }

        // 2. Populate
        const res = await client.query("UPDATE moulds SET sfg_qty = std_volume_capacity WHERE sfg_qty IS NULL");
        console.log(`Updated ${res.rowCount} rows with default value from std_volume_capacity.`);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
