
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const zip = new AdmZip();
const outputFile = 'update_package_v3.zip';

console.log('Creating lightweight update package...');

const files = fs.readdirSync(__dirname);

files.forEach(file => {
    // 1. Exclude Explicit Names
    if (['node_modules', '.git', '.env', 'uploads', 'backups', 'BACKUPS', 'update_package_v2.zip', 'update_package_v3.zip'].includes(file)) {
        console.log(`Skipping Object: ${file}`);
        return;
    }

    // 2. Exclude Extensions (Large Files)
    if (file.endsWith('.zip') || file.endsWith('.tar.gz') || file.endsWith('.sql') || file.endsWith('.log') || file.endsWith('.iso')) {
        console.log(`Skipping Large File: ${file}`);
        return;
    }

    const filePath = path.join(__dirname, file);
    try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            zip.addLocalFolder(filePath, file);
        } else {
            zip.addLocalFile(filePath);
        }
    } catch (e) {
        console.log(`Error reading ${file}: ${e.message}`);
    }
});

zip.writeZip(outputFile);
console.log(`\n[SUCCESS] Created ${outputFile}`);
console.log('UPLOAD this file to your Main Server folder.');
console.log('Then unzip it and restart the server.');
