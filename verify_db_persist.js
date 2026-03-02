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
        console.log("Verifying DB Schema...");
        const code = 'TEST-DB-' + Date.now();

        await pool.query(`INSERT INTO moulds (erp_item_code, primary_machine, secondary_machine) VALUES ($1, $2, $3)`, [code, 'PM-1', 'SM-2']);

        const res = await pool.query(`SELECT * FROM moulds WHERE erp_item_code = $1`, [code]);
        if (res.rows.length) {
            const row = res.rows[0];
            console.log("Row Found:", row.erp_item_code);
            console.log("Primary:", row.primary_machine);
            console.log("Secondary:", row.secondary_machine);

            if (row.primary_machine === 'PM-1' && row.secondary_machine === 'SM-2') {
                console.log("SUCCESS: Data persisted correctly.");
            } else {
                console.error("FAIL: Data mismatch.");
            }
        } else {
            console.error("FAIL: Row not inserted.");
        }

        // Cleanup
        await pool.query(`DELETE FROM moulds WHERE erp_item_code = $1`, [code]);
        pool.end();
    } catch (e) {
        console.error(e);
        pool.end();
    }
}
run();
