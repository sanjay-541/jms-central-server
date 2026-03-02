require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'jpsms',
    password: process.env.DB_PASSWORD || 'Sanjay@541##',
    port: process.env.DB_PORT || 5432,
});

async function run() {
    try {
        console.log('--- DB INSPECTION ---');

        // 1. Check if 'orders' is Table or View
        const typeRes = await pool.query(`
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_name = 'orders' OR table_name = 'or_jr_report'
        `);
        console.table(typeRes.rows);

        // 2. Check Row Counts
        const countO = await pool.query('SELECT COUNT(*) FROM orders');
        const countR = await pool.query('SELECT COUNT(*) FROM or_jr_report');
        console.log(`Rows in 'orders': ${countO.rows[0].count}`);
        console.log(`Rows in 'or_jr_report': ${countR.rows[0].count}`);

        // 3. Inspect 'orders' columns
        const cols = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'orders'
        `);
        console.log("Columns in 'orders':");
        cols.rows.forEach(r => console.log(` - ${r.column_name} (${r.data_type})`));

        console.log('--- END ---');
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
