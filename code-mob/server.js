const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = process.env.PORT || 3000;
const TUNNEL_URL = process.env.TUNNEL_URL || null;
const ACTIVE_GAME = process.env.GAME || 'pixel-poke';

const GRID_SIZE = 40;
const NAMED_COLORS = new Set(['cyan', 'pink', 'yellow', 'green', 'red', 'purple', 'white', 'orange']);
const HEX_COLOR_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
function isValidColor(c) { return NAMED_COLORS.has(c) || HEX_COLOR_RE.test(c); }
const MAX_LOG = 50;

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  game: 'pixel-poke',
  paused: false,
  startTime: Date.now(),
  pixels: {},    // "x,y" → { color, name, timestamp }
  students: {},  // name → { pixelCount, lastSeen }
  log: [],       // last MAX_LOG events (newest first)
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLocalIp() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
}

function addLog(event) {
  state.log.unshift(event);
  if (state.log.length > MAX_LOG) state.log.length = MAX_LOG;
}

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(data);
  }
}

function stateSnapshot() {
  return {
    game: state.game,
    paused: state.paused,
    startTime: state.startTime,
    pixels: state.pixels,
    students: state.students,
    log: state.log,
  };
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'init', state: stateSnapshot() }));
  ws.on('error', () => {});
});

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/', (req, res) => res.redirect(`/game/${ACTIVE_GAME}/student`));
app.get('/room', (req, res) => res.redirect(`/game/${ACTIVE_GAME}/room`));

app.get('/game/:name/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/games', req.params.name, 'student.html'));
});

app.get('/game/:name/room', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/games', req.params.name, 'room.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// ─── Admin API ────────────────────────────────────────────────────────────────

app.get('/admin/info', (req, res) => {
  res.json({
    localIp: getLocalIp(),
    port: PORT,
    tunnelUrl: TUNNEL_URL,
    activeGame: ACTIVE_GAME,
    wsSupported: true,
  });
});

app.get('/admin/state', (req, res) => {
  res.json(stateSnapshot());
});

app.post('/admin/clear', (req, res) => {
  state.pixels = {};
  state.students = {};
  state.log = [];
  state.startTime = Date.now();
  broadcast({ type: 'reset' });
  res.json({ ok: true });
});

app.post('/admin/pause', (req, res) => {
  state.paused = !state.paused;
  broadcast({ type: 'paused', paused: state.paused });
  res.json({ paused: state.paused });
});

app.post('/admin/broadcast', (req, res) => {
  const { message } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }
  broadcast({ type: 'broadcast', message: message.slice(0, 200) });
  res.json({ ok: true });
});

// ─── Pixel Poke ───────────────────────────────────────────────────────────────

app.post('/game/pixel-poke/pixel', (req, res) => {
  if (state.paused) {
    return res.status(403).json({ error: 'Game is paused' });
  }

  const { x, y, color, name } = req.body || {};
  const studentName = String(name || 'Anonymous').trim().slice(0, 20) || 'Anonymous';

  if (
    typeof x !== 'number' || typeof y !== 'number' ||
    !Number.isInteger(x) || !Number.isInteger(y) ||
    x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE
  ) {
    return res.status(400).json({ error: `x and y must be integers 0–${GRID_SIZE - 1}` });
  }

  if (!isValidColor(color)) {
    return res.status(400).json({ error: `color must be a named color (cyan, pink, ...) or a hex code like #ff0000` });
  }

  const key = `${x},${y}`;
  const timestamp = Date.now();

  state.pixels[key] = { color, name: studentName, timestamp };

  if (!state.students[studentName]) {
    state.students[studentName] = { pixelCount: 0, lastSeen: timestamp };
  }
  state.students[studentName].pixelCount++;
  state.students[studentName].lastSeen = timestamp;

  const event = { x, y, color, name: studentName, timestamp };
  addLog(event);
  broadcast({ type: 'pixel', ...event });

  res.json({ ok: true, pixelCount: state.students[studentName].pixelCount });
});

// ─── Start ────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  const ip = getLocalIp();
  console.log(`\ncode-mob server running!`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${ip}:${PORT}`);
  console.log(`  Room:    http://${ip}:${PORT}/room`);
  console.log(`  Admin:   http://${ip}:${PORT}/admin`);
  if (TUNNEL_URL) console.log(`  Tunnel:  ${TUNNEL_URL}`);
  console.log('');
});
