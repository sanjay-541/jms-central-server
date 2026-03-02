
const syncService = require('./services/sync.service');

// We can't access non-exported vars, but we can inspect the file or just rely on my read.
// Actually, let's try to "mock" the checking logic if possible, or just rely on the read.
// The file view showed it clearly.

console.log('SYNC_ALL includes plan_board?');
const fs = require('fs');
const content = fs.readFileSync('./services/sync.service.js', 'utf8');
if (content.includes("'plan_board'")) {
    console.log('YES, plan_board is in the source code.');
} else {
    console.log('NO, plan_board is MISSING.');
}
