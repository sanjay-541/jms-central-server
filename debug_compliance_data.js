
const { Pool } = require('pg');
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: process.env.PGPASSWORD || 'Sanjay@541##',
    port: 5432,
});

async function run() {
    try {
        // Hardcoded date/shift where user likely has data (TODAY)
        // Or use a date known to have data. Let's try today and yesterday.
        const date = new Date().toISOString().split('T')[0];
        const shift = 'Day';

        console.log(`Fetching Summary Matrix for ${date} / ${shift}`);

        const res = await pool.query(`
      SELECT 
        s.machine, s.plan_id, s.mould_name,
        COALESCE(m.pcs_per_hour, m2.pcs_per_hour) as std_pcs_hr,
        COALESCE(m.erp_item_code, m2.erp_item_code) as mould_no
      FROM std_actual s
      LEFT JOIN plan_board pb ON pb.plan_id = s.plan_id
      LEFT JOIN moulds m ON TRIM(m.erp_item_code) = TRIM(COALESCE(pb.mould_code, ''))
      LEFT JOIN moulds m2 ON m2.product_name = s.mould_name OR m2.erp_item_name = s.mould_name
      WHERE s.dpr_date::date = $1::date AND s.shift = $2
    `, [date, shift]);

        console.log('Setups Found:', res.rows.length);
        if (res.rows.length > 0) {
            console.log('Sample Row:', res.rows[0]);
        } else {
            // specific check for debug
            const all = await pool.query('SELECT * FROM std_actual ORDER BY created_at DESC LIMIT 5');
            console.log('Last 5 std_actual entries:', all.rows.map(r => ({ id: r.id, plan_id: r.plan_id, date: r.dpr_date, shift: r.shift, mould: r.mould_name })));
        }

        pool.end();
    } catch (e) {
        console.error(e);
    }
}
run();
