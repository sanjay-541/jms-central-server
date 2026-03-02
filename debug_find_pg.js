const fs = require('fs');
const path = require('path');

const possiblePaths = [
    'C:\\Program Files\\PostgreSQL\\17\\bin',
    'C:\\Program Files\\PostgreSQL\\16\\bin',
    'C:\\Program Files\\PostgreSQL\\15\\bin',
    'C:\\Program Files\\PostgreSQL\\14\\bin',
    'C:\\Program Files\\PostgreSQL\\13\\bin',
    'C:\\Program Files\\PostgreSQL\\12\\bin',
    'C:\\Program Files\\PostgreSQL\\11\\bin',
    'C:\\Program Files (x86)\\PostgreSQL\\16\\bin', // Less likely but possible
];

console.log("Searching for PostgreSQL binaries...");

let found = null;

for (const p of possiblePaths) {
    const dumpPath = path.join(p, 'pg_dump.exe');
    try {
        if (fs.existsSync(dumpPath)) {
            console.log(`FOUND: ${p}`);
            found = p;
            break;
        }
    } catch (e) {
        // Ignore permission errors
    }
}

if (!found) {
    console.log("NOT FOUND in standard locations.");
}
