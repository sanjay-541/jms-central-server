
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
        console.log('\n--- Testing NEW Server Logic (Strict Mould No) ---');

        // Fetch running plans including mould_name for disambiguation testing
        const running = await pool.query("SELECT plan_id, order_no, machine, mould_name FROM plan_board WHERE order_no IS NOT NULL LIMIT 5");

        for (const p of running.rows) {
            console.log(`Checking Running Plan: ${p.plan_id} (OR: ${p.order_no})`);
            console.log(`  Plan Mould Name: ${p.mould_name}`);

            const linkRes = await pool.query(`
          SELECT 
            p.order_no, 
            p.mould_name as plan_mould_name,
            s.mould_no, 
            s.mould_name as summary_mould_name
          FROM plan_board p
          LEFT JOIN mould_planning_summary s ON s.or_jr_no = p.order_no
          WHERE p.plan_id = $1
        `, [p.plan_id]);

            if (linkRes.rows.length) {
                // We might have multiple rows if one Order has multiple Moulds in summary
                // Filter to find the BEST match using Mould Name
                let best = linkRes.rows[0];
                if (linkRes.rows.length > 1) {
                    const planName = (p.mould_name || '').toLowerCase().trim();

                    const match = linkRes.rows.find(r => {
                        const sumName = (r.summary_mould_name || '').toLowerCase().trim();
                        return sumName && planName.includes(sumName); // or vice versa
                    });
                    if (match) best = match;
                    console.log(`  -> Multiple Summary Rows (${linkRes.rows.length}). Selected best match: ${best.mould_no} (${best.summary_mould_name})`);
                }

                const mouldNo = best.mould_no;
                if (mouldNo) {
                    console.log(`  -> Selected Mould No: '${mouldNo}'`);

                    // 2. Fetch Master strictly by Mould No (ERP Code)
                    // First try exact match
                    let mRows = await pool.query(`SELECT id, erp_item_code, std_wt_kg FROM moulds WHERE erp_item_code = $1`, [mouldNo]);

                    if (mRows.rows.length) {
                        console.log(`    -> EXACT MATCH in Master: ${mRows.rows[0].erp_item_code} (Std Wt: ${mRows.rows[0].std_wt_kg})`);
                    } else {
                        // Fallback: Prefix match (Fuzzy) if exact fails
                        mRows = await pool.query(`SELECT id, erp_item_code, std_wt_kg FROM moulds WHERE erp_item_code LIKE $1 || '%' LIMIT 1`, [mouldNo]);
                        if (mRows.rows.length) {
                            console.log(`    -> FUZZY MATCH in Master: ${mRows.rows[0].erp_item_code} (Std Wt: ${mRows.rows[0].std_wt_kg})`);
                        } else {
                            console.log(`    -> NO MATCH in Master for '${mouldNo}'`);
                        }
                    }
                } else {
                    console.log(`  -> Summary found but Mould No is null/empty.`);
                }
            } else {
                console.log(`  -> No Summary found for Order ${p.order_no}`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
