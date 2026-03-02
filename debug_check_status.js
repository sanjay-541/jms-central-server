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
        const res = await pool.query("SELECT or_jr_no, mld_status, shift_status, prt_tuf_status, pack_status FROM or_jr_report WHERE or_jr_no = 'JR/JG/2526/3971'");
        console.log("Record Status:", JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
