const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    try {
        await client.connect();
        const machine = 'B -L1>HYD-350-2';
        console.log(`Checking Running Plan for: ${machine}`);

        const res = await client.query(`
            SELECT plan_id, status, mould_name, order_no 
            FROM plan_board 
            WHERE machine = $1 AND status = 'Running'
        `, [machine]);

        if (res.rows.length === 0) {
            console.log('No Running plan found. Checking PLANNED...');
            const res2 = await client.query(`
                SELECT plan_id, status, mould_name, order_no 
                FROM plan_board 
                WHERE machine = $1 AND status = 'Planned' LIMIT 1
            `, [machine]);
            if (res2.rows.length) {
                printDetails(res2.rows[0]);
            } else {
                console.log('No Running or Planned plan found.');
            }
        } else {
            printDetails(res.rows[0]);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

async function printDetails(plan) {
    console.log('Found Plan:', plan);
    const mouldName = plan.mould_name;
    console.log(`Mould Name in Plan: "${mouldName}"`);

    const mRes = await client.query(`
        SELECT id, product_name, erp_item_code, std_wt_kg, cycle_time, no_of_cav 
        FROM moulds 
        WHERE product_name = $1
    `, [mouldName]);

    console.log(`\nSearching MOULDS table for product_name = "${mouldName}"`);
    if (mRes.rows.length) {
        console.log('Found matches in MOULDS:', mRes.rows.length);
        console.log(mRes.rows[0]);
    } else {
        console.log('NO MATCH found in MOULDS table (by product_name).');
        // Try trimming?
        const mTrim = await client.query(`SELECT id, product_name FROM moulds WHERE TRIM(product_name) = TRIM($1)`, [mouldName]);
        if (mTrim.rows.length) console.log('But match found if TRIMMED:', mTrim.rows[0]);
    }
}

run();
