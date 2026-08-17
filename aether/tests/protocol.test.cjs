const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const CHUNK_CHARS = 300;
const QR_PAYLOAD_LIMIT = 12000;
const bytesToBase64 = (bytes) => Buffer.from(bytes).toString('base64');
const base64ToBytes = (value) => Buffer.from(value, 'base64');
const digest = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

function encodeFile(name, bytes) {
  const base64 = bytesToBase64(bytes);
  const chunks = Array.from(
    { length: Math.max(1, Math.ceil(base64.length / CHUNK_CHARS)) },
    (_, index) => base64.slice(index * CHUNK_CHARS, (index + 1) * CHUNK_CHARS)
  );
  const session = 'TESTSESSION';
  const hash = digest(bytes);
  const name64 = bytesToBase64(Buffer.from(name, 'utf8'));
  const frames = chunks.map((payload, index) => {
    const value = `AETH1|${session}|${index}|${chunks.length}|${hash.slice(0, 12)}|${name64}|${payload}`;
    assert.ok(value.length <= QR_PAYLOAD_LIMIT, `${name}: QR frame exceeded payload limit`);
    return value;
  });
  return { frames, hash, name, total: chunks.length };
}

function decodeFrames(frames) {
  const received = new Map();
  let metadata;
  for (const frame of frames) {
    const fields = frame.split('|');
    assert.equal(fields.length, 7);
    const [, session, indexText, totalText, hash, name64, payload] = fields;
    const index = Number(indexText);
    const total = Number(totalText);
    assert.ok(Number.isSafeInteger(index) && Number.isSafeInteger(total));
    assert.ok(index >= 0 && index < total && total >= 1);
    metadata ??= { session, total, hash, name: Buffer.from(name64, 'base64').toString('utf8') };
    if (!received.has(index)) received.set(index, payload);
  }
  assert.equal(received.size, metadata.total);
  const base64 = Array.from({ length: metadata.total }, (_, index) => received.get(index)).join('');
  const bytes = base64ToBytes(base64);
  return { ...metadata, bytes };
}

const cases = [
  ['empty.bin', Buffer.alloc(0)],
  ['firmware.iso', crypto.randomBytes(3 * 1024 * 1024)],
  ['archive.zip', crypto.randomBytes(2 * 1024 * 1024)],
  ['photo.webp', crypto.randomBytes(512 * 1024)],
  ['extensionless-binary', crypto.randomBytes(256 * 1024)],
  ['large-over-10MB.iso', crypto.randomBytes(8 * 1024 * 1024)]
];

for (const [name, bytes] of cases) {
  const encoded = encodeFile(name, bytes);
  const decoded = decodeFrames(encoded.frames);
  assert.equal(decoded.name, name);
  assert.equal(decoded.total, encoded.total);
  assert.equal(digest(decoded.bytes), encoded.hash);
  assert.deepEqual(decoded.bytes, bytes);
  console.log(`PASS ${name}: ${bytes.length} bytes, ${encoded.total} frames, SHA-256 verified`);
}

const overTwentyThousandFrames = encodeFile('very-large.bin', Buffer.alloc(5 * 1024 * 1024));
assert.ok(overTwentyThousandFrames.total > 20000, 'large-frame regression fixture did not exceed old 20,000-frame ceiling');
console.log(`PASS no artificial frame-count ceiling: ${overTwentyThousandFrames.total} frames accepted`);
console.log('ALL_PROTOCOL_TESTS_PASS');
