const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const CHUNK_BYTES = 225;

async function streamDigest(handle, size) {
  const hash = crypto.createHash('sha256');
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let position = 0;
  while (position < size) {
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, position);
    assert.ok(bytesRead > 0);
    hash.update(buffer.subarray(0, bytesRead));
    position += bytesRead;
  }
  return hash.digest('hex');
}

async function transferByChunks(filePath) {
  const source = await fs.readFile(filePath);
  const handle = await fs.open(filePath, 'r');
  try {
    const stat = await handle.stat();
    const hash = await streamDigest(handle, stat.size);
    const total = Math.max(1, Math.ceil(stat.size / CHUNK_BYTES));
    const chunks = [];
    for (let index = 0; index < total; index += 1) {
      const position = index * CHUNK_BYTES;
      const length = Math.min(CHUNK_BYTES, Math.max(0, stat.size - position));
      const buffer = Buffer.alloc(length);
      if (length) {
        const { bytesRead } = await handle.read(buffer, 0, length, position);
        assert.equal(bytesRead, length);
      }
      chunks.push(buffer.toString('base64'));
    }
    const reconstructed = Buffer.from(chunks.join(''), 'base64');
    assert.deepEqual(reconstructed, source);
    assert.equal(crypto.createHash('sha256').update(reconstructed).digest('hex'), hash);
    return { bytes: stat.size, total, hash };
  } finally {
    await handle.close();
  }
}

(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'phoenix-aether-stream-'));
  const cases = [
    ['empty.iso', Buffer.alloc(0)],
    ['small.bin', crypto.randomBytes(8192)],
    ['large.iso', crypto.randomBytes(8 * 1024 * 1024)]
  ];
  try {
    for (const [name, bytes] of cases) {
      const filePath = path.join(dir, name);
      await fs.writeFile(filePath, bytes);
      const result = await transferByChunks(filePath);
      console.log(`PASS ${name}: ${result.bytes} bytes, ${result.total} streamed chunks, SHA-256 verified`);
    }
    console.log('ALL_STREAMING_TESTS_PASS');
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
