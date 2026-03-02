const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: 'jpsms',
    port: 5432
});

async function run() {
    try {
        const client = await pool.connect();
        console.log('Connected.');

        // 1. Check Table
        const res = await client.query(`SELECT to_regclass('public.plan_audit_logs')`);
        console.log('Table Exists:', res.rows[0].to_regclass);

        // 2. Try Insert
        if (res.rows[0].to_regclass) {
            await client.query("INSERT INTO plan_audit_logs (action, details, user_name) VALUES ('TEST', '{}', 'DebugScript')");
            console.log('Inserted test log.');

            // 3. Try Select
            const logs = await client.query("SELECT * FROM plan_audit_logs ORDER BY id DESC LIMIT 1");
            console.log('Fetched Log:', logs.rows[0]);
        }

        client.release();
    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}
run();
