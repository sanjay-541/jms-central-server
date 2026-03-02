
const fs = require('fs');
const content = fs.readFileSync('c:/Users/Admin/Downloads/JMS/BACKEND/server.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.includes('app.post') && line.includes('/planning/run')) {
        console.log(`Found planning/run at line ${index + 1}: ${line.trim()}`);
    }
    if (line.includes('app.post') && (line.includes("'/run'") || line.includes('"/run"'))) {
        console.log(`Found /run at line ${index + 1}: ${line.trim()}`);
    }
});
