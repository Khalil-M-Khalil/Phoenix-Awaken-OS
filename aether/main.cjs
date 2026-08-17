const { app, BrowserWindow, dialog, ipcMain, session, shell } = require('electron');
const QRCode = require('qrcode');
const archiver = require('archiver');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const CHUNK_BYTES = 225;
const fileSessions = new Map();
let localServer;
let localPort = 0;

const capsuleRoot = () => path.join(app.getPath('documents'), 'Phoenix Awaken OS', 'Evidence Capsules');
const safeCapsuleName = (value) => String(value || 'capsule').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim() || 'capsule';
const capsuleNow = () => new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

async function ensureCapsuleRoot() {
  const root = capsuleRoot();
  await fs.mkdir(root, { recursive: true });
  return root;
}

async function hashFilePath(filePath) {
  const handle = await require('node:fs').promises.open(filePath, 'r');
  try {
    const digest = crypto.createHash('sha256');
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    let position = 0;
    const stat = await handle.stat();
    while (position < stat.size) {
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, position);
      if (!bytesRead) break;
      digest.update(buffer.subarray(0, bytesRead));
      position += bytesRead;
    }
    return { sha256: digest.digest('hex'), sizeBytes: stat.size };
  } finally {
    await handle.close().catch(() => {});
  }
}

async function readCapsule(capsuleId) {
  const root = await ensureCapsuleRoot();
  const file = path.join(root, `${safeCapsuleName(capsuleId)}.json`);
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function writeCapsule(capsule) {
  const root = await ensureCapsuleRoot();
  const file = path.join(root, `${safeCapsuleName(capsule.capsule_id)}.json`);
  await fs.writeFile(file, JSON.stringify(capsule, null, 2) + '\\n', 'utf8');
  return file;
}

function capsuleEvent(eventType, summary, details = {}) {
  return { event_type: eventType, summary, occurred_at: capsuleNow(), actor: 'operator', details };
}

async function verifyIntegrity() {
  const manifestPath = path.join(__dirname, 'assets', 'security-manifest.json');
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    if (manifest.product !== 'Phoenix Aether' || manifest.owner !== 'Khalil Mohammad Khalil' || !manifest.files) return { ok: false, reason: 'The Phoenix Aether integrity manifest is invalid.' };
    for (const [relative, expected] of Object.entries(manifest.files)) {
      const data = await fs.readFile(path.join(__dirname, relative));
      const actual = crypto.createHash('sha256').update(data).digest('hex');
      if (actual.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) {
        return { ok: false, reason: `Integrity check failed for ${relative}. The application files may have been modified.` };
      }
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: `Integrity verification could not complete: ${error.message}` };
  }
}

