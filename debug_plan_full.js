const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function debugPlan() {
    try {
        const client = await pool.connect();
        // Fetch EVERYTHING for the specific plan that failed matching
        // PLN-1770190879088 was the ID from previous debug log
        const res = await client.query(`SELECT * FROM plan_board WHERE plan_id = 'PLN-1770122401171-623'`);

        if (res.rows.length) {
            console.log('--- PLAN BOARD ROW ---');
            console.log(JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log('Plan not found.');
        }
        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

debugPlan();
