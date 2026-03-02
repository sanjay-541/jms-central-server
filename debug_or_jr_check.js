const isDiff = (a, b) => {
    // Treat null/undefined/empty string as equivalent ''
    const va = (a === null || a === undefined) ? '' : String(a).trim();
    const vb = (b === null || b === undefined) ? '' : String(b).trim();
    return va !== vb;
};

const checks = [
    { name: "Exact Match", db: { a: "1", b: "test" }, row: { a: "1", b: "test" }, expected: false },
    { name: "Diff Value", db: { a: "1" }, row: { a: "2" }, expected: true },
    { name: "Null vs Empty", db: { a: null }, row: { a: "" }, expected: false },
    { name: "Undefined vs Mismatch", db: { a: undefined }, row: { a: "val" }, expected: true },
    { name: "JC No Change", db: { job_card_no: "JC1" }, row: { job_card_no: "JC2" }, expected: true },
    { name: "Date Change", db: { plan_date: "2023-01-01" }, row: { plan_date: "2023-01-02" }, expected: true },
    { name: "Whitespace", db: { a: " abc " }, row: { a: "abc" }, expected: false }
];

console.log("Running logic checks...");
checks.forEach(c => {
    let result = false;
    // Simulate the big OR condition by iterating keys
    const keys = Object.keys({ ...c.db, ...c.row });
    for (const k of keys) {
        if (isDiff(c.db[k], c.row[k])) {
            result = true;
            break;
        }
    }
    const pass = result === c.expected;
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${c.name}: Expected ${c.expected}, Got ${result}`);
});
