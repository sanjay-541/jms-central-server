const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function debugSpecificOR() {
    try {
        const client = await pool.connect();
        const targetedOR = 'JR/JG/2526/4472';
        const targetedMachine = 'B -L1>OM-350-4';

        console.log(`--- DEBUGGING OR: ${targetedOR} on ${targetedMachine} ---`);

        // 1. Get the Plan
        const planRes = await client.query(`
      SELECT plan_id, order_no, mould_code, item_code, item_name, machine
      FROM plan_board 
      WHERE order_no = $1 AND machine = $2
      LIMIT 1
    `, [targetedOR, targetedMachine]);

        if (planRes.rows.length === 0) {
            console.log('No Plan found for this OR + Machine.');
            return;
        }

        const plan = planRes.rows[0];
        console.log('1. Plan Found:', plan);

        // 2. Fetch JC Details for this OR
        const jcRes = await client.query(`
      SELECT data
      FROM jc_details
      WHERE data->>'or_jr_no' = $1
    `, [targetedOR]);

        console.log(`\n2. Found ${jcRes.rows.length} rows in jc_details for this OR.`);

        // 3. Apply the Server Logic (Strict Match + Mould No)
        const term = (plan.item_code || '').trim();
        console.log(`\n3. Match Term: '${term}'\n`);

        const matched = jcRes.rows.filter(r => {
            const d = r.data || {};
            return (
                String(d.item_code || '').trim() === term ||
                String(d.mould_item_code || '').trim() === term ||
                String(d.mold_item_code || '').trim() === term ||
                String(d.our_code || '').trim() === term
            );
        });

        console.log(`   Matches Found via Item Code: ${matched.length}`);

        if (matched.length > 0) {
            console.log('\n--- MATCHED ROWS & MOULD NO ---');
            matched.forEach((r, i) => {
                const d = r.data;
                const rawName = d.mold_item_name || d.mould_item_name || d.item_name || '???';
                console.log(`[${i}] OurCode: ${d.our_code} | MoldItem: ${d.mold_item_code}`);
                console.log(`    Mould No: '${d.mould_no}' | Mould: '${d.mould}'`);
                console.log(`    Name: ${rawName}`);
            });
        }

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

debugSpecificOR();
