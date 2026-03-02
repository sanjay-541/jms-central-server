const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Sanjay@541##',
    database: process.env.DB_NAME || 'jpsms'
});

async function run() {
    try {
        const jr = 'JR/JG/2526/5120';
        console.log(`Checking ${jr}...`);

        console.log('--- plan_board ---');
        const resPlan = await pool.query('SELECT status, completed_by, completed_at FROM plan_board WHERE order_no = $1', [jr]);
        console.log(resPlan.rows);

        console.log('--- or_jr_report ---');
        const resReport = await pool.query('SELECT jr_close, is_closed FROM or_jr_report WHERE or_jr_no = $1', [jr]);
        console.log(resReport.rows);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
