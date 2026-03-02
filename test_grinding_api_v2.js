const API_URL = 'http://localhost:3000/api';

async function testGrindingAPI() {
    try {
        console.log('1. Testing GET /api/grinding/jobs...');
        const resJobs = await fetch(`${API_URL}/grinding/jobs`);
        const dataJobs = await resJobs.json();

        if (dataJobs.ok) {
            console.log(`PASS: Retrieved ${dataJobs.data.length} jobs.`);
        } else {
            console.error('FAIL: GET /api/grinding/jobs failed:', dataJobs.error);
        }

        console.log('\n2. Testing POST /api/grinding/entry...');
        const payload = {
            planId: null, // Optional
            orderNo: 'TEST_ORDER_999',
            jobCardNo: 'JC_TEST_999',
            weight: 1.5,
            qty: 10,
            reason: 'Test Rejection',
            user: 'TestScript'
        };

        const resEntry = await fetch(`${API_URL}/grinding/entry`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const dataEntry = await resEntry.json();

        if (dataEntry.ok) {
            console.log('PASS: Grinding entry saved successfully.');
        } else {
            console.error('FAIL: POST /api/grinding/entry failed:', dataEntry.error);
        }

    } catch (error) {
        console.error('ERROR during test:', error.message);
    }
}

testGrindingAPI();
