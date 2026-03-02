const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function check(table) {
    try {
        const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
        console.log(`Table ${table}:`, res.rows.map(r => r.column_name).join(', '));
    } catch (e) {
        console.error(e.message);
    }
}

(async () => {
    await check('machines');
    await check('orders');
    await check('users');
    await check('mould_planning_report');
    pool.end();
})();
