const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function check() {
    try {
        const orderNo = 'JR/JG/2526/4766';

        // 0. Check columns
        const cols = await pool.query(`SELECT * FROM dpr_hourly LIMIT 1`);
        console.log('DPR Hourly Columns:', Object.keys(cols.rows[0] || {}));

        // 1. Check dpr_hourly (Actual Entries)
        const entries = await pool.query(`
            SELECT * 
            FROM dpr_hourly 
            WHERE order_no ILIKE $1 
            ORDER BY created_at DESC LIMIT 5
        `, [`%${orderNo}%`]);

        console.log('\n--- DPR Hourly Entries ---');
        if (entries.rows.length === 0) console.log('No entries found in dpr_hourly.');
        entries.rows.forEach(r => console.log(r));

        // 2. Check std_actual (Setups/Plan)
        // Note: std_actual might use 'machine' or 'machine_name' or similar. Assuming 'machine' for now.
        try {
            const setups = await pool.query(`
                SELECT id, machine, mould_name, order_no, created_at
                FROM std_actual
                WHERE order_no ILIKE $1
            `, [`%${orderNo}%`]);

            console.log('\n--- STD Actual (Setups) ---');
            if (setups.rows.length === 0) console.log('No setups found in std_actual.');
            setups.rows.forEach(r => console.log(r));
        } catch (err) {
            console.log('Error checking std_actual (maybe column name issue):', err.message);
        }

        // 3. Fallback: Check machine explicitly
        if (entries.rows.length === 0) {
            console.log('\n--- Checking Machine Entries (Last 5) ---');
            const mEntries = await pool.query(`
                SELECT id, machine, order_no, mould_name 
                FROM dpr_hourly 
                WHERE machine ILIKE $1 
                ORDER BY created_at DESC LIMIT 5
             `, [`%HYD-350-2%`]);
            mEntries.rows.forEach(r => console.log(r));
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
