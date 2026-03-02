
const http = require('http');

const payload = JSON.stringify({
    erp_item_code: '0012-B',
    manpower: 5, // Changing from 3 to 5
    _user: 'ApiTester'
});

const options = {
    hostname: 'localhost',
    port: 3000, // Assuming port 3000, verify if different
    path: '/api/moulds/0012-B',
    method: 'PUT',
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
    console.error(`problem with request: ${e.message}`);
});

req.write(payload);
req.end();
