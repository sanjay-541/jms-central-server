const fetch = require('node-fetch');

async function testUniqueScan() {
    const API_URL = 'http://localhost:3000/api/assembly/scan';

    // 1. First, get an active plan ID (or just use a known valid one if possible)
    // For simulation, let's assume we have a plan. 
    // We'll insert a dummy plan first to be safe? Or just query active.
    // Let's rely on the user having a plan open, OR we can just try to scan against a non-existent plan and see if the PARSING works (it should fail on "Plan not found" but we can check if it parsed the EAN).
    // Actually, looking at server.js:
    // const { plan_id, ean } = req.body;
    // ... split ean-unique ...
    // const plans = await q('SELECT * FROM assembly_plans WHERE id = $1', [plan_id]);

    // We need a valid plan_id to get past the first check.
    // Let's create a dummy plan directly in DB? No, too invasive.
    // Let's just try to hit the endpoint with a dummy plan_id and see the error. 
    // If the error is "Plan not found", we know the server is running.
    // Ideally we want to verify the EAN parsing.

    // Let's use a known EAN-UNIQUE format.
    const uniquePayload = {
        plan_id: 'TEST_PLAN_ID',
        ean: '8901234567890-123456' // EAN-UNIQUE
    };

    console.log("Sending Payload:", uniquePayload);

    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uniquePayload)
        });
        const json = await res.json();
        console.log("Response:", json);

        // If logic works, server should try to find plan. 
        // We can't easily verify the split without logs or a valid plan match.
        // But if we get a response, the server is up.
    } catch (e) {
        console.error("Error:", e);
    }
}

testUniqueScan();
