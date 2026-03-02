const API_URL = 'http://localhost:3000/api';

async function testMasterPlanAPI() {
    try {
        console.log('Testing GET /api/planning/board...');
        const res = await fetch(`${API_URL}/planning/board`);
        const data = await res.json();

        if (data.ok) {
            const plans = data.data.plans;
            console.log(`Retrieved ${plans.length} plans.`);

            // Check for missing mouldNo
            let missingCount = 0;
            const sample = [];

            plans.forEach(p => {
                if (!p.mouldNo || p.mouldNo === '-' || p.mouldNo === 'Unknown') {
                    if (missingCount === 0) {
                        console.log('First missing entry full object keys:', Object.keys(p));
                        console.log('First missing entry full object:', JSON.stringify(p, null, 2));
                    }
                    missingCount++;
                    if (sample.length < 5) sample.push({
                        orderNo: p.orderNo,
                        mouldName: p.mouldName,
                        planId: p.planId
                    });
                }
            });

            console.log(`Plans with missing Mould No: ${missingCount}`);
            if (missingCount > 0) {
                console.log('Sample of missing entries:', JSON.stringify(sample, null, 2));
            } else {
                console.log('All plans have Mould No.');
            }

        } else {
            console.error('API Error:', data.error);
        }
    } catch (error) {
        console.error('Fetch Error:', error.message);
    }
}

testMasterPlanAPI();
