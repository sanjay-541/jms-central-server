
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/planning/board?plant=DUNGRA',
    method: 'GET',
};

console.log("--- Checking Active Server Version ---");

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (!json.data || !json.data.plans || !json.data.plans.length) {
                console.log("WARN: No plans returned to check.");
                return;
            }
            const firstPlan = json.data.plans[0];
            console.log("Sample Plan Keys:", Object.keys(firstPlan));

            if ('job_card_given' in firstPlan) {
                console.log("SUCCESS: 'job_card_given' field FOUND in response.");
                console.log("Server is running NEW CODE.");
            } else {
                console.error("FAILURE: 'job_card_given' field MISSING in response.");
                console.error("Server is running OLD CODE.");
            }
        } catch (e) {
            console.error("Error parsing response:", e.message);
            console.log("Raw Body:", data.substring(0, 500));
        }
    });
});

req.on('error', (e) => {
    console.error(`Request Problem: ${e.message}`);
});

req.end();
