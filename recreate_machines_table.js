const { Pool } = require('pg');

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
        // Drop and Recreate to clear "demo machines" and ensure schema
        await client.query('DROP TABLE IF EXISTS machines');

        await client.query(`
      CREATE TABLE machines (
        machine VARCHAR(255) PRIMARY KEY,
        line VARCHAR(50),
        building VARCHAR(100),
        tonnage NUMERIC,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

        console.log("Table 'machines' re-created with Tonnage column.");
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}
run();
