const { Client } = require('pg');

const client = new Client({
    host: '72.62.228.195',
    user: 'postgres',
    password: 'Sanjay@541##',
    database: 'jpsms',
    port: 5432,
});

async function fixSchema() {
    try {
        console.log('Connecting to Remote Database...');
        await client.connect();

        console.log('Adding updated_at column to assembly_scans...');
        await client.query("ALTER TABLE assembly_scans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();");

        console.log('SUCCESS: Column added (or already existed).');
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await client.end();
    }
}

fixSchema();
