const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    try {
        await client.connect();
        const machine = 'B -L1>HYD-350-2';

        console.log(`Checking ALL Plans for: ${machine}`);

        const plans = await client.query(`
            SELECT id, plan_id, mould_name, status 
            FROM plan_board 
            WHERE machine = $1
            ORDER BY id DESC
        `, [machine]);

        plans.rows.forEach(p => {
            console.log(`[${p.status}] ID: ${p.id} | PlanID: ${p.plan_id} | Mould: '${p.mould_name}'`);
        });

        const active = plans.rows.find(p => p.status === 'Running');
        if (!active) {
            console.log('No RUNNING plan.');
            return;
        }

        console.log(`\n--- Simulating /api/std-actual/status for PlanID: ${active.plan_id} ---`);

        const qry = `
            SELECT m.std_wt_kg as article_std, m.product_name, m.id as mould_id
            FROM plan_board pb
            LEFT JOIN moulds m ON m.product_name = pb.mould_name
            WHERE pb.plan_id=$1
        `;
        const res = await client.query(qry, [active.plan_id]);

        if (res.rows.length === 0) {
            console.log('Query returned NO ROWS.');
        } else {
            console.log('Rows returned:', res.rows);
            if (!res.rows[0].article_std) console.log('WARNING: article_std is NULL/Empty!');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
