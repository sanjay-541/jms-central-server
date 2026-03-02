
const http = require('http');

// Payload
const payload = JSON.stringify({
    planId: 152, // From previous debug
    status: true
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/planning/set-jc',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

console.log(`--- POST request to ${options.path} ---`);

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('BODY:', data);
        if (res.statusCode === 200) {
            console.log("SUCCESS: Endpoint is working.");
        } else {
            console.log("FAILURE: Endpoint returned error.");
        }
    });
});

req.on('error', (e) => {
    console.error(`PROBLEM: ${e.message}`);
});

req.write(payload);
req.end();
