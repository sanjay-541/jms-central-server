
const http = require('http');
const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    console.log("--- 1. Checking DB Column ---");
    await client.connect();
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'plan_board' AND column_name = 'job_card_given'
    `);
    if (res.rows.length) {
        console.table(res.rows);
    } else {
        console.error("CRITICAL: Column 'job_card_given' does NOT exist!");
    }

    // Get a valid plan ID for testing
    const planRes = await client.query('SELECT id FROM plan_board LIMIT 1');
    const testId = planRes.rows[0]?.id;
    await client.end();

    if (!testId) {
        console.log("No plans found to test API.");
        return;
    }

    console.log(`--- 2. Testing API with Plan ID: ${testId} ---`);

    const payload = JSON.stringify({
        planId: testId,
        status: true
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/planning/update-jc-status',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log('BODY:', data);
        });
    });

    req.on('error', (e) => {
        console.error(`PROBLEM: ${e.message}`);
        if (e.message.includes('ECONNREFUSED')) {
            console.log("SUGGESTION: Server is not running.");
        }
    });

    req.write(payload);
    req.end();
}

run().catch(e => console.error(e));
