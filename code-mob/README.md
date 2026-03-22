# code-mob

A classroom platform where students write JavaScript to affect a shared room screen. Students send `fetch()` requests to a local server that broadcasts changes to a projector display in real time.

## Current Game: Pixel Poke

Students paint a shared 40×40 pixel canvas using `drawPixel(x, y, color)`. The room screen updates live as pixels arrive.

## Setup

### Option 1: MacBook Hotspot (Recommended)

Best for schools with network isolation between devices.

1. **Create a hotspot:** System Settings → General → Sharing → Internet Sharing
   - Share: your internet connection (Ethernet or existing WiFi)
   - To computers using: Wi-Fi
   - Enable Internet Sharing
2. **Start the server:**
   ```bash
   cd code-mob
   npm install
   npm start
   ```
3. **Open the room screen** in your browser: `http://192.168.2.1:3000/room`
   - Connect this browser to the projector
4. **Open the admin dashboard:** `http://192.168.2.1:3000/admin`
   - The admin panel shows the student URL and a QR code to share
5. **Students connect** to your hotspot Wi-Fi and go to `http://192.168.2.1:3000/`

> **Note:** Your hotspot IP is usually `192.168.2.1` on macOS. The admin dashboard will show the correct IP automatically.

---

### Option 2: Cloudflare Quick Tunnel (No account needed)

Works if the school network allows device-to-device traffic, or as a fallback.

1. Start the server: `npm install && npm start`
2. In a separate terminal:
   ```bash
   npx cloudflared tunnel --url http://localhost:3000
   ```
3. Copy the generated URL (e.g., `https://random-words.trycloudflare.com`)
4. Set it as the tunnel URL so the admin panel can display it:
   ```bash
   TUNNEL_URL=https://random-words.trycloudflare.com npm start
   ```
5. Room screen: `[tunnel-url]/room` — Students use: `[tunnel-url]/`

---

### Option 3: DreamHost Python Server

For a cloud-hosted session accessible from anywhere.

1. Upload the project to your DreamHost server
2. Install dependencies: `pip install -r requirements.txt`
3. Start: `python server.py`
4. Students access via your domain: `https://yourdomain.com/game/pixel-poke/student`

> The Python server uses polling instead of WebSockets. The room screen will auto-detect this and poll every 500ms — nearly real-time for a classroom.

---

## Admin Dashboard

Open `/admin` to access the full teacher control panel:

- **Network Setup** — shows student URL, room URL, and a QR code
- **Canvas Preview** — live miniature view of the current canvas
- **Session Stats** — total pixels, unique students, elapsed time
- **Student Leaderboard** — ranked by pixel count
- **Controls:** Clear canvas, Pause/Resume, Broadcast message to room screen
- **Event Log** — last 50 pixel events

---

## Adding a New Game

1. Create `public/games/your-game-name/student.html` and `room.html`
2. Add a route in `server.js`:
   ```js
   app.post('/game/your-game-name/action', (req, res) => { ... });
   ```
3. Update the default redirect in `server.js` (line near `GET /`) to point to your new game

Games follow the same pattern: student page → POST to server → server broadcasts → room screen updates.
