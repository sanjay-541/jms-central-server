
const machines = [
    "B -L1>HYD-300-10",
    "B -L1>HYD-300-11",
    "B -L1>HYD-300-6",
    "B -L1>HYD-300-7",
    "B -L1>HYD-300-8",
    "B -L1>HYD-350-1",
    "B -L1>OMEGA - 350-5",
    "B -L2>AKAR -180-10"
];

/* ============================================================
   HELPER: NATURAL SORT (Robust Chunk-Based)
   Splits strings into text/number chunks and compares them.
   Fixes "Line>Machine-1" vs "Line>Machine-10" deterministically.
   ============================================================ */
function naturalCompare(a, b) {
    const ax = [];
    const bx = [];

    String(a).replace(/(\d+)|(\D+)/g, function (_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) });
    String(b).replace(/(\d+)|(\D+)/g, function (_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) });

    while (ax.length && bx.length) {
        const an = ax.shift();
        const bn = bx.shift();
        const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
        if (nn) return nn;
    }

    return ax.length - bx.length;
}

const sorted = [...machines].sort(naturalCompare);

console.log("Sorted Output:");
sorted.forEach(m => console.log(m));

// verification
const index6 = sorted.indexOf("B -L1>HYD-300-6");
const index10 = sorted.indexOf("B -L1>HYD-300-10");

if (index6 < index10) {
    console.log("SUCCESS: 6 comes before 10");
} else {
    console.log("FAILURE: 10 comes before 6");
}
