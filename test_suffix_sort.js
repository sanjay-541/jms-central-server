
const machines = [
    "B -L1>HYD-300-10",
    "B -L1>HYD-300-11",
    "B -L1>HYD-300-6",
    "B -L1>HYD-300-7",
    "B -L1>HYD-300-8",
    "B -L1>HYD-350-1",
    "B -L1>HYD-350-2",
    "B -L1>OMEGA - 350-5",
    "B -L2>AKAR -180-10",
    "B -L2>AKAR -180-1"
];

// Helper: Extract Line and Suffix for "Series Sort"
function getMachineSeries(m) {
    const parts = m.split('>');
    const line = parts.length > 1 ? parts[0] : '';
    const rest = parts.length > 1 ? parts[1] : parts[0];

    // Find last number
    const match = rest.match(/(\d+)$/);
    const index = match ? parseInt(match[1], 10) : 999999;

    return { line, index, full: m };
}

function machineSort(a, b) {
    const A = getMachineSeries(String(a));
    const B = getMachineSeries(String(b));

    // 1. Compare Line (String)
    const lineCmp = A.line.localeCompare(B.line);
    if (lineCmp !== 0) return lineCmp;

    // 2. Compare Index (Number)
    const idxCmp = A.index - B.index;
    if (idxCmp !== 0) return idxCmp;

    // 3. Fallback to full string
    return A.full.localeCompare(B.full);
}

console.log("--- BEFORE SORT ---");
console.log(machines);

const sorted = [...machines].sort(machineSort);

console.log("\n--- AFTER SORT (Suffix Priority) ---");
sorted.forEach(m => console.log(m));

// Verification
const idx1 = sorted.indexOf("B -L1>HYD-350-1");
const idx6 = sorted.indexOf("B -L1>HYD-300-6");

if (idx1 < idx6) {
    console.log("\nSUCCESS: Machine 1 (350-1) comes before Machine 6 (300-6)");
} else {
    console.log("\nFAILURE: Machine 6 is still before Machine 1");
}
