
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
    console.log('Creating grinding_logs table...');

    await client.query(`
        CREATE TABLE IF NOT EXISTS grinding_logs (
            id SERIAL PRIMARY KEY,
            plan_id INTEGER, -- Optional link to plan
            order_no TEXT NOT NULL,
            job_card_no TEXT,
            rejection_qty INTEGER DEFAULT 0,
            rejection_weight NUMERIC(10,3) DEFAULT 0,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by TEXT,
            remarks TEXT
        );
    `);

    // Add index for faster lookups
    await client.query(`CREATE INDEX IF NOT EXISTS idx_grinding_order ON grinding_logs(order_no);`);

    console.log('Table created successfully.');
    await client.end();
}

run().catch(e => console.error(e));
