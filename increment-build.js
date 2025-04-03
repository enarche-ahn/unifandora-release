const fs = require('fs');
const path = require('path');

function incrementBuildNumber() {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    packageJson.buildNumber++;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Build number incremented to ${packageJson.buildNumber}`);
}

incrementBuildNumber();