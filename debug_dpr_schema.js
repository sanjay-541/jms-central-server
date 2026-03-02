
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'jpsms',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    port: process.env.PGPORT || 5432,
});

async function run() {
    try {
        const client = await pool.connect();
        console.log('Connected to DB');

        // Check if table or view
        const typeRes = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_name = 'dpr_hourly'
    `);
        console.log('Type:', typeRes.rows);

        // Get columns
        const colsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'dpr_hourly'
    `);
        console.log('Columns:', colsRes.rows);

        client.release();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
