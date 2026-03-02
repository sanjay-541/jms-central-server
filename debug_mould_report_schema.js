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
        SELECT
            tc.constraint_name, 
            tc.constraint_type, 
            kcu.column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
        WHERE tc.table_name = 'mould_planning_report'
    `);
        console.log('Constraints:', res.rows);

        const cols = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'mould_planning_report'
    `);
        console.log('Columns:', cols.rows);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
