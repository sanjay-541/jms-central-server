const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function get_schema() {
    try {
        const client = await pool.connect();
        // Get columns for or_jr_report
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'or_jr_report'
    `);

        // Generate CREATE TABLE statement
        let sql = 'CREATE TABLE mould_planning_report (\n';
        const cols = res.rows.map(r => {
            // Skip id if it's serial/generated, but for now we might just copy all except primary key constraints if we want same structure
            // Actually, better to just use generic text for report columns
            return `  ${r.column_name} ${r.data_type === 'integer' ? 'INTEGER' : 'TEXT'}`;
        });
        sql += cols.join(',\n');
        sql += '\n);';

        console.log(sql);

        // Also print columns to help me write the server.js logic
        console.log('\nCOLUMNS:', res.rows.map(r => r.column_name).join(', '));

        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

get_schema();
