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
        SELECT conname, contype, pg_get_constraintdef(oid) 
        FROM pg_constraint 
        WHERE conrelid = 'or_jr_report'::regclass
    `);
        console.log("Constraints:", JSON.stringify(res.rows, null, 2));

        const indexes = await pool.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'or_jr_report'
    `);
        console.log("Indexes:", JSON.stringify(indexes.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