const escapeHtml = (value) => String(value).replace(/[&<>\"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[character]));

function localAddresses() {
  const interfaceEntries = Object.entries(os.networkInterfaces()).flatMap(([name, entries]) => (entries || []).filter((entry) => entry && entry.family === 'IPv4' && !entry.internal).map((entry) => ({ name, address: entry.address })));
  const isVirtual = (name) => /vpn|tun|vmware|virtual|hyper-v|bluetooth|loopback|proton/i.test(name);
  const physical = interfaceEntries.filter((entry) => !isVirtual(entry.name));
  let preferred = physical.map((entry) => entry.address);
  if (process.platform === 'win32') {
    try {
      const routeTable = execFileSync('route.exe', ['print', '-4'], { encoding: 'utf8', windowsHide: true });
      const defaultRouteAddresses = [...routeTable.matchAll(/^\s*0\.0\.0\.0\s+0\.0\.0\.0\s+\S+\s+(\d+\.\d+\.\d+\.\d+)\s+/gm)].map((match) => match[1]);
      preferred = [...defaultRouteAddresses, ...preferred];
    } catch {
      // Fall back to the physical IPv4 interfaces when route.exe is unavailable.
    }
  }
  const ordered = [...new Set(preferred)].filter((address) => physical.some((entry) => entry.address === address));
  return ordered.map((address) => `http://${address}:${localPort}`);
}

function localTransferPage(fileSession, token) {
  const name = escapeHtml(fileSession.name);
  const downloadPath = `/aether/${encodeURIComponent(token)}/download`;
  return `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phoenix Aether local transfer</title><style>body{font-family:system-ui,sans-serif;background:#07100f;color:#eff8f3;max-width:720px;margin:0 auto;padding:32px}main{border:1px solid #28443b;padding:28px;background:#0d1c18}h1{margin-top:0;color:#ff8a45}a,button{display:inline-block;background:#ff8a45;color:#111;padding:13px 18px;border:0;text-decoration:none;font-weight:700;cursor:pointer}small{color:#a8c2b7}code{word-break:break-all}</style><main><p>PHOENIX AETHER · LOCAL HANDOFF</p><h1>${name}</h1><p>${fileSession.size} bytes · SHA-256 <code>${fileSession.hash}</code></p><p>This transfer stays on your local network or hotspot. No internet account is used.</p><a href="${downloadPath}">Download verified file</a><p><small>Keep this page open until the download completes.</small></p></main>`;
}

function startLocalServer() {
  return new Promise((resolve, reject) => {
    localServer = http.createServer(async (request, response) => {
      try {
        const requestUrl = new URL(request.url, 'http://127.0.0.1');
        const parts = requestUrl.pathname.split('/').filter(Boolean);
        if (parts[0] !== 'aether' || !parts[1]) {
          response.writeHead(404); response.end('Not found'); return;
        }
        const token = decodeURIComponent(parts[1]);
        const fileSession = fileSessions.get(token);
        if (!fileSession) { response.writeHead(410); response.end('Transfer session expired'); return; }
        if (parts.length === 2) {
          response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
          response.end(localTransferPage(fileSession, token));
          return;
        }
        if (parts[2] === 'download') {
          const safeName = fileSession.name.replace(/[\\/:*?\"<>|\u0000-\u001f]/g, '_');
          response.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': fileSession.size, 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`, 'Cache-Control': 'no-store' });
          const stream = require('node:fs').createReadStream(fileSession.filePath);
          stream.on('error', (error) => { if (!response.headersSent) response.writeHead(500); response.end(`Read failed: ${error.code || error.message}`); });
          stream.pipe(response);
          return;
        }
        response.writeHead(404); response.end('Not found');
      } catch (error) {
        response.writeHead(500); response.end(`Local transfer error: ${error.message}`);
      }
    });
    localServer.once('error', reject);
    localServer.listen(0, '0.0.0.0', () => { localPort = localServer.address().port; resolve(); });
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 960,
    minHeight: 660,
    backgroundColor: '#07100f',
    title: 'Phoenix Aether',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.removeMenu();
  window.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

async function closeFileSession(token) {
  const fileSession = fileSessions.get(token);
  if (!fileSession) return;
  fileSessions.delete(token);
  await fileSession.handle.close().catch(() => {});
  if (fileSession.temporaryPath) await fs.unlink(fileSession.temporaryPath).catch(() => {});
}

function uniqueArchiveName(preferred, usedNames) {
  const cleaned = String(preferred || 'item').replace(/[\\/:*?\"<>|\u0000-\u001f]/g, '_').replace(/^\.+$/, '_');
  let candidate = cleaned || 'item';
  let suffix = 2;
  while (usedNames.has(candidate)) candidate = `${cleaned}-${suffix++}`;
  usedNames.add(candidate);
  return candidate;
}

async function addPathToArchive(archive, sourcePath, archivePath, stats) {
  const entry = await fs.lstat(sourcePath);
  if (entry.isSymbolicLink()) return;
  if (entry.isDirectory()) {
    const children = await fs.readdir(sourcePath, { withFileTypes: true });
    if (!children.length) archive.append('', { name: `${archivePath}/` });
    for (const child of children) {
      await addPathToArchive(archive, path.join(sourcePath, child.name), path.join(archivePath, child.name), stats);
    }
    return;
  }
  if (entry.isFile()) {
    archive.file(sourcePath, { name: archivePath });
    stats.count += 1;
  }
}

async function createBundle(inputPaths) {
  const temporaryPath = path.join(os.tmpdir(), `phoenix-aether-${crypto.randomUUID()}.zip`);
  const output = require('node:fs').createWriteStream(temporaryPath);
  const archive = archiver('zip', { zlib: { level: 0 } });
  const stats = { count: 0 };
  const usedNames = new Set();
  const completion = new Promise((resolve, reject) => {
    output.once('close', resolve);
    output.once('error', reject);
    archive.once('error', reject);
  });
  archive.pipe(output);
  try {
    for (const inputPath of inputPaths) {
      const label = uniqueArchiveName(path.basename(inputPath) || 'item', usedNames);
      await addPathToArchive(archive, inputPath, label, stats);
    }
    await archive.finalize();
    await completion;
    return { temporaryPath, itemCount: stats.count };
  } catch (error) {
    archive.destroy();
    output.destroy();
    await fs.unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

async function prepareFile(filePath, displayName = path.basename(filePath), temporaryPath = null) {
  const handle = await fs.open(filePath, 'r');
  try {
    const stat = await handle.stat();
    const hash = crypto.createHash('sha256');
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    let position = 0;
    while (position < stat.size) {
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, position);
      if (!bytesRead) throw new Error('The file changed while it was being read.');
      hash.update(buffer.subarray(0, bytesRead));
      position += bytesRead;
    }
    const token = crypto.randomUUID();
    const fileSession = { handle, filePath, name: displayName, size: stat.size, hash: hash.digest('hex'), temporaryPath };
    fileSessions.set(token, fileSession);
    return {
      token,
      name: fileSession.name,
      size: fileSession.size,
      total: Math.max(1, Math.ceil(fileSession.size / CHUNK_BYTES)),
      hash: fileSession.hash,
      itemCount: fileSession.itemCount || 1,
      localUrls: localAddresses().map((base) => `${base}/aether/${encodeURIComponent(token)}`)
    };
  } catch (error) {
    await handle.close().catch(() => {});
    if (temporaryPath) await fs.unlink(temporaryPath).catch(() => {});
    throw error;
  }
}

async function prepareBundle(inputPaths) {
  const bundle = await createBundle(inputPaths);
  const name = `Phoenix-Aether-Bundle-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
  const prepared = await prepareFile(bundle.temporaryPath, name, bundle.temporaryPath);
  prepared.bundle = true;
  prepared.itemCount = bundle.itemCount;
  const session = fileSessions.get(prepared.token);
  if (session) session.itemCount = bundle.itemCount;
  return prepared;
}

app.whenReady().then(async () => {
  const integrity = await verifyIntegrity();
  if (!integrity.ok && app.isPackaged) {
    await dialog.showMessageBox({
      type: 'error',
      title: 'Phoenix Aether integrity warning',
      message: 'This copy of Phoenix Aether failed its integrity check.',
      detail: `${integrity.reason}\n\nThe application will close safely without deleting files, blocking network addresses, or changing user data. For authorized modifications or development work, contact Khalil Mohammad Khalil at khalilmkhalil0937@gmail.com.`,
      buttons: ['Close']
    });
    app.quit();
    return;
  }
  await startLocalServer();
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media');
  });

  const prepareSelection = async (paths) => {
    try {
      return paths.length === 1 ? await prepareFile(paths[0]) : await prepareBundle(paths);
    } catch (error) {
      const reason = error?.code === 'EACCES' ? 'Windows denied access to one of the selected items.' : error?.code === 'ENOENT' ? 'A selected item was moved or deleted before it could be read.' : error?.code === 'EBUSY' ? 'A selected item is locked by another application.' : error?.message || 'Windows could not read the selected items.';
      return { error: `${reason} Close other applications using them, check permissions, and try again.` };
    }
  };

  ipcMain.handle('aether:pick-files', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select one or more files for Phoenix Aether',
      properties: ['openFile', 'multiSelections']
    });
    if (result.canceled || !result.filePaths.length) return { cancelled: true };
    return prepareSelection(result.filePaths);
  });

  ipcMain.handle('aether:pick-folder', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Select a folder for Phoenix Aether',
      properties: ['openDirectory']
    });
    if (result.canceled || !result.filePaths.length) return { cancelled: true };
    return prepareSelection(result.filePaths);
  });

  ipcMain.handle('aether:pick-file', async () => {
    const result = await dialog.showOpenDialog({ title: 'Select a file for Phoenix Aether', properties: ['openFile'] });
    if (result.canceled || !result.filePaths[0]) return { cancelled: true };
    return prepareSelection([result.filePaths[0]]);
  });

  ipcMain.handle('aether:read-chunk', async (_event, { token, index, chunkBytes = CHUNK_BYTES }) => {
    const fileSession = fileSessions.get(token);
    if (!fileSession) throw new Error('The prepared file session expired. Select the file again.');
    if (!Number.isSafeInteger(index) || index < 0 || !Number.isSafeInteger(chunkBytes) || chunkBytes !== CHUNK_BYTES) throw new Error('Invalid transfer frame request.');
    const position = index * CHUNK_BYTES;
    if (position >= fileSession.size && !(fileSession.size === 0 && index === 0)) throw new Error('The requested transfer frame is outside the file.');
    const length = Math.min(CHUNK_BYTES, Math.max(0, fileSession.size - position));
    const buffer = Buffer.alloc(length);
    if (length > 0) {
      const { bytesRead } = await fileSession.handle.read(buffer, 0, length, position);
      if (bytesRead !== length) throw new Error('The file changed or became unavailable while streaming.');
    }
    return buffer.toString('base64');
  });

  ipcMain.handle('aether:release-file', async (_event, token) => {
    await closeFileSession(token);
    return { released: true };
  });

  ipcMain.handle('aether:open-external', async (_event, url) => {
    const allowed = [
      'mailto:khalilmkhalil0937@gmail.com',
      'https://instagram.com/khalil_m_khalil09',
      'https://www.instagram.com/khalil_m_khalil09',
      'https://wa.me/khalil_m_khalil0'
    ];
    if (typeof url !== 'string' || !allowed.includes(url)) throw new Error('This external link is not allowed.');
    await shell.openExternal(url);
    return { opened: true };
  });

  ipcMain.handle('aether:qr-data-url', async (_event, payload) => {
    if (typeof payload !== 'string' || payload.length > 12000) throw new Error('QR payload is too large.');
    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'L',
      margin: 1,
      width: 820,
      color: { dark: '#06100e', light: '#fffdf6' }
    });
  });

  ipcMain.handle('capsule:list', async () => {
    const root = await ensureCapsuleRoot();
    const names = (await fs.readdir(root)).filter((name) => name.endsWith('.json'));
    const capsules = [];
    for (const name of names) {
      try {
        const capsule = JSON.parse(await fs.readFile(path.join(root, name), 'utf8'));
        capsules.push({ capsuleId: capsule.capsule_id, title: capsule.title, updatedAt: capsule.updated_at, trustLevel: capsule.trust_level, itemCount: capsule.items?.length || 0 });
      } catch { /* Ignore a partially written local file in the index. */ }
    }
    return capsules.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  });

  ipcMain.handle('capsule:create', async (_event, payload = {}) => {
    const title = String(payload.title || '').trim();
    if (!title) throw new Error('Capsule title is required.');
    const now = capsuleNow();
    const capsule = {
      capsule_type: 'phoenix-awaken-evidence-capsule', schema_version: '0.2', capsule_id: `capsule-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`,
      title, trust_level: ['trusted', 'review', 'untrusted'].includes(payload.trustLevel) ? payload.trustLevel : 'review',
      risk_id: String(payload.riskId || '').trim() || null, control_id: String(payload.controlId || '').trim() || null,
      created_at: now, updated_at: now, items: [], events: [capsuleEvent('capsule-created', `Created local capsule ${title}`)], decisions: []
    };
    if (String(payload.decision || '').trim()) {
      capsule.decisions.push(String(payload.decision).trim());
      capsule.events.push(capsuleEvent('decision-recorded', String(payload.decision).trim()));
    }
    const file = await writeCapsule(capsule);
    return { capsule, file };
  });

  ipcMain.handle('capsule:record-transfer', async (_event, { capsuleId, name, hash, sizeBytes, direction = 'outgoing', transport = 'local' }) => {
    const capsule = await readCapsule(capsuleId);
    if (!name || !/^[a-f0-9]{64}$/i.test(String(hash)) || !Number.isSafeInteger(sizeBytes) || sizeBytes < 0) throw new Error('Invalid transfer evidence.');
    if (!['outgoing', 'incoming'].includes(direction)) throw new Error('Invalid transfer direction.');
    capsule.events.push(capsuleEvent('aether-transfer', `${direction === 'incoming' ? 'Incoming' : 'Outgoing'} transfer verified for ${name}`, { name, sha256: String(hash).toLowerCase(), sizeBytes, direction, transport }));
    capsule.updated_at = capsuleNow();
    await writeCapsule(capsule);
    return capsule;
  });

  ipcMain.handle('capsule:add-file', async (_event, { capsuleId, token, notes = '' }) => {
    const capsule = await readCapsule(capsuleId);
    const session = fileSessions.get(token);
    if (!session) throw new Error('The prepared file session expired. Select the payload again.');
    const duplicate = (capsule.items || []).some((item) => item.sha256 === session.hash && item.size_bytes === session.size);
    if (!duplicate) {
      capsule.items.push({ name: session.name, path: session.filePath, size_bytes: session.size, sha256: session.hash, added_at: capsuleNow(), source: 'phoenix-aether', notes: String(notes || '').trim() });
      capsule.events.push(capsuleEvent('evidence-added', `Added ${session.name} from Phoenix Aether`, { sha256: session.hash, size_bytes: session.size, source: 'phoenix-aether' }));
      capsule.updated_at = capsuleNow();
      await writeCapsule(capsule);
    }
    return capsule;
  });

  ipcMain.handle('capsule:verify', async (_event, { capsuleId }) => {
    const capsule = await readCapsule(capsuleId);
    const results = [];
    for (const item of capsule.items || []) {
      try {
        const actual = await hashFilePath(item.path);
        results.push({ name: item.name, path: item.path, status: actual.sha256 === item.sha256 && actual.sizeBytes === item.sizeBytes ? 'verified' : 'changed', expectedSha256: item.sha256, actualSha256: actual.sha256, sizeBytes: actual.sizeBytes });
      } catch (error) {
        results.push({ name: item.name, path: item.path, status: 'missing', expectedSha256: item.sha256, error: error.code || error.message });
      }
    }
    capsule.events.push(capsuleEvent('integrity-checked', `Checked ${results.length} evidence item(s)`, { results }));
    capsule.updated_at = capsuleNow();
    await writeCapsule(capsule);
    return { capsule, results };
  });

  ipcMain.handle('aether:save-file', async (_event, { name, base64 }) => {
    const safeName = String(name || 'aether-transfer.bin').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_');
    const result = await dialog.showSaveDialog({ title: 'Save received file', defaultPath: safeName });
    if (result.canceled || !result.filePath) return { cancelled: true };
    await fs.writeFile(result.filePath, Buffer.from(base64, 'base64'));
    return { path: result.filePath };
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  for (const token of fileSessions.keys()) void closeFileSession(token);
});

app.on('window-all-closed', () => {
  localServer?.close();
  if (process.platform !== 'darwin') app.quit();
});
