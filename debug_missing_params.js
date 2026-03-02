
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: 'postgresql://postgres:Sanjay%40541%23%23@localhost:5432/jpsms',
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('--- Debugging Entries with Specific Shot Counts ---');
        // Find rows that likely match the user's screen
        const res = await client.query(`
      SELECT 
        id, shots, colour, plan_id, order_no, mould_no, created_at
      FROM dpr_hourly 
      WHERE shots IN (77, 45, 62)
      ORDER BY created_at DESC
      LIMIT 10
    `);

        console.table(res.rows);

        if (res.rows.length > 0) {
            const row = res.rows[0];
            console.log('--- Inspecting Plan for First Match ---');
            if (row.plan_id) {
                // Fix: Cast param to text for comparison if plan_id is string, or handle numeric ID
                // row.plan_id likely needs to be compared against string 'plan_id' column or integer 'id'
                const pRes = await client.query(`SELECT * FROM plan_board WHERE CAST(plan_id AS TEXT) = $1 OR CAST(id AS TEXT) = $1`, [String(row.plan_id)]);
                console.log('Plan Board Data:', pRes.rows[0]);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
