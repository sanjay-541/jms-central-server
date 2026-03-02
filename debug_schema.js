const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'std_actual'
        `);
        const fs = require('fs');
        fs.writeFileSync('schema_dump.json', JSON.stringify(res.rows, null, 2));
        console.log('Schema saved to schema_dump.json');
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
