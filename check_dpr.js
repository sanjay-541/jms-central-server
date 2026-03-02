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
        const res1 = await pool.query('SELECT count(*) as count FROM dpr_hourly');
        console.log('Total DPR Hourly Records:', res1.rows[0].count);

        // Check for Orphaned Plan IDs (Exist in DPR but NOT in Plan Board)
        const res3 = await pool.query(`
        SELECT count(DISTINCT d.plan_id) as orphan_plans, count(d.id) as orphan_records 
        FROM dpr_hourly d 
        LEFT JOIN plan_board pb ON pb.id::TEXT = d.plan_id::TEXT -- Cast to TEXT just in case types mismatch
        WHERE pb.id IS NULL 
        AND d.plan_id IS NOT NULL
        AND d.plan_id::TEXT != '' -- Ensure not empty string
    `);
        console.log(`Orphaned DPR Records (Plan ID not found in Board): ${res3.rows[0].orphan_records} across ${res3.rows[0].orphan_plans} distinct plan_ids`);

        if (parseInt(res3.rows[0].orphan_records) > 0) {
            console.log('Sample Orphans (First 5):');
            const res4 = await pool.query(`
            SELECT d.plan_id, d.order_no, d.mould_no, count(d.id) as record_count 
            FROM dpr_hourly d 
            LEFT JOIN plan_board pb ON pb.id::TEXT = d.plan_id::TEXT 
            WHERE pb.id IS NULL 
            AND d.plan_id IS NOT NULL 
            GROUP BY d.plan_id, d.order_no, d.mould_no 
            LIMIT 5
        `);
            console.table(res4.rows);
        }

        // Also check if plan_id TYPE mismatch (dpr_hourly treats plan_id as INT usually, plan_board id is SERIAL INT).
        // The previous join query assumed types match.
        // If dpr_hourly.plan_id is text/varchar in schema, distinct casting might help.

        // Check if dpr_hourly.plan_id is numeric or string
        // const schema = await pool.query(`SELECT data_type FROM information_schema.columns WHERE table_name = 'dpr_hourly' AND column_name = 'plan_id'`);
        // console.log('dpr_hourly.plan_id Type:', schema.rows[0].data_type);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

check();
