# code-mob

A classroom platform where students write JavaScript to affect a shared room screen in real time. The teacher controls the session from an admin dashboard; the room screen is shown on a projector.

## Current Game: Pixel Poke

Students paint a shared 40×40 pixel canvas using `drawPixel(x, y, color)` and read pixel ownership with `getPixel(x, y)`. The room screen updates live via Supabase Realtime.

---

## Architecture

```
Students (any device with internet)
  → static/student.html
    → db.rpc('submit_pixel')        ← Postgres SECURITY DEFINER fn
      → upserts pixels + students
        → Supabase Realtime → room.html

Teacher
  → static/admin.html
    → reads state via anon SELECT + Realtime
    → admin actions → supabase/functions/code-mob-admin/ (ADMIN_TOKEN)

Room screen (projector)
  → static/room.html
    → SELECT initial state on load
    → Realtime: pixels INSERT/UPDATE, sessions UPDATE/INSERT
```

## Directory Structure

```
code-mob/
├── static/                         # GitHub Pages static files (primary)
│   ├── student.html                # Student coding interface
│   ├── room.html                   # Projector / room screen
│   ├── admin.html                  # Teacher control panel
│   └── shared.css                  # Shared styles (copy of public/shared.css)
├── public/                         # Local server fallback (legacy)
│   ├── admin.html
│   ├── shared.css
│   └── games/pixel-poke/
│       ├── student.html
│       └── room.html
├── server.js                       # Express local server (offline fallback)
├── server.py                       # Python server alternative
└── README.md
```

Supabase config lives at the **repo root**, not inside `code-mob/`:
```
supabase/
├── config.toml
├── migrations/
│   └── 20260322231039_code_mob.sql   # Tables, RLS, submit_pixel(), Realtime
└── functions/
    └── code-mob-admin/
        └── index.ts                  # Deno Edge Function (admin actions)
```

---

## Database Schema (`code_mob` schema)

### Tables

| Table | Key columns |
|-------|-------------|
| `sessions` | `id` (UUID PK), `game`, `paused`, `started_at`, `cleared_at`, `broadcast_msg`, `broadcast_at` |
| `pixels` | `(session_id, x, y)` PK, `color`, `student_name`, `painted_at` |
| `students` | `(session_id, name)` PK, `pixel_count`, `last_seen` |

All three tables have `REPLICA IDENTITY FULL` and are in the `supabase_realtime` publication.

### RLS

Anon role can `SELECT` everything. All writes go through:
- `submit_pixel()` — SECURITY DEFINER RPC (called by `student.html`)
- `code-mob-admin` Edge Function — service role (called by `admin.html`)

### `submit_pixel(p_session_id, p_x, p_y, p_color, p_student_name)`

Validates session exists and is not paused, validates color, upserts pixel and atomically increments student pixel count. Returns `{ok, pixelCount}` or `{error}`.

---

## Static Files

All three files share the same Supabase config block at the top of `<script>`:

```javascript
const SUPABASE_URL      = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: 'code_mob' } });
```

### student.html

- Prompts for a code name (no spaces, max 20 chars) → stored as `NAME`
- CodeMirror 5 editor with 4 challenges; code saved to `localStorage` per challenge
- Ghost text autocomplete: typing `dr`…`drawPixel` shows inline ghost, Tab accepts → `drawPixel()` with arg ghost `x, y, "color"` inside parens
- **Provided functions** (called by student code):
  - `async drawPixel(x, y, color)` — submits pixel via `submit_pixel()` RPC; updates local preview grid
  - `getPixel(x, y)` — sync; returns current pixel owner name from local `_pixelOwners` map (kept in sync via Realtime)
- `_pixelOwners` is loaded on session start and kept up to date via Realtime INSERT/UPDATE/DELETE on `pixels`
- Broadcast messages from the teacher appear as a fixed overlay (yellow, 6s timeout)
- 500 pixel/run guard prevents infinite loop runaway

### room.html

- 40×40 CSS grid canvas; each cell is a `div.pixel-cell`
- Sidebar: two-section leaderboard (Pixels Painted vs Pixels Owned), Recent Events log
- Ticker bar at bottom: debounced paint events (800ms per student) and immediate overwrite events
- Name labels: per connected-component (8-connectivity BFS), placed above the top-left pixel of each grouping, `translateY(-100%)` — canvas has `padding-top: 20px` headroom so top-row labels aren't clipped
- 10-pixel grid lines overlay at 25%/50%/75% (x=10,20,30 / y=10,20,30) with coordinate labels
- Auto-switches to a new session when teacher creates one (Realtime INSERT on `sessions`)
- Paused overlay and broadcast overlay triggered by `sessions` UPDATE

### admin.html

- Admin token entered in UI, saved to `localStorage`
- Reads state via anon SELECT + same Realtime subscriptions as room.html
- Admin actions POST to `code-mob-admin` Edge Function with `{ action, token, sessionId, ... }`

---

## Edge Function (`code-mob-admin`)

Protected by `ADMIN_TOKEN` Supabase secret. Requires `Authorization: Bearer <ANON_KEY>` header (Supabase gateway requirement even with `verify_jwt = false`).

| Action | Effect |
|--------|--------|
| `new_session` | INSERT into `sessions` → room auto-reloads via Realtime |
| `pause_toggle` | Flip `sessions.paused` |
| `clear` | DELETE `pixels` + `students`, UPDATE `cleared_at` |
| `broadcast` | UPDATE `broadcast_msg` + `broadcast_at` |

---

## Conventions

- **Static files are the primary target** — `public/` and server files are a legacy offline fallback; do not update them unless specifically asked
- All state is in Supabase; the static files are stateless except for `localStorage` (code saves, admin token)
- The `code_mob` Postgres schema isolates this game; future games get their own schema
- Student-facing code uses simple JavaScript patterns — avoid `async/await` in the student API where sync is possible (e.g. `getPixel` is sync), keep challenge starters beginner-friendly
- Colors: named set (`cyan`, `pink`, `yellow`, `green`, `red`, `purple`, `white`, `orange`) plus any hex code

## Known Supabase Setup Notes

- `code_mob` must be added to **Project Settings → API → Extra schemas** for PostgREST queries to work
- Run `GRANT USAGE ON SCHEMA code_mob TO anon, authenticated, service_role;` and `GRANT SELECT ON ALL TABLES IN SCHEMA code_mob TO anon;` if permission errors occur
- `ALTER PUBLICATION supabase_realtime ADD TABLE code_mob.pixels;` (and `students`, `sessions`) is required for Realtime to fire on these tables
