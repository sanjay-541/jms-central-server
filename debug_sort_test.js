
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

    console.log("--- Testing Sort Order for JR/JG/2526/4613 ---");
    // Simulate the proposed query
    const res = await client.query(`
        SELECT job_card_no, is_closed, jr_close, created_date, id
        FROM or_jr_report 
        WHERE TRIM(or_jr_no) = TRIM('JR/JG/2526/4613')
        ORDER BY 
           (CASE WHEN job_card_no IS NOT NULL AND TRIM(job_card_no) != '' THEN 0 ELSE 1 END) ASC, -- Prioritize non-empty JC
           is_closed ASC, -- Prioritize Not Closed (Active)
           created_date DESC -- Prioritize Newest
        LIMIT 1
    `);
    console.table(res.rows);

    await client.end();
}

run().catch(e => console.error(e));
