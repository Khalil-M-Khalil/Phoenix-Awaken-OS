/* Phoenix Aether preview protocol: clean-room, local-only QR frame loop.
   AETH1|session|index|total|hash12|fileNameB64|payloadB64
   It repeats sequential chunks; the receiver collects unique indices, rebuilds,
   and validates SHA-256 before enabling a save dialog. */

const CHUNK_CHARS = 300;
const FRAME_MS = 145;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const state = {
  outgoing: null,
  frameCursor: 0,
  streamTimer: null,
  renderBusy: false,
  cameraStream: null,
  scanHandle: null,
  received: { session: null, total: 0, hash: '', name: '', frames: new Map(), completed: null },
  capsules: [],
  activeCapsuleId: null,
  transferRecorded: false
};

const $ = (id) => document.getElementById(id);
const bytesToBase64 = (bytes) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
const base64ToBytes = (value) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
const sha256 = async (bytes) => {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...digest].map((x) => x.toString(16).padStart(2, '0')).join('');
};
const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
};
const sessionId = () => crypto.getRandomValues(new Uint32Array(2)).join('').slice(0, 10);

function setFileMessage(message, isError = false) {
  const target = $('file-label');
  target.textContent = message;
  target.style.color = isError ? '#ff8a7e' : '';
}

function selectMode(mode) {
  document.querySelectorAll('.mode-tab').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  document.querySelectorAll('.mode-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `${mode}-panel`));
}

document.querySelectorAll('.mode-tab').forEach((button) => button.addEventListener('click', () => selectMode(button.dataset.mode)));

function capsuleMessage(message, isError = false) {
  $('capsule-status').textContent = message;
  $('capsule-status').style.color = isError ? '#ff8a7e' : '';
}

function showCapsuleDetail(capsule) {
  if (!capsule) {
    $('capsule-detail').hidden = true;
    $('verify-capsule').disabled = true;
    return;
  }
  const capsuleId = capsule.capsuleId || capsule.capsule_id;
  state.activeCapsuleId = capsuleId;
  $('capsule-detail').hidden = false;
  $('verify-capsule').disabled = false;
  $('add-current-evidence').disabled = !state.outgoing;
  $('capsule-detail-title').textContent = capsule.title;
  $('capsule-detail-meta').textContent = `${capsule.trustLevel || capsule.trust_level} · ${capsule.itemCount ?? capsule.items?.length ?? 0} evidence item(s) · ${capsuleId}`;
  $('capsule-detail-output').textContent = JSON.stringify(capsule, null, 2);
  document.querySelectorAll('[data-capsule-id]').forEach((card) => card.classList.toggle('selected', card.dataset.capsuleId === capsuleId));
}

async function refreshCapsules() {
  try {
    state.capsules = await window.aetherDesktop.listCapsules();
    const list = $('capsule-list');
    list.replaceChildren();
    if (!state.capsules.length) {
      list.innerHTML = '<p class="notice">No capsules loaded yet. Create one for this work session.</p>';
      return;
    }
    state.capsules.forEach((capsule) => {
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'capsule-card'; card.dataset.capsuleId = capsule.capsuleId;
      card.innerHTML = `<strong>${String(capsule.title).replace(/[&<>"']/g, '')}</strong><span>${capsule.trustLevel} · ${capsule.itemCount} item(s)</span><small>${capsule.capsuleId}</small>`;
      card.addEventListener('click', () => showCapsuleDetail(capsule));
      list.append(card);
    });
    if (state.activeCapsuleId) showCapsuleDetail(state.capsules.find((item) => item.capsuleId === state.activeCapsuleId) || state.capsules[0]);
  } catch (error) { capsuleMessage(`Capsule index unavailable: ${error.message || error}`, true); }
}

$('capsule-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const created = await window.aetherDesktop.createCapsule({
      title: $('capsule-title').value,
      trustLevel: $('capsule-trust').value,
      controlId: $('capsule-control').value,
      riskId: $('capsule-risk').value,
      decision: $('capsule-decision').value
    });
    state.transferRecorded = false;
    await refreshCapsules();
    showCapsuleDetail(created.capsule);
    capsuleMessage('CAPSULE READY');
    $('capsule-form').reset();
  } catch (error) { capsuleMessage(`Could not create capsule: ${error.message || error}`, true); }
});

