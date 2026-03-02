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
        WHERE tc.table_name = 'orders'
    `);
        console.log('Constraints:', res.rows);

        // Check if order_no is the PK or unique
        const isUnique = res.rows.some(r => r.column_name === 'order_no' && (r.constraint_type === 'PRIMARY KEY' || r.constraint_type === 'UNIQUE'));
        console.log('Is order_no Unique?', isUnique);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

run();
