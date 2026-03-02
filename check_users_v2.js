require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms',
    port: process.env.PGPORT || 5432
});

(async () => {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users'
        `);
        console.table(res.rows);

        const constraints = await pool.query(`
            SELECT c.column_name, tc.constraint_type
            FROM information_schema.table_constraints tc 
            JOIN information_schema.constraint_column_usage c ON c.constraint_name = tc.constraint_name 
            WHERE tc.table_name = 'users'
        `);
        console.table(constraints.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
})();