$('refresh-capsules').addEventListener('click', refreshCapsules);
$('add-current-evidence').addEventListener('click', async () => {
  if (!state.activeCapsuleId || !state.outgoing) return;
  try {
    const capsule = await window.aetherDesktop.addFileToCapsule({ capsuleId: state.activeCapsuleId, token: state.outgoing.token, notes: 'Selected and fingerprinted by Phoenix Aether.' });
    showCapsuleDetail(capsule);
    capsuleMessage('PAYLOAD ADDED AS EVIDENCE');
    await refreshCapsules();
  } catch (error) { capsuleMessage(`Could not add evidence: ${error.message || error}`, true); }
});

$('verify-capsule').addEventListener('click', async () => {
  if (!state.activeCapsuleId) return;
  try {
    const result = await window.aetherDesktop.verifyCapsule(state.activeCapsuleId);
    $('capsule-detail-output').textContent = JSON.stringify(result, null, 2);
    capsuleMessage(result.results.every((item) => item.status === 'verified') ? 'ALL EVIDENCE VERIFIED' : 'REVIEW RESULTS', result.results.some((item) => item.status !== 'verified'));
    await refreshCapsules();
  } catch (error) { capsuleMessage(`Verification failed: ${error.message || error}`, true); }
});

async function recordActiveTransfer() {
  if (!state.activeCapsuleId || !state.outgoing || state.transferRecorded) return;
  try {
    const capsule = await window.aetherDesktop.recordTransfer({ capsuleId: state.activeCapsuleId, name: state.outgoing.name, hash: state.outgoing.hash, sizeBytes: state.outgoing.size, direction: 'outgoing', transport: 'local-or-optical' });
    state.transferRecorded = true;
    showCapsuleDetail(capsule);
    capsuleMessage('TRANSFER RECORDED');
  } catch (error) { capsuleMessage(`Transfer log failed: ${error.message || error}`, true); }
}

refreshCapsules();

document.querySelectorAll('[data-external-url]').forEach((button) => button.addEventListener('click', async () => {
  const url = button.dataset.externalUrl;
  const original = button.innerHTML;
  button.disabled = true;
  button.querySelector('small').textContent = 'Opening…';
  try {
    await window.aetherDesktop.openExternal(url);
    button.querySelector('small').textContent = 'Opened in your default app';
  } catch {
    button.querySelector('small').textContent = 'Could not open automatically';
  } finally {
    setTimeout(() => { button.innerHTML = original; button.disabled = false; }, 2200);
  }
}));

async function armSelectedFile(fileData) {
  try {
    if (!fileData) return;
    setFileMessage(`Preparing ${fileData.name} locally…`);
    const id = sessionId();
    const total = Number(fileData.total);
    if (!fileData.token || !Number.isSafeInteger(total) || total < 1 || typeof fileData.hash !== 'string') throw new Error('Windows returned incomplete file metadata.');
    const itemCount = Number(fileData.itemCount) || 1;
    state.outgoing = { id, token: fileData.token, name: fileData.name, size: Number(fileData.size) || 0, hash: fileData.hash, total, itemCount, bundle: Boolean(fileData.bundle) };
    state.transferRecorded = false;
    const localUrl = fileData.localUrls?.[0] || '';
    $('local-transfer').hidden = !localUrl;
    $('local-url').textContent = localUrl || 'No local network address detected. Connect Wi-Fi or create a hotspot and select the file again.';
    const payloadLabel = fileData.bundle ? `${fileData.name} · ${itemCount} items` : fileData.name;
    setFileMessage(`${payloadLabel} is armed. Choose Ignite stream to show the QR frames.`);
    $('sender-session').textContent = `SESSION ${id}`;
    $('send-meta').hidden = false;
    $('send-file-name').textContent = payloadLabel;
    $('send-file-size').textContent = formatBytes(state.outgoing.size);
    $('send-frame-count').textContent = String(total);
    $('send-hash').textContent = `${state.outgoing.hash.slice(0, 18)}…`;
    $('start-stream').disabled = false;
  } catch (error) {
    state.outgoing = null;
    $('local-transfer').hidden = true;
    $('send-meta').hidden = true;
    $('start-stream').disabled = true;
    setFileMessage(`Could not prepare the file: ${error.message || error}`, true);
  }
}

