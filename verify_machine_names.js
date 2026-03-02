const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'jpsms',
    password: 'Sanjay@541##',
    port: 5432,
});

async function run() {
    await client.connect();

    console.log("--- Fetching Machine Names ---");
    const res = await client.query("SELECT machine FROM machines WHERE is_active = true");

    const names = res.rows.map(r => r.machine);
    console.log("Raw Names:", JSON.stringify(names, null, 2));

    console.log("\n--- Testing Sort Logic (Standard) ---");
    const sorted = [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    // console.log("Sorted Names:", JSON.stringify(sorted, null, 2));

    console.log("\n--- Testing Index Sort Logic (Suffix) ---");
    const extractIndex = (str) => {
        const match = str.match(/-(\d+)$/);
        return match ? parseInt(match[1]) : 999999;
    };

    // Filter for C -L3 and C -L4 for clearer demo
    const demo = names.filter(n => n.includes('C -L3') || n.includes('C -L4'));

    const indexSorted = [...demo].sort((a, b) => {
        const idxA = extractIndex(a);
        const idxB = extractIndex(b);
        if (idxA !== idxB) return idxA - idxB;
        return a.localeCompare(b, undefined, { numeric: true });
    });
    console.log("Suffix Sorted (Sample):", JSON.stringify(indexSorted, null, 2));

    await client.end();
}

run().catch(e => console.error(e));
