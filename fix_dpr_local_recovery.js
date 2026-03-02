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
        console.log('Starting Local DPR Data Recovery...');

        // 1. Recover from Moulds (Prefix Match)
        // d.mould_no '3146' -> m.erp_item_code '3146-B'
        console.log('Recovering via Mould Master prefix match...');
        const res1 = await pool.query(`
            UPDATE dpr_hourly d
            SET 
                mould_name = m.product_name,
                product_name = COALESCE(d.product_name, m.product_name)
            FROM moulds m
            WHERE d.mould_name IS NULL 
            AND m.erp_item_code LIKE d.mould_no || '-%'
        `);
        console.log(`Updated ${res1.rowCount} rows from Moulds (Prefix).`);

        // 2. Recover from Moulds (Exact Match)
        console.log('Recovering via Mould Master exact match...');
        const res2 = await pool.query(`
            UPDATE dpr_hourly d
            SET 
                mould_name = m.product_name,
                product_name = COALESCE(d.product_name, m.product_name)
            FROM moulds m
            WHERE d.mould_name IS NULL 
            AND m.erp_item_code = d.mould_no
        `);
        console.log(`Updated ${res2.rowCount} rows from Moulds (Exact).`);

        // 3. Recover from Orders (Exact Order No)
        console.log('Recovering via Orders...');
        const res3 = await pool.query(`
            UPDATE dpr_hourly d
            SET product_name = COALESCE(d.product_name, o.item_name)
            FROM orders o
            WHERE d.product_name IS NULL
            AND o.order_no = d.order_no
        `);
        console.log(`Updated ${res3.rowCount} rows from Orders.`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

run();
