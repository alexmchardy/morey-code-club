# code-mob

A classroom platform where students write JavaScript to affect a shared room screen in real time.

## Current Game: Pixel Poke

Students paint a shared 40×40 pixel canvas using `drawPixel(x, y, color)`. The room screen updates live as pixels arrive.

---

## Setup with Supabase (Recommended)

No local server needed — students only require internet access, not a shared Wi-Fi network.

### 1. Create a Supabase project

Go to [https://supabase.com](https://supabase.com) and create a free project.

### 2. Run the schema

In the Supabase SQL Editor, paste and run the contents of:
```
supabase/migrations/20260322000000_code_mob.sql
```

This creates the `code_mob` schema with tables, RLS policies, Realtime publication, and the `submit_pixel()` function.

### 3. Configure the static files

In `static/student.html`, `static/room.html`, and `static/admin.html`, replace the config block at the top of each `<script>`:

```javascript
const SUPABASE_URL      = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

Find your URL and anon key in: **Supabase Dashboard → Project Settings → API**

### 4. Deploy the admin Edge Function

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy code-mob-admin
supabase secrets set ADMIN_TOKEN=your-chosen-password
```

Also set the EDGE_FN_URL in `static/admin.html`:
```javascript
const EDGE_FN_URL = 'https://YOUR_PROJECT.supabase.co/functions/v1/code-mob-admin';
```

### 5. Deploy the static files

Push to GitHub — the morey-code-club GitHub Pages site auto-deploys `main`.

Static files are served at:
- Student: `https://mcc.alexmchardy.net/code-mob/static/student.html`
- Room: `https://mcc.alexmchardy.net/code-mob/static/room.html`
- Admin: `https://mcc.alexmchardy.net/code-mob/static/admin.html`

### 6. Run a session

1. Teacher opens `static/admin.html`, enters the admin token
2. Click **New Session** — a session row is created in Supabase
3. Open `static/room.html` on the projector — it auto-connects
4. Share the student URL (or QR code from admin panel) with students
5. Students open `static/student.html` on any device with internet

---

## Admin Dashboard

Open `static/admin.html` to access the teacher control panel:

- **Share & Setup** — admin token, student URL, QR code
- **Canvas Preview** — live miniature view of the current canvas
- **Session Stats** — total pixels, unique students, elapsed time
- **Student Leaderboard** — ranked by pixel count
- **Controls:** New Session, Pause/Resume, Clear canvas, Broadcast message
- **Event Log** — last 50 pixel events

---

## Advanced: Local Server (Offline / No Internet)

Use this if the classroom has no internet access.

### Option 1: MacBook Hotspot

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
3. **Open the room screen:** `http://192.168.2.1:3000/room`
4. **Open the admin dashboard:** `http://192.168.2.1:3000/admin`
5. **Students connect** to your hotspot Wi-Fi and go to `http://192.168.2.1:3000/`

> **Note:** Your hotspot IP is usually `192.168.2.1` on macOS.

---

### Option 2: Cloudflare Quick Tunnel

Works if the school network allows device-to-device traffic.

1. Start the server: `npm install && npm start`
2. In a separate terminal:
   ```bash
   npx cloudflared tunnel --url http://localhost:3000
   ```
3. Copy the generated URL (e.g., `https://random-words.trycloudflare.com`)
4. Set it as the tunnel URL:
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

> The Python server uses polling instead of WebSockets.

---

## Adding a New Game

1. Create `public/games/your-game-name/student.html` and `room.html`
2. Add a route in `server.js`
3. For Supabase: create a new schema migration and Edge Function following the `code_mob` pattern

Games follow the same pattern: student page → write to Supabase → Realtime → room screen updates.
