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
        const target = "BETTER HOME SQUARE BUCKET 18 LTR BTM";
        console.log(`Checking for Mould: "${target}"`);

        // 1. Exact Match
        const res1 = await client.query('SELECT id, product_name, std_wt_kg FROM moulds WHERE product_name = $1', [target]);
        console.log(`Exact Match Count: ${res1.rows.length}`);
        if (res1.rows.length) console.log(res1.rows[0]);

        // 2. Trimmed Match
        const res2 = await client.query('SELECT id, product_name, std_wt_kg FROM moulds WHERE TRIM(product_name) = TRIM($1)', [target]);
        console.log(`Trimmed Match Count: ${res2.rows.length}`);
        if (res2.rows.length) console.log(res2.rows[0]);

        // 3. ILIKE Match
        const res3 = await client.query('SELECT id, product_name, std_wt_kg FROM moulds WHERE product_name ILIKE $1', [target]);
        console.log(`ILIKE Match Count: ${res3.rows.length}`);

        // 4. Fuzzy / Starts With
        const res4 = await client.query("SELECT id, product_name, std_wt_kg FROM moulds WHERE product_name LIKE 'BETTER HOME%' LIMIT 5");
        console.log(`\nPartial Matches (BETTER HOME%):`);
        res4.rows.forEach(r => console.log(`"${r.product_name}" (ID: ${r.id}, STD: ${r.std_wt_kg})`));

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
