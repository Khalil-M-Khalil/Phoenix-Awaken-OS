const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const archiver = require('archiver');

async function makeArchive(inputs, outputPath) {
  const output = fsSync.createWriteStream(outputPath);
  const archive = archiver('zip', { zlib: { level: 0 } });
  archive.pipe(output);
  for (const input of inputs) {
    const stat = await fs.lstat(input);
    if (stat.isDirectory()) archive.directory(input, path.basename(input));
    else archive.file(input, { name: path.basename(input) });
  }
  await archive.finalize();
  await new Promise((resolve, reject) => {
    output.once('close', resolve);
    output.once('error', reject);
    archive.once('error', reject);
  });
}

(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'phoenix-aether-bundle-test-'));
  const folder = path.join(root, 'evidence');
  await fs.mkdir(path.join(folder, 'nested'), { recursive: true });
  await fs.writeFile(path.join(folder, 'manifest.txt'), 'Phoenix Aether bundle test');
  await fs.writeFile(path.join(folder, 'nested', 'binary.bin'), Buffer.from([0, 1, 2, 3, 254, 255]));
  const second = path.join(root, 'manifest.txt');
  await fs.writeFile(second, 'second selected file');
  const archivePath = path.join(root, 'payload.zip');
  await makeArchive([folder, second], archivePath);
  const listingCommand = process.platform === 'win32' ? 'tar' : 'unzip';
  const listingArgs = process.platform === 'win32' ? ['-tf', archivePath] : ['-Z1', archivePath];
  const listing = execFileSync(listingCommand, listingArgs, { encoding: 'utf8' }).trim().split(/\r?\n/);
  assert(listing.includes('evidence/manifest.txt'));
  assert(listing.includes('evidence/nested/binary.bin'));
  assert(listing.includes('manifest.txt'));
  const verifyCommand = process.platform === 'win32' ? 'tar' : 'unzip';
  const verifyArgs = process.platform === 'win32' ? ['-tf', archivePath] : ['-t', archivePath];
  execFileSync(verifyCommand, verifyArgs, { stdio: 'ignore' });
  console.log(`PASS bundle archive: ${listing.length} entries, ZIP integrity verified`);
  await fs.rm(root, { recursive: true, force: true });
})().catch((error) => { console.error(error); process.exitCode = 1; });
