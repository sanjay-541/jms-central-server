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
        // Check tables referencing or_jr_report
        const res = await pool.query(`
        SELECT
            tc.table_schema, 
            tc.constraint_name, 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'or_jr_report';
    `);
        console.log("Foreign Keys referencing or_jr_report:", JSON.stringify(res.rows, null, 2));

        // Check Primary Key of or_jr_report
        const pk = await pool.query(`
        SELECT a.attname
        FROM   pg_index i
        JOIN   pg_attribute a ON a.attrelid = i.indrelid
                             AND a.attnum = ANY(i.indkey)
        WHERE  i.indrelid = 'or_jr_report'::regclass
        AND    i.indisprimary;
    `);
        console.log("Primary Key columns:", JSON.stringify(pk.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
