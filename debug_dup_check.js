
const { Pool } = require('pg');
const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function run() {
    try {
        console.log('--- Debugging Order Suffix: 4430 ---');

        const rows = await pool.query(`
        SELECT id, order_no, machine, mould_name, status 
        FROM plan_board 
        WHERE order_no LIKE '%4430%'
    `);

        if (rows.rows.length === 0) {
            console.log("No plans found matching '%4430%'.");
        } else {
            console.log(`Found ${rows.rows.length} plans matching '%4430%':`);
            rows.rows.forEach(r => {
                console.log(`- [${r.id}] Order: '${r.order_no}' | Mould: "${r.mould_name}" | Status: ${r.status}`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
