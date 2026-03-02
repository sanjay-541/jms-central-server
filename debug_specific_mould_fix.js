const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function checkData() {
    await client.connect();

    // Replace with an Order No found in the debug output
    const orderNo = 'JR/JG/2526/5120';

    console.log(`Checking data for Order: ${orderNo}`);

    const resMPS = await client.query(`SELECT * FROM mould_planning_summary WHERE or_jr_no = $1`, [orderNo]);
    console.log('MPS Entries:', resMPS.rows);

    const resPlan = await client.query(`SELECT * FROM plan_board WHERE order_no = $1`, [orderNo]);
    console.log('Plan Entries:', resPlan.rows.map(r => ({ id: r.id, mould_name: r.mould_name })));

    const resOJR = await client.query(`SELECT * FROM or_jr_report WHERE or_jr_no = $1`, [orderNo]);
    console.log('OR-JR Report Entries:', resOJR.rows);

    await client.end();
}

checkData().catch(e => console.error(e));