$('copy-local-url').addEventListener('click', async () => {
  const url = $('local-url').textContent;
  if (!url || url.startsWith('No local')) return;
  try {
    await navigator.clipboard.writeText(url);
    setFileMessage('Local handoff link copied. Open it on the receiving device.');
  } catch {
    setFileMessage('Could not copy the link. Select and copy it manually.', true);
  }
});

async function chooseSelection(picker, emptyMessage) {
  try {
    setFileMessage('Opening the secure Windows file picker…');
    const selected = await picker();
    if (selected?.cancelled) {
      setFileMessage(emptyMessage);
      return;
    }
    if (selected?.error) throw new Error(selected.error);
    if (state.outgoing?.token) await window.aetherDesktop.releaseFile(state.outgoing.token);
    await armSelectedFile(selected);
  } catch (error) {
    state.outgoing = null;
    $('local-transfer').hidden = true;
    $('send-meta').hidden = true;
    $('start-stream').disabled = true;
    setFileMessage(`Could not prepare the selection: ${error.message || error}`, true);
  }
}

$('select-file').addEventListener('click', () => chooseSelection(() => window.aetherDesktop.pickFiles(), 'No files selected.'));
$('select-folder').addEventListener('click', () => chooseSelection(() => window.aetherDesktop.pickFolder(), 'No folder selected.'));

async function renderFrame() {
  if (!state.outgoing || state.renderBusy) return;
  state.renderBusy = true;
  try {
    const { id, token, name, hash, total } = state.outgoing;
    const index = state.frameCursor % total;
    const name64 = bytesToBase64(encoder.encode(name));
    const chunk = await window.aetherDesktop.readChunk(token, index, 225);
    const payload = `AETH1|${id}|${index}|${total}|${hash.slice(0, 12)}|${name64}|${chunk}`;
    const dataUrl = await window.aetherDesktop.renderQr(payload);
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('QR image could not be decoded locally.'));
      image.src = dataUrl;
    });
    const canvas = $('qr-canvas');
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    $('frame-indicator').textContent = `FRAME ${index + 1} / ${total}`;
    state.frameCursor += 1;
  } catch (error) {
    clearInterval(state.streamTimer);
    state.streamTimer = null;
    $('stop-stream').disabled = true;
    $('start-stream').disabled = !state.outgoing;
    setFileMessage(`QR generation failed: ${error.message || error}`, true);
  } finally {
    state.renderBusy = false;
  }
}

$('start-stream').addEventListener('click', async () => {
  if (!state.outgoing || state.streamTimer) return;
  state.frameCursor = 0;
  state.renderBusy = false;
  $('qr-stage').hidden = false;
  await recordActiveTransfer();
  $('start-stream').disabled = true;
  $('stop-stream').disabled = false;
  $('send-rate').textContent = `${Math.round(1000 / FRAME_MS)} fps`;
  await renderFrame();
  state.streamTimer = setInterval(() => { void renderFrame(); }, FRAME_MS);
});

$('stop-stream').addEventListener('click', () => {
  clearInterval(state.streamTimer); state.streamTimer = null;
  $('stop-stream').disabled = true; $('start-stream').disabled = !state.outgoing;
  $('send-rate').textContent = 'paused';
});

function resetReceive(session, total, hash, name) {
  state.received = { session, total, hash, name, frames: new Map(), completed: null };
  $('receive-session').textContent = `SESSION ${session}`;
  $('receive-file-name').textContent = name;
  $('integrity-status').textContent = 'Collecting frames';
  $('save-file').disabled = true;
}

