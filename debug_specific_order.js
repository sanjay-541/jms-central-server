
const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    await client.connect();

    console.log("--- Checking or_jr_report for JR/JG/2526/4613 ---");
    const res = await client.query(`
        SELECT or_jr_no, job_card_no, jr_close, plan_date, mld_status 
        FROM or_jr_report 
        WHERE or_jr_no = 'JR/JG/2526/4613'
    `);
    console.table(res.rows);

    console.log("--- Checking orders table ---");
    const resOrd = await client.query(`SELECT * FROM orders WHERE order_no = 'JR/JG/2526/4613'`);
    console.table(resOrd.rows);

    await client.end();
}

run().catch(e => console.error(e));
