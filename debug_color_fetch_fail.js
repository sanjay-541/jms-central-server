const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function debugColorFetch() {
    try {
        const client = await pool.connect();

        console.log('--- DEBUGGING COLOR FETCH ---');

        // 1. Get a recent Plan
        const planRes = await client.query(`
      SELECT plan_id, order_no, mould_code, item_code, item_name 
      FROM plan_board 
      WHERE status = 'Running' OR status = 'Pending' 
      ORDER BY plan_id DESC LIMIT 1
    `);

        if (planRes.rows.length === 0) {
            console.log('No active plans found to debug.');
            return;
        }

        const plan = planRes.rows[0];
        console.log('1. Active Plan Found:', plan);

        if (!plan.item_code) {
            console.log('WARNING: Plan has NO item_code. Strict filter will likely fail or behave unexpectedly.');
        }

        // 2. Check JC Details content for this OR/JC
        console.log('\n2. Checking JC Details for OR:', plan.order_no);

        // We search loosely first to see what exists
        const jcRes = await client.query(`
      SELECT data
      FROM jc_details
      WHERE data->>'or_jr_no' = $1
    `, [plan.order_no]);

        console.log(`Found ${jcRes.rows.length} rows in jc_details for this Order.`);

        if (jcRes.rows.length > 0) {
            console.log('Sample Rows (Fields relevant to Matching):');
            jcRes.rows.slice(0, 5).forEach((r, i) => console.log(`[${i}]`, r));
        }

        // 3. Test the STRICT Match logic manually
        if (plan.item_code) {
            const strictMatch = jcRes.rows.filter(r => {
                const d = r.data || {};
                const term = plan.item_code.trim();
                return (
                    String(d.item_code || '').trim() === term ||
                    String(d.mould_item_code || '').trim() === term ||
                    String(d.mold_item_code || '').trim() === term ||
                    String(d.our_code || '').trim() === term
                );
            });

            console.log(`\n3. STRICT MATCH TEST (Item Code: '${plan.item_code}'):`);
            console.log(`Matches found in JS: ${strictMatch.length}`);

            if (strictMatch.length === 0) {
                console.log('FAILURE: No rows in jc_details match the plan item_code.');
                console.log('Possible Causes:');
                console.log('1. jc_details is missing strict item_code or mould_item_code.');
                console.log('2. Mismatch in formatting (spaces/case)?');
                console.log('3. Plan Item Code is wrong?');
            }
        } else {
            console.log('\n3. STRICT MATCH TEST SKIPPED (No Item Code in Plan)');
        }

        client.release();
    } catch (e) {
        console.error('Error:', e);
    } finally {
        pool.end();
    }
}

debugColorFetch();
