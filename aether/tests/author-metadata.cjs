const assert = require('node:assert/strict');
const fs = require('node:fs');
const packageData = JSON.parse(fs.readFileSync('package.json', 'utf8'));
assert.match(packageData.author, /Khalil Mohammad Khalil/);
assert.match(packageData.author, /khalilmkhalil0937@gmail\.com/);
assert.match(packageData.build.copyright, /Copyright/);
assert.match(packageData.build.copyright, /2026/);
console.log('PASS author metadata');
