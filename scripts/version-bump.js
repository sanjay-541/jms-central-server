const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const versionFile = path.join(__dirname, '../VERSION.json');
const data = JSON.parse(fs.readFileSync(versionFile, 'utf8'));

const parts = data.version.split('.');
parts[2] = parseInt(parts[2]) + 1;
data.version = parts.join('.');
data.lastUpdated = new Date().toISOString();

fs.writeFileSync(versionFile, JSON.stringify(data, null, 2));

console.log('Version bumped to ' + data.version);

try {
    execSync('C:\\mingit\\cmd\\git add VERSION.json');
    execSync(`C:\\mingit\\cmd\\git commit -m "chore: bump version to ${data.version}"`);
    console.log('Version bump committed successfully.');
} catch (error) {
    console.error('Failed to commit version bump:', error.message);
}
