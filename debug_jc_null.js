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
        // Check Nulls
        const nulls = await pool.query("SELECT COUNT(*) FROM or_jr_report WHERE job_card_no IS NULL OR job_card_no = ''");
        console.log("Records with Null/Empty JC:", nulls.rows[0].count);

        // Check Constraint
        const constraint = await pool.query(`
        SELECT is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'or_jr_report' AND column_name = 'job_card_no'
    `);
        console.log("Is JC Nullable:", constraint.rows[0].is_nullable);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
