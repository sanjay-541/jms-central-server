
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

    console.log("--- Columns in or_jr_report ---");
    const cols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'or_jr_report'
    `);
    console.table(cols.rows);

    console.log("--- Content for JR/JG/2526/4613 ---");
    // Select all potential status columns
    const rows = await client.query(`
        SELECT or_jr_no, job_card_no, jr_close, is_closed, created_date, id 
        FROM or_jr_report 
        WHERE or_jr_no = 'JR/JG/2526/4613'
        ORDER BY created_date DESC
    `);
    console.table(rows.rows);

    await client.end();
}

run().catch(e => console.error(e));
