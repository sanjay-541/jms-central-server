
const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'JMS',
    password: 'admin',
    port: 5432,
});

async function run() {
    try {
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'std_actual'");
        console.log('Columns in std_actual:', res.rows.map(r => r.column_name));
        pool.end();
    } catch (e) {
        console.error(e);
    }
}
run();
