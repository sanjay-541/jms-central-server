const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    database: process.env.PGDATABASE || 'jpsms'
});

async function check() {
    try {
        console.log('--- Detailed DPR Hourly Dump ---');
        const res = await pool.query(`SELECT * FROM dpr_hourly ORDER BY created_at DESC LIMIT 5`);

        if (res.rows.length === 0) {
            console.log('No rows found!');
        } else {
            res.rows.forEach((r, i) => {
                console.log(`\nRow ${i + 1}:`);
                console.log(`  ID: ${r.id}`);
                console.log(`  Date: ${r.dpr_date} (Type: ${typeof r.dpr_date})`);
                console.log(`  Shift: '${r.shift}' (Type: ${typeof r.shift})`);
                console.log(`  Slot: '${r.hour_slot}' (Type: ${typeof r.hour_slot})`);
                console.log(`  Machine: '${r.machine}' (Type: ${typeof r.machine})`);
                console.log(`  MouldNo: '${r.mould_no}'`);
                console.log(`  OrderNo: '${r.order_no}'`);
                console.log(`  MouldName: '${r.mould_name}'`);
                console.log(`  ProductName: '${r.product_name}'`);
            });
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
