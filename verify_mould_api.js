const JMS = {};
JMS.api = {
    post: async (url, body) => {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch('http://localhost:3000/api' + url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        console.log(`POST ${url}`, res.status, data);
        return data;
    },
    put: async (url, body) => {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch('http://localhost:3000/api' + url, {
            method: 'PUT',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        console.log(`PUT ${url}`, res.status, data);
        return data;
    },
    get: async (url) => {
        const fetch = (await import('node-fetch')).default;
        const res = await fetch('http://localhost:3000/api' + url);
        const data = await res.json();
        // console.log(`GET ${url}`, res.status);
        return data;
    }
};

async function run() {
    try {
        const testCode = 'TEST-MOULD-' + Date.now();
        console.log("Creating Mould:", testCode);

        // 1. Create
        const createRes = await JMS.api.post('/moulds', {
            erp_item_code: testCode,
            erp_item_name: 'Test Mould',
            primary_machine: 'Machine A',
            secondary_machine: 'Machine B'
        });

        // 2. Verify
        const list = await JMS.api.get('/masters/moulds');
        const m = list.data.find(x => x.erp_item_code === testCode);
        if (m) {
            console.log("Mould Found:", m.erp_item_code);
            console.log("Primary:", m.primary_machine);
            console.log("Secondary:", m.secondary_machine);

            if (m.primary_machine !== 'Machine A') console.error("FAIL: Primary match");
            if (m.secondary_machine !== 'Machine B') console.error("FAIL: Secondary match");
        } else {
            console.error("FAIL: Mould not found after create");
        }

        // 3. Update
        console.log("Updating Mould...");
        const updateRes = await JMS.api.put('/moulds/' + testCode, {
            erp_item_code: testCode,
            erp_item_name: 'Test Mould Updated',
            primary_machine: 'Machine X',
            secondary_machine: 'Machine Y'
        });

        // 4. Verify Update
        const list2 = await JMS.api.get('/masters/moulds');
        const m2 = list2.data.find(x => x.erp_item_code === testCode);
        if (m2) {
            console.log("Mould Found (Updated):", m2.erp_item_code);
            console.log("Primary:", m2.primary_machine);
            console.log("Secondary:", m2.secondary_machine);

            if (m2.primary_machine !== 'Machine X') console.error("FAIL: Primary update match");
            if (m2.secondary_machine !== 'Machine Y') console.error("FAIL: Secondary update match");
        } else {
            console.error("FAIL: Mould not found after update");
        }

    } catch (e) {
        console.error(e);
    }
}
run();
