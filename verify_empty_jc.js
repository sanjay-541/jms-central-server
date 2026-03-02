const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    const client = await pool.connect();
    try {
        const testOR = 'TEST-EMPTY-JC';
        await client.query('BEGIN');

        // Cleanup
        await client.query("DELETE FROM or_jr_report WHERE or_jr_no = $1", [testOR]);

        console.log("1. Inserting Record with EMPTY JC...");
        await client.query(`
        INSERT INTO or_jr_report(or_jr_no, job_card_no) VALUES($1, $2)
    `, [testOR, '']);

        console.log("2. Inserting Record with NEW JC...");
        await client.query(`
        INSERT INTO or_jr_report(or_jr_no, job_card_no) VALUES($1, $2)
    `, [testOR, 'JC-NEW']);

        const res = await client.query("SELECT or_jr_no, job_card_no FROM or_jr_report WHERE or_jr_no = $1", [testOR]);
        console.log("Resulting Records:", JSON.stringify(res.rows, null, 2));

        if (res.rows.length === 2) {
            console.log("SUCCESS: Both Empty JC and New JC exist.");
        } else {
            console.log("FAILURE: Count mismatch.");
        }

        await client.query('ROLLBACK'); // Rollback to keep DB clean
    } catch (e) {
        console.error(e);
        await client.query('ROLLBACK');
    } finally {
        client.release();
        pool.end();
    }
}
run();
