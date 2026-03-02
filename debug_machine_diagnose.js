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
        console.log(`Diagnosing Machine: ${machine}`);

        // fetch plan and join
        const sql = `
            SELECT 
                pb.plan_id, pb.status, pb.mould_name,
                m.product_name as "MouldMasterName",
                m.std_wt_kg, m.runner_weight, m.no_of_cav, m.cycle_time, m.pcs_per_hour, m.manpower,
                m.std_volume_capacity,
                length(pb.mould_name) as "PlanMouldLen",
                length(m.product_name) as "MasterMouldLen"
            FROM plan_board pb
            LEFT JOIN moulds m ON m.product_name = pb.mould_name
            WHERE pb.machine = $1 AND pb.status = 'Running'
        `;

        const res = await client.query(sql, [machine]);
        if (res.rows.length === 0) {
            console.log('No Running Plan found. Checking Planned...');
            // Check planned
            const res2 = await client.query(`SELECT status, mould_name FROM plan_board WHERE machine=$1 AND status='Planned' LIMIT 1`, [machine]);
            console.log('Planned:', res2.rows);
        } else {
            const row = res.rows[0];
            console.log('Running Plan Details:');
            console.log(JSON.stringify(row, null, 2));

            if (!row.MouldMasterName) {
                console.log('!!! JOIN FAILED. MouldMasterName is NULL !!!');
                console.log(`Plan Mould Name: "${row.mould_name}" (Len: ${row.PlanMouldLen})`);
            } else {
                console.log('Join Success.');
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
