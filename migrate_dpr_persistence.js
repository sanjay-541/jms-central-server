const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('1. Adding Columns to dpr_hourly...');
        await client.query(`
            ALTER TABLE dpr_hourly 
            ADD COLUMN IF NOT EXISTS mould_name TEXT,
            ADD COLUMN IF NOT EXISTS product_name TEXT,
            ADD COLUMN IF NOT EXISTS order_no TEXT,
            ADD COLUMN IF NOT EXISTS mould_no TEXT
        `);

        console.log('2. Adding Columns to std_actual...');
        await client.query(`
            ALTER TABLE std_actual 
            ADD COLUMN IF NOT EXISTS product_name TEXT,
            ADD COLUMN IF NOT EXISTS order_no TEXT
        `);

        console.log('3. Backfilling dpr_hourly from plan_board (Plan Link)...');
        const res1 = await client.query(`
            UPDATE dpr_hourly d
            SET 
                mould_name = COALESCE(d.mould_name, pb.mould_name),
                product_name = COALESCE(d.product_name, pb.item_name),
                order_no = COALESCE(d.order_no, pb.order_no),
                mould_no = COALESCE(d.mould_no, pb.mould_code)
            FROM plan_board pb
            WHERE (d.plan_id::TEXT = pb.id::TEXT OR d.plan_id::TEXT = pb.plan_id::TEXT)
            AND (d.mould_name IS NULL OR d.product_name IS NULL)
        `);
        console.log(`   Updated ${res1.rowCount} rows from Plan Board.`);

        console.log('4. Backfilling dpr_hourly from Moulds (Prefix Match)...');
        // Matches '3146' in DPR to '3146-B' in Moulds
        const res2 = await client.query(`
            UPDATE dpr_hourly d
            SET 
                mould_name = m.product_name,
                product_name = COALESCE(d.product_name, m.product_name)
            FROM moulds m
            WHERE d.mould_name IS NULL 
            AND d.mould_no IS NOT NULL
            AND m.erp_item_code LIKE d.mould_no || '-%'
        `);
        console.log(`   Updated ${res2.rowCount} rows from Moulds (Prefix).`);

        console.log('5. Backfilling dpr_hourly from Orders (Order No)...');
        const res3 = await client.query(`
            UPDATE dpr_hourly d
            SET product_name = COALESCE(d.product_name, o.item_name)
            FROM orders o
            WHERE d.product_name IS NULL
            AND d.order_no IS NOT NULL
            AND o.order_no = d.order_no
        `);
        console.log(`   Updated ${res3.rowCount} rows from Orders.`);

        console.log('6. Backfilling std_actual from plan_board...');
        const res4 = await client.query(`
            UPDATE std_actual s
            SET 
                product_name = COALESCE(s.product_name, pb.item_name),
                order_no = COALESCE(s.order_no, pb.order_no)
            FROM plan_board pb
            WHERE (s.plan_id::TEXT = pb.plan_id::TEXT OR s.plan_id::TEXT = pb.id::TEXT)
            AND (s.product_name IS NULL OR s.order_no IS NULL)
        `);
        console.log(`   Updated ${res4.rowCount} rows in std_actual.`);

        console.log('7. Final Cleanup: Set mould_name = product_name if still NULL...');
        const res5 = await client.query(`
            UPDATE dpr_hourly
            SET mould_name = product_name
            WHERE mould_name IS NULL AND product_name IS NOT NULL
        `);
        console.log(`   Updated ${res5.rowCount} rows (fallback).`);

        await client.query('COMMIT');
        console.log('Migration Complete.');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration Failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
