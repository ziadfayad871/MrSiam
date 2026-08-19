import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import WebSocket from 'ws';
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = path.join(__dirname, 'auth');
const PORT = Number(process.env.PORT || process.env.GATEWAY_PORT || 3002);
const GATEWAY_KEY = process.env.GATEWAY_KEY || '';
const TUNNEL_URL = process.env.GATEWAY_TUNNEL || 'wss://mrmohamedsiam.runasp.net/wa/tunnel';
const TUNNEL_KEY = process.env.GATEWAY_TUNNEL_KEY || '';

function keyMatches(req) {
  if (!GATEWAY_KEY) return true;
  const header = req.headers['x-api-key'];
  if (header === GATEWAY_KEY) return true;
  const url = new URL(req.url, 'http://localhost:' + PORT);
  return url.searchParams.get('key') === GATEWAY_KEY;
}

let socket = null;
let starting = false;
let currentQr = null;
let connected = false;
let myNumber = null;
let tunnel = null;

function normalizePhone(raw) {
  let d = String(raw ?? '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length >= 12 && d.startsWith('20')) return d;
  if (d.startsWith('0')) return '2' + d;
  return d;
}

function tunnelTarget() {
  const url = new URL(TUNNEL_URL);
  if (TUNNEL_KEY) url.searchParams.set('key', TUNNEL_KEY);
  if (url.protocol === 'http:') url.protocol = 'ws:';
  if (url.protocol === 'https:') url.protocol = 'wss:';
  return url.toString();
}

function tunnelSend(obj) {
  if (tunnel && tunnel.readyState === WebSocket.OPEN) {
    try {
      tunnel.send(JSON.stringify(obj));
    } catch {}
  }
}

async function handleSendDoc(msg) {
  let ok = false;
  if (connected && socket && msg?.base64) {
    try {
      const buf = Buffer.from(String(msg.base64), 'base64');
      const fileName = String(msg.fileName || 'document.pdf');
      const caption = String(msg.caption ?? '');
      const contentType = String(msg.contentType || 'application/pdf');
      await socket.sendMessage(normalizePhone(msg.phone) + '@s.whatsapp.net', {
        document: buf,
        fileName,
        mimetype: contentType,
        caption,
      });
      ok = true;
      console.log('[📄] اتسجلت ملف لـ', msg.phone, '←', fileName);
    } catch (e) {
      console.error('[❌] فشل إرسال الملف:', e.message);
    }
  }
  tunnelSend({ type: 'sent', id: msg.id, ok });
}

async function performLogout() {
  try {
    if (socket) await socket.logout();
  } catch {}
  connected = false;
  currentQr = null;
  myNumber = null;
  try {
    const files = await fs.readdir(AUTH_DIR);
    await Promise.all(files.map((f) => fs.unlink(path.join(AUTH_DIR, f)).catch(() => {})));
  } catch {}
  tunnelSend({ type: 'update', connected: false, phone: null });
  if (socket) {
    try {
      socket.end(undefined);
    } catch {}
    socket = null;
  }
  console.log('[🔁] اتسجلت الخروج — QR جديد مطلوب لربط رقم تاني');
  start();
}

async function handleTunnelMessage(text) {
  let msg;
  try {
    msg = JSON.parse(text);
  } catch {
    return;
  }
  if (msg?.type === 'send') {
    let ok = false;
    if (connected && socket) {
      try {
        await socket.sendMessage(normalizePhone(msg.phone) + '@s.whatsapp.net', { text: String(msg.message ?? '') });
        ok = true;
        console.log('[📤] اتسجلت (عبر المستضاف) لـ', msg.phone);
      } catch (e) {
        console.error('[❌] فشل الإرسال (عبر المستضاف):', e.message);
      }
    }
    tunnelSend({ type: 'sent', id: msg.id, ok });
    return;
  }
  if (msg?.type === 'send_doc') {
    await handleSendDoc(msg);
    return;
  }
  if (msg?.type === 'logout') {
    await performLogout();
    tunnelSend({ type: 'logged_out', id: msg.id, ok: true });
  }
}

function startTunnel() {
  if (tunnel && (tunnel.readyState === WebSocket.CONNECTING || tunnel.readyState === WebSocket.OPEN)) return;

  const target = tunnelTarget();
  tunnel = new WebSocket(target);
  tunnel.on('open', () => console.log('[🔌] متصل بالمستضاف:', target.split('?')[0]));
  tunnel.on('message', (data) => handleTunnelMessage(String(data)));
  tunnel.on('close', () => {
    tunnel = null;
    console.log('[🔌] انقطع اتصال المستضاف — بنوصل تاني بعد 5 ثوانٍ');
    setTimeout(startTunnel, 5000);
  });
  tunnel.on('error', (err) => console.error('[🔌] غلط في النفق:', err.message));
}

async function qrDataUrl() {
  if (!currentQr) return null;
  try {
    return await QRCode.toDataURL(currentQr, { width: 340, margin: 2 });
  } catch {
    return null;
  }
}

function json(res, obj, status = 200) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const PAGE = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ربط واتساب السنتر</title>
<style>
  body{font-family:Tahoma,Arial;background:#faf8f5;display:flex;justify-content:center;align-items:flex-start;padding:32px 16px;color:#16121f;margin:0}
  .box{background:#fff;border:2px solid #c89b3c;border-radius:16px;padding:32px;max-width:460px;width:100%;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.08)}
  h1{font-size:22px;margin:0 0 8px}
  .sub{color:#6b6b76;font-size:13px;margin-bottom:20px}
  #st{font-weight:bold;font-size:15px;margin-bottom:16px;min-height:22px}
  img{border:1px solid #e4e0d8;border-radius:12px;max-width:100%}
  .hint{font-size:12px;color:#6b6b76;margin-top:12px}
  #ok{display:none;background:#eefaf3;border:1px solid #2e7d5b66;color:#1f6a48;border-radius:12px;padding:18px;font-weight:bold}
  .steps{font-size:12px;color:#3a3a42;text-align:start;margin:10px 0}
</style>
</head>
<body>
<div class="box">
  <h1>🔗 ربط واتساب السنتر</h1>
  <p class="sub">مرة واحدة بس — بعدها البوابة تفضل متصلة وتشغّل الرسايل الأوتوماتيك</p>
  <p id="st">⏳ بنتصل...</p>
  <div id="qrWrap">
    <div class="steps">
      ١) افتح الواتساب على موبايل السنتر<br />
      ٢) الـ Settings (الإعدادات) ← Linked devices (الأجهزة المرتبطة) ← Link a device<br />
      ٣) امسح الكود ده بالواتساب من غير ما تقفل الشاشة دي
    </div>
    <img id="qr" alt="QR" />
    <p class="hint">لو الكود اتقفل امسك الصفحة دي، هيتولد كود جديد تلقائيًا</p>
  </div>
  <div id="ok">✅ الرقم متصل وبيه يبعت رسايل تلقائيًا. <br/><span style="font-weight:normal;font-size:11px;color:#6b6b76">خلي الجهاز شغال والواتساب متصل — زي واتساب ويب.</span></div>
</div>
<script>
async function tick(){
  try{
    const s = await (await fetch('/status')).json();
    const q = await (await fetch('/qr')).json();
    const st = document.getElementById('st');
    const qrWrap = document.getElementById('qrWrap');
    const ok = document.getElementById('ok');
    if(s.connected){
      qrWrap.style.display='none';
      ok.style.display='block';
      st.textContent = '✅ متصل' + (s.phone ? ' برقم: ' + s.phone : '');
    } else if(q.qr){
      qrWrap.style.display='block';
      ok.style.display='none';
      document.getElementById('qr').src = q.qr;
      st.textContent = '🔐 محتاجين ربط — امسح الكود';
    } else {
      qrWrap.style.display='none';
      ok.style.display='none';
      st.textContent = '⏳ بنتصل بالواتساب...';
    }
  }catch(e){}
}
setInterval(tick, 2000);
tick();
</script>
</body>
</html>`;

async function setup() {
  await fs.mkdir(AUTH_DIR, { recursive: true });
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  socket = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    browser: ['MrSiam Center', 'Chrome', '120.0'],
  });

  socket.ev.on('creds.update', saveCreds);

  socket.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQr = qr;
      connected = false;
      console.log('[⌛] QR جديد — امسحه من منصة السنتر أو الصفحة المحلية');
      qrDataUrl().then((dataUrl) => tunnelSend({ type: 'qr', qr: dataUrl }));
    }

    if (connection === 'open') {
      connected = true;
      currentQr = null;
      myNumber = socket?.user?.id ?? null;
      console.log('[✅] متصل بالرقم:', myNumber);
      tunnelSend({ type: 'update', connected: true, phone: myNumber });
    }

    if (connection === 'close') {
      connected = false;
      currentQr = null;
      tunnelSend({ type: 'update', connected: false, phone: null });
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('[🔌] انقطع الاتصال', shouldReconnect ? '— جارٍ إعادة الاتصال...' : '— اتسجلت الخروج من الواتساب');
      if (shouldReconnect) start();
    }
  });
}

async function start() {
  if (starting) return;
  starting = true;
  try {
    await setup();
  } catch (err) {
    console.error('[❌] فشل بدء الاتصال:', err.message, '— جارٍ إعادة المحاولة بعد 5 ثوانٍ');
    setTimeout(start, 5000);
  } finally {
    starting = false;
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, 'http://localhost:' + PORT);

  if (url.pathname === '/status') {
    return json(res, { connected, phone: myNumber });
  }

  if (url.pathname === '/qr') {
    if (!connected && currentQr) {
      return json(res, { qr: await qrDataUrl() });
    }
    return json(res, { qr: null });
  }

  if (url.pathname === '/send' && req.method === 'POST') {
    if (!keyMatches(req)) return json(res, { ok: false, error: 'unauthorized' }, 401);
    const body = await readBody(req);
    const phone = normalizePhone(body.phone);
    const message = String(body.message ?? '').trim();

    if (!phone || !message) return json(res, { ok: false, error: 'phone and message مطلوبين' }, 400);
    if (!connected || !socket) return json(res, { ok: false, error: 'not connected' }, 409);

    try {
      await socket.sendMessage(phone + '@s.whatsapp.net', { text: message });
      console.log('[📤] اتسجلت لـ', phone);
      return json(res, { ok: true });
    } catch (e) {
      return json(res, { ok: false, error: e.message }, 500);
    }
  }

  if (url.pathname === '/send-document' && req.method === 'POST') {
    if (!keyMatches(req)) return json(res, { ok: false, error: 'unauthorized' }, 401);
    const body = await readBody(req);
    const phone = normalizePhone(body.phone);
    const base64 = String(body.base64 ?? '');

    if (!phone || !base64) return json(res, { ok: false, error: 'phone and base64 مطلوبين' }, 400);
    if (!connected || !socket) return json(res, { ok: false, error: 'not connected' }, 409);

    try {
      const buf = Buffer.from(base64, 'base64');
      await socket.sendMessage(phone + '@s.whatsapp.net', {
        document: buf,
        fileName: String(body.fileName || 'document.pdf'),
        mimetype: String(body.contentType || 'application/pdf'),
        caption: String(body.caption ?? ''),
      });
      console.log('[📄] اتسجلت ملف لـ', phone);
      return json(res, { ok: true });
    } catch (e) {
      return json(res, { ok: false, error: e.message }, 500);
    }
  }

  if (url.pathname === '/logout' && req.method === 'POST') {
    if (!keyMatches(req)) return json(res, { ok: false, error: 'unauthorized' }, 401);
    await performLogout();
    return json(res, { ok: true });
  }

  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(PAGE);
  }

  return json(res, { ok: false, error: 'not found' }, 404);
});

server.listen(PORT, () => {
  console.log('🌐 بوابة واتساب السنتر شغالة على: http://localhost:' + PORT);
});

start();
startTunnel();