const http = require('http');

function request(path, method, data) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (data) options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => resolve(JSON.parse(body)));
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function verify() {
    try {
        console.log('--- Verifying Scanning Feature ---');

        // 0. Create dummy plans (Collision for Table B1)
        console.log('Creating duplicate plans for Table B1...');
        const r1 = await request('/api/assembly/plan', 'POST', {
            table_id: 'Table B1',
            machine: 'TestMachine',
            item_name: 'TestItem_EAN_1',
            plan_qty: 100,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 3600000).toISOString(),
            duration_min: 60, delay_min: 0, status: 'PLANNED', created_by: 'TestScript',
            ean_number: '1111111111111'
        });
        console.log('Plan 1 Creation:', r1);

        const r2 = await request('/api/assembly/plan', 'POST', {
            table_id: 'Table B1',
            machine: 'TestMachine',
            item_name: 'TestItem_EAN_2',
            plan_qty: 200,
            start_time: new Date(Date.now() + 7200000).toISOString(),
            end_time: new Date(Date.now() + 10800000).toISOString(),
            duration_min: 60, delay_min: 0, status: 'PLANNED', created_by: 'TestScript',
            ean_number: '2222222222222'
        });
        console.log('Plan 2 Creation:', r2);

        // 1. Get Active Plans
        const active = await request('/api/assembly/active', 'GET');
        // console.log('API Response:', JSON.stringify(active, null, 2));

        if (!active || !active.data || !active.data.length) {
            console.error('No active plans found.');
            return;
        }

        // Verify Multiple Plans for Table B1
        const b1Plans = active.data.filter(p => p.table_id === 'Table B1');
        console.log(`Table B1 has ${b1Plans.length} active plans.`);
        if (b1Plans.length >= 2) {
            console.log('SUCCESS: Backend returns multiple plans for same table.');
        } else {
            console.error('FAILURE: Backend returned single/distinct plan despite duplicates.');
        }

        // Use the first plan
        const plan = b1Plans[0];
        console.log(`Testing with Plan ID: ${plan.id}, EAN: ${plan.ean_number}`);

        // 2. Test valid scan
        const validScan = await request('/api/assembly/scan', 'POST', {
            plan_id: plan.id,
            ean: plan.ean_number
        });

        if (validScan.ok && validScan.match) {
            console.log('SUCCESS: Valid scan accepted.');
        } else {
            console.error('FAILURE: Valid scan failed.');
        }

        // 3. Test invalid scan
        const invalidScan = await request('/api/assembly/scan', 'POST', {
            plan_id: plan.id,
            ean: '9999999999999'
        });

        if (invalidScan.ok && !invalidScan.match) {
            console.log('SUCCESS: Invalid scan rejected.');
        } else {
            console.error('FAILURE: Invalid scan behavior incorrect.');
        }

    } catch (e) {
        console.error('Verification Error:', e);
    }
}

verify();
