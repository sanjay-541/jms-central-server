const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('--- Test 2: ON CONFLICT (sync_id) ---');
        // This should fail with "no unique constraint" if sync_id is not unique

        const row = { id: 32961, order_no: 'TEST-2', factory_id: 1, sync_id: 'some-uuid' };
        const keys = Object.keys(row);
        const vals = Object.values(row);
        const idx = keys.map((_, i) => `$${i + 1}`);

        // We simulate what the code does if sync_id is present
        const sql = `
            INSERT INTO orders (${keys.join(',')}) 
            VALUES (${idx.join(',')})
            ON CONFLICT (sync_id) 
            DO UPDATE SET order_no = EXCLUDED.order_no
        `;

        console.log('Executing SQL:', sql);
        await client.query(sql, vals);
        console.log('Success: Orders Upsert with sync_id Worked');

    } catch (e) {
        console.error('Failure Expected?');
        console.error(e.message);
    } finally {
        client.release();
        pool.end();
    }
}

run();
