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

        console.log('--- Table: mould_planning_summary ---');
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'mould_planning_summary';
        `);
        res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

        console.log('\n--- Sample Data for failing machine ---');
        // Try to match by mould_name
        const planRes = await client.query(`
            SELECT mould_name FROM plan_board WHERE machine = 'B -L1>HYD-350-2' AND status='Running'
        `);
        if (planRes.rows.length) {
            const mName = planRes.rows[0].mould_name;
            console.log(`Searching MPS for mould_name: '${mName}'`);
            const mpsRes = await client.query(`SELECT * FROM mould_planning_summary WHERE mould_name = $1`, [mName]);
            if (mpsRes.rows.length) console.log('MPS Found:', mpsRes.rows[0]);
            else console.log('MPS NOT Found by name.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
