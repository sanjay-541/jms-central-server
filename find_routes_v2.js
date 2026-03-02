const fs = require('fs');
const content = fs.readFileSync('c:/Users/Admin/Downloads/JMS/BACKEND/server.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.includes('app.post') || line.includes('app.get')) {
        if (line.includes('upload') || line.includes('or_jr') || line.includes('report') || line.includes('excel')) {
            console.log(`Line ${index + 1}: ${line.trim()}`);
        }
    }
});
