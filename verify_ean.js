const http = require('http');

function postRequest(path, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 3000, // Assuming default port, checking server.js might reveal port. Usually 3000 or 5000. I'll try 3000 first or check process.env.
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

function getRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function test() {
    try {
        console.log('Testing Assembly Plan API with EAN Number...');

        // 1. Create a Plan with EAN
        const testPlan = {
            table_id: 'Table B1',
            item_name: 'TestItem_EAN',
            plan_qty: 100,
            machine: 'TestMachine',
            start_time: '2026-01-22T10:00:00',
            duration_min: 60,
            delay_min: 0,
            end_time: '2026-01-22T11:00:00',
            ean_number: '1234567890123',
            created_by: 'TestScript'
        };

        const createRes = await postRequest('/api/assembly/plan', testPlan);
        console.log('Create Response:', createRes);

        // 2. Fetch Grid to verify
        const gridRes = await getRequest('/api/assembly/grid'); // Fetch all to avoid date mismatch issues

        const foundPlan = gridRes.data.find(p => p.item_name === 'TestItem_EAN');

        if (foundPlan) {
            console.log('Found Plan:', foundPlan);
            if (foundPlan.ean_number === '1234567890123') {
                console.log('SUCCESS: EAN matches.');
            } else {
                console.error('FAILURE: EAN mismatch. Expected 1234567890123, got', foundPlan.ean_number);
            }
        } else {
            console.error('FAILURE: Could not find ANY plan with item_name=TestItem_EAN');
            console.log('Total Plans:', gridRes.data.length);
        }

    } catch (e) {
        console.error('Test Error:', e);
    }
}

test();