async function completeReceive() {
  const incoming = state.received;
  const base64 = Array.from({ length: incoming.total }, (_, index) => incoming.frames.get(index)).join('');
  const bytes = base64ToBytes(base64);
  const actual = await sha256(bytes);
  const verified = actual.startsWith(incoming.hash);
  $('integrity-status').textContent = verified ? 'SHA-256 MATCH ✓' : 'Checksum mismatch';
  $('integrity-status').style.color = verified ? '#72edba' : '#ff8a7e';
  $('camera-message').textContent = verified ? 'Transfer rebuilt and verified locally.' : 'The reconstructed file failed integrity verification.';
  if (verified) {
    incoming.completed = { name: incoming.name, base64 };
    $('save-file').disabled = false;
  }
}

async function ingestFrame(value) {
  if (!value.startsWith('AETH1|')) return;
  const fields = value.split('|');
  if (fields.length !== 7) return;
  const [, session, indexText, totalText, hash, name64, payload] = fields;
  const index = Number(indexText); const total = Number(totalText);
  if (!Number.isSafeInteger(index) || !Number.isSafeInteger(total) || index < 0 || index >= total || total < 1) return;
  let name = 'aether-transfer.bin';
  try { name = decoder.decode(base64ToBytes(name64)).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_') || name; } catch { return; }
  if (state.received.session !== session) resetReceive(session, total, hash, name);
  if (state.received.total !== total || state.received.hash !== hash) return;
  if (!state.received.frames.has(index)) state.received.frames.set(index, payload);
  const count = state.received.frames.size;
  const percent = Math.floor((count / total) * 100);
  $('receive-progress').textContent = `${count} / ${total} unique frames`;
  $('receive-percent').textContent = `${percent}%`;
  $('progress-bar').style.width = `${percent}%`;
  $('camera-message').textContent = `Receiving ${name} — keep the sender screen inside the reticle.`;
  if (count === total && !state.received.completed) await completeReceive();
}

async function scanLoop() {
  if (!state.cameraStream) return;
  const video = $('camera'); const canvas = $('scan-canvas');
  if (video.readyState >= video.HAVE_CURRENT_DATA) {
    const maxWidth = 900;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.max(1, Math.floor(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.floor(video.videoHeight * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
    if (result?.data) void ingestFrame(result.data);
  }
  state.scanHandle = requestAnimationFrame(scanLoop);
}

$('start-camera').addEventListener('click', async () => {
  if (state.cameraStream) return;
  try {
    state.cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    $('camera').srcObject = state.cameraStream;
    $('camera-message').textContent = 'Camera active. Aim at a Phoenix Aether QR stream.';
    $('start-camera').disabled = true; $('stop-camera').disabled = false;
    scanLoop();
  } catch (error) { $('camera-message').textContent = `Camera error: ${error.message || error}`; }
});

$('stop-camera').addEventListener('click', () => {
  cancelAnimationFrame(state.scanHandle);
  state.cameraStream?.getTracks().forEach((track) => track.stop()); state.cameraStream = null;
  $('camera').srcObject = null; $('camera-message').textContent = 'Camera is idle.';
  $('start-camera').disabled = false; $('stop-camera').disabled = true;
});

$('save-file').addEventListener('click', async () => {
  if (!state.received.completed) return;
  const result = await window.aetherDesktop.saveFile(state.received.completed);
  if (result.path) $('camera-message').textContent = `Verified file saved to ${result.path}`;
});

window.addEventListener('beforeunload', () => {
  clearInterval(state.streamTimer);
  if (state.outgoing?.token) void window.aetherDesktop.releaseFile(state.outgoing.token);
  state.cameraStream?.getTracks().forEach((track) => track.stop());
});

window.addEventListener('error', (event) => {
  setFileMessage(`Interface error: ${event.message}. Please restart Phoenix Aether and try again.`, true);
});
