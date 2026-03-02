                                              
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
        const res = await pool.query(`
      SELECT id, plan_id, machine, order_no, mould_code, item_code, mould_name, status
      FROM plan_board 
      LIMIT 10
    `);

        console.log('--- Checking linkage ---');
        for (const p of res.rows) {
            if (!p.item_code) {
                console.log(`[SKIP] Plan ${p.plan_id}: No item_code`);
                continue;
            }

            // 1. Exact Match
            const exact = await pool.query("SELECT id, erp_item_code FROM moulds WHERE erp_item_code = $1", [p.item_code]);
            if (exact.rows.length) {
                console.log(`[EXACT] Plan Item: ${p.item_code} -> Master: ${exact.rows[0].erp_item_code}`);
            } else {
                // 2. Fuzzy Match
                const fuzzy = await pool.query("SELECT id, erp_item_code, product_name FROM moulds WHERE erp_item_code LIKE $1 || '%'", [p.item_code]);
                if (fuzzy.rows.length) {
                    // Found prefix match
                    const matches = fuzzy.rows.map(r => r.erp_item_code);
                    console.log(`[FUZZY] Plan Item: ${p.item_code} -> Matches: ${matches.join(', ')}`);
                } else {
                    console.log(`[FAIL] Plan Item: ${p.item_code} -> No match found.`);
                }
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
