
const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    port: 5432,
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('--- Applying Performance Indexes ---');

        // 1. Orders Status (for Filtering Pending)
        await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);`);
        console.log('✓ Index: idx_orders_status');

        // 2. Plan Board Order No (for Correlated Subquery)
        await client.query(`CREATE INDEX IF NOT EXISTS idx_plan_board_order_no ON plan_board(order_no);`);
        console.log('✓ Index: idx_plan_board_order_no');

        // 3. Mould Planning Summary OR-JR (for Correlated Subquery)
        await client.query(`CREATE INDEX IF NOT EXISTS idx_mps_or_jr_no ON mould_planning_summary(or_jr_no);`);
        console.log('✓ Index: idx_mps_or_jr_no');

        // 4. OR-JR Report logic (Join + Filters)
        await client.query(`CREATE INDEX IF NOT EXISTS idx_or_jr_no_main ON or_jr_report(or_jr_no);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_or_jr_mld_status ON or_jr_report(mld_status);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_or_jr_closed ON or_jr_report(is_closed);`);

        // Composite for best fit?
        // CREATE INDEX IF NOT EXISTS idx_or_jr_composite ON or_jr_report(or_jr_no, is_closed, mld_status);
        console.log('✓ Indexes: OR-JR Report (Main, MLD Status, Closed)');

        // 5. Global Master Lists (Moulds, Machines)
        await client.query(`CREATE INDEX IF NOT EXISTS idx_moulds_erp_code ON moulds(erp_item_code);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_moulds_erp_name ON moulds(erp_item_name);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_moulds_product ON moulds(product_name);`);
        console.log('✓ Indexes: Moulds (Code, Name, Product)');

        await client.query(`CREATE INDEX IF NOT EXISTS idx_machines_name ON machines(machine);`);
        console.log('✓ Indexes: Machines (Name)');

        console.log('--- Optimization Applied Successfully ---');
    } catch (e) {
        console.error('Error applying indexes:', e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
