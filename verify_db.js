const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function verifyTables() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

        console.log('Tables in database:', res.rows.map(r => r.table_name));
    } catch (err) {
        console.error('Error verifying tables:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

verifyTables();
