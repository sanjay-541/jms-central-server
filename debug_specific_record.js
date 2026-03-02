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
        console.log("--- Inspecting 'B -L3>OM-150-7' Record ---");
        const res = await pool.query(`
            SELECT id, dpr_date, machine, hour_slot, mould_no, order_no, mould_name, product_name 
            FROM dpr_hourly 
            WHERE machine = 'B -L3>OM-150-7' AND dpr_date = '2026-02-07'
        `);
        console.table(res.rows);

        if (res.rowCount > 0) {
            const mNo = res.rows[0].mould_no;
            if (mNo) {
                console.log(`\nChecking Mould Master for '${mNo}'...`);
                const m = await pool.query("SELECT * FROM moulds WHERE erp_item_code LIKE $1", [mNo + '%']);
                console.table(m.rows);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
