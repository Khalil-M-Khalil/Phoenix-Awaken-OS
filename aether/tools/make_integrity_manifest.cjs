const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const files = [
  'main.cjs',
  'preload.cjs',
  'renderer/index.html',
  'renderer/app.js',
  'renderer/styles.css'
];
const hashes = {};
for (const relative of files) {
  const absolute = path.join(root, relative);
  const data = fs.readFileSync(absolute);
  hashes[relative] = crypto.createHash('sha256').update(data).digest('hex');
}
const manifest = {
  schema: 1,
  product: 'Phoenix Aether',
  release: '0.1.0',
  owner: 'Khalil Mohammad Khalil',
  generatedAt: new Date().toISOString(),
  files: hashes
};
fs.writeFileSync(path.join(root, 'assets', 'security-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote integrity manifest for ${files.length} files.`);
