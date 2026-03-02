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

        console.log(`\n--- 1. Fetching ACTIVE PLAN for ${machine} ---`);
        const planRes = await client.query(`
            SELECT id, plan_id, mould_name, mould_code, status 
            FROM plan_board 
            WHERE machine = $1 AND status = 'Running'
        `, [machine]);

        if (planRes.rows.length === 0) {
            console.log('No Running plan found.');
            return;
        }

        const plan = planRes.rows[0];
        console.log('PLAN DATA:', plan);
        console.log(`Plan Mould Name: '${plan.mould_name}'`);
        console.log(`Plan Mould Code: '${plan.mould_code}'`);

        console.log(`\n--- 2. Checking Mould Master by CODE ('${plan.mould_code}') ---`);
        if (plan.mould_code) {
            const codeRes = await client.query(`SELECT * FROM moulds WHERE erp_item_code = $1`, [plan.mould_code]);
            if (codeRes.rows.length) {
                console.log('MATCH FOUND BY CODE:', codeRes.rows[0]);
            } else {
                console.log('NO MATCH BY CODE.');
            }
        } else {
            console.log('Plan has NO Mould Code.');
        }

        console.log(`\n--- 3. Checking Mould Master by NAME ('${plan.mould_name}') ---`);

        // Exact
        const exact = await client.query(`SELECT * FROM moulds WHERE product_name = $1`, [plan.mould_name]);
        if (exact.rows.length) console.log('EXACT MATCH FOUND:', exact.rows[0]);
        else console.log('NO EXACT MATCH.');

        // Trim + ILIKE
        const fuzzy = await client.query(`SELECT * FROM moulds WHERE TRIM(product_name) ILIKE TRIM($1)`, [plan.mould_name]);
        if (fuzzy.rows.length) console.log('FUZZY MATCH FOUND:', fuzzy.rows[0]);
        else console.log('NO FUZZY MATCH.');

        // Broad Search
        console.log(`\n--- 4. Broad Search (First 5 chars: '${plan.mould_name.substring(0, 5)}') ---`);
        const broad = await client.query(`SELECT product_name, erp_item_code FROM moulds WHERE product_name ILIKE $1 LIMIT 5`, [`%${plan.mould_name.substring(0, 5)}%`]);
        console.log('Did you mean one of these?', broad.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
