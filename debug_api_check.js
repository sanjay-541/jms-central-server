const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/orders/pending',
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (Array.isArray(json)) {
                const target = json.find(o => o.order_no === 'JR/JG/2526/3971');
                if (target) {
                    console.log('✅ FOUND in API Response:', target.order_no, target.status, target.mld_status);
                } else {
                    console.log('❌ NOT FOUND in API Response. Total items:', json.length);
                    // Log some items to see what is returning
                    if (json.length > 0) console.log('Sample:', json[0].order_no);
                }
            } else {
                console.log('❌ Response is not an array:', json);
            }
        } catch (e) {
            console.log('Error parsing JSON:', e.message);
            console.log('Raw Data:', data.substring(0, 200));
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
