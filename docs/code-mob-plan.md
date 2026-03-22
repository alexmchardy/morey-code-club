# Plan: code-mob Platform + Pixel Poke (First Game)

## Context

`code-mob` is a classroom platform where students write JavaScript code on an HTML page that sends `fetch()` requests to a server, causing real-time changes on a room screen shown on the projector. It's designed to be extensible — new activities ("games") can be added over time following the same student-code → server → room-screen pattern.

**First game:** Pixel Poke — students send pixel coordinates and colors to paint a shared canvas.

This builds on Code Quest I & II concepts: variables, functions, loops, conditionals.

---

## Directory Structure

```
code-mob/
├── README.md                    # Teacher setup instructions
├── package.json                 # Node.js dependencies
├── server.js                    # Node.js server (primary)
├── server.py                    # Python/Flask server (DreamHost backup)
├── requirements.txt             # Python dependencies
├── public/
│   ├── shared.css               # Shared retro styles (matches Code Quest)
│   ├── admin.html               # Admin dashboard (served at /admin)
│   └── games/
│       └── pixel-poke/
│           ├── student.html     # Student coding page
│           └── room.html        # Projector display
```

Future games are added as `public/games/new-game-name/` with `student.html` and `room.html`.

---

## Server Design (Node.js — server.js)

**Routes:**
- `GET /` → redirect to active game's student page (configurable)
- `GET /room` → redirect to active game's room page
- `GET /game/:name/student` → serves `public/games/:name/student.html`
- `GET /game/:name/room` → serves `public/games/:name/room.html`
- `GET /admin` → serves `public/admin.html`
- `POST /game/pixel-poke/pixel` → receive `{ x, y, color, name }`, validate, store, broadcast
- `GET /admin/state` → returns full server state as JSON
- `GET /admin/info` → returns `{ localIp, port, tunnelUrl, wsSupported: true }`
- `POST /admin/clear` → reset canvas
- `POST /admin/pause` → toggle pause (stop accepting new pixels)
- `POST /admin/broadcast` → send a text message to room screen
- `WebSocket /ws` → unified WebSocket endpoint; clients identify themselves as `room` or `admin` on connect

**In-memory state (per game):**
```js
{
  game: "pixel-poke",
  paused: false,
  pixels: { /* "x,y": { color, name, timestamp } */ },
  students: { /* name: { pixelCount, lastSeen } */ },
  log: [ /* last 50 events */ ]
}
```

**Game registry pattern (for extensibility):**
Each game is inline for now. Future games can export `{ name, handleRequest(req, res, state), initialState() }` and be registered with the server.

---

## Python Server (server.py — DreamHost backup)

Flask server mirroring all routes and state. Uses polling (no WebSocket dependency) — the admin/info endpoint returns `{ wsSupported: false }` so clients fall back to polling `/admin/state` every 500ms.

**Dependencies (requirements.txt):** `flask`, `flask-cors`

---

## Admin Dashboard (/admin)

Full-featured teacher control panel. Retro styled.

**Sections:**
1. **Network Setup Panel** — shown prominently at the top:
   - Detected local IP address of the server
   - Current active deployment mode (Hotspot / Cloudflare Tunnel / DreamHost)
   - Copyable URLs: Student URL, Room URL, Admin URL
   - QR code for the student URL (generated client-side with a QR library)
   - Short setup notes for each mode (toggle between them)
2. **Live Canvas Preview** — miniature 40×40 grid showing current state
3. **Session Stats** — total pixels painted, unique students, time elapsed
4. **Student Leaderboard** — ranked list of students by pixel count
5. **Controls:**
   - `Clear Canvas` (with confirmation)
   - `Pause / Resume` (freezes new submissions; room screen shows "PAUSED" banner)
   - `Broadcast Message` (text overlay on room screen for 5 seconds)
6. **Event Log** — scrolling feed of last 50 pixel events with name, coords, color, timestamp

The server exposes `GET /admin/info` returning `{ localIp, port, tunnelUrl, wsSupported }` so the admin page can display accurate URLs. `tunnelUrl` is set via `TUNNEL_URL` environment variable.

---

## Pixel Poke — student.html

Retro-styled page (dark bg, neon colors, Press Start 2P font — matching Code Quest).

**Pre-written student API (not editable):**
```javascript
const NAME = prompt("Enter your code name:") || "Anonymous";

async function drawPixel(x, y, color) {
  await fetch('/game/pixel-poke/pixel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ x, y, color, name: NAME })
  });
}
```

**UI elements:**
- Header: "PIXEL POKE" with student's code name
- Grid reference: 40 columns (x: 0–39), 40 rows (y: 0–39)
- Available colors listed: `"cyan"` `"pink"` `"yellow"` `"green"` `"red"` `"purple"` `"white"` `"orange"`
- Code editor (CodeMirror)
- Run button (executes code in `try/catch`, shows errors inline)
- Pixel counter: "You've painted X pixels"
- Challenge prompts:
  1. Draw one pixel at any coordinate
  2. Draw a line using a loop
  3. Write a function that draws a shape, then call it

---

## Pixel Poke — room.html

Full-screen projector display. No controls (admin-only).

- 40×40 CSS grid, each cell animates when painted (brief flash/scale)
- Top bar: game title + live pixel count + student count
- Bottom ticker: scrolling log of recent activity ("Alex painted (5,10) cyan")
- "PAUSED" overlay banner when admin pauses the game
- Broadcast message overlay (fades after 5s)
- WebSocket with polling fallback (auto-detected via `/admin/info`)

---

## Network Setup (Teacher Deployment Options)

### Option 1: MacBook Hotspot (Recommended — no external dependencies)
1. System Settings → General → Sharing → Internet Sharing → enable Wi-Fi hotspot
2. Run `npm start` in `code-mob/`
3. Teacher's hotspot IP is typically `192.168.2.1`
4. Room screen: `http://192.168.2.1:3000/room`
5. Students connect to hotspot and go to `http://192.168.2.1:3000/`

### Option 2: Cloudflare Quick Tunnel (school WiFi, no account needed)
```bash
npx cloudflared tunnel --url http://localhost:3000
```
Gets a public HTTPS URL. Share with students via QR code or written on board.

### Option 3: DreamHost Python Server (cloud — polling-based)
```bash
pip install -r requirements.txt
python server.py
```
Deploy to DreamHost. Students and room screen connect via the public domain. Room screen uses polling (500ms interval).

---

## Verification

1. `npm install && npm start` (or `python server.py`)
2. Mac hotspot on; teacher opens `/room` on projector
3. Teacher opens `/admin` — verify network panel shows correct IP and QR code
4. From a second device: open `/`, enter name, run `drawPixel(0, 0, "cyan")`
5. Pixel appears on room screen; admin shows it in log and leaderboard
6. Test Pause — verify room screen shows PAUSED banner
7. Test Broadcast — verify message overlay appears on room screen
8. Test Clear — verify canvas resets on room screen and admin preview
