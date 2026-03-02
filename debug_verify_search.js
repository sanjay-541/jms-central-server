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
        // 1. Fetch current state
        const res = await pool.query("SELECT or_jr_no, job_card_no, mld_status, is_closed FROM or_jr_report WHERE or_jr_no = 'JR/JG/2526/3971'");
        console.log("Current DB State:", JSON.stringify(res.rows, null, 2));

        // 2. Test Search Query Logic
        const search = 'JR/JG/2526/3971';
        const pattern = `%${search}%`;
        const searchRes = await pool.query(`
        SELECT or_jr_no FROM or_jr_report 
        WHERE (or_jr_no ILIKE $1 OR job_card_no ILIKE $1)
    `, [pattern]);
        console.log(`Search for '${search}' found ${searchRes.rows.length} rows.`);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
