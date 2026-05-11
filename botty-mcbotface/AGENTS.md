# Botty McBotface

Grid-based bot programming game. Students write Python to control a robot that collects items and competes in tournaments. See the root `AGENTS.md` for project-wide context and game mechanics overview.

## Files

| File | Purpose |
|------|---------|
| `engine.js` | `Grid`, `Bot`, `GameEngine` classes + `createSounds()` — loaded as a plain `<script>` (global) |
| `levels.js` | `LEVELS` array (7 tutorial levels) + `generateRandomGrid()` — loaded as a plain `<script>` (global) |
| `shared.css` | Shared retro styles — all three pages link this |
| `student.html` | Student page: name picker, emoji picker, CodeMirror editor, Skulpt execution, grid preview, submit |
| `room.html` | Match display: full-screen grid, scoreboard, Cerebras commentary, ElevenLabs TTS |
| `admin.html` | Admin panel: create tournament, manage approved names, view bots, queue matches |

## Supabase

All three pages use the same client setup:

```javascript
const SUPABASE_URL = 'https://facwrgpgbffgrriolgcy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...'; // publishable, safe in frontend
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: 'code_mob' } });
```

Tables (all in `code_mob` schema): `bmb_tournaments`, `bmb_bots`, `bmb_match_queue`, `bmb_approved_names`.

The `code_mob` schema is set at client creation — all `.from('bmb_*')` calls omit the schema prefix.

**RPCs called by students/room (not admin):**
- `db.rpc('submit_bmb_bot', { p_tournament_id, p_student_name, p_bot_name, p_bot_emoji, p_code })` — validates approved name, enforces bot limit, handles versioning
- `db.rpc('complete_bmb_match', { p_match_id, p_winner_bot_id, p_results })` — records result, updates win/loss/collected on all bots in the match

Admin writes directly with the anon key (no Edge Function). The migration grants anon INSERT+UPDATE on `bmb_tournaments`, INSERT+DELETE on `bmb_approved_names`, and INSERT+DELETE+UPDATE on `bmb_match_queue`.

## Engine API (`engine.js`)

Loaded as a global script — `Grid`, `Bot`, `GameEngine`, `createSounds`, `LEVELS`, `generateRandomGrid` are all globals.

### `Grid(width, height)`
- `cells[y][x]` — `{ wall: bool, item: string|null }`
- `isWall(x, y)`, `getItem(x, y)`, `removeItem(x, y)`, `setWall(x, y)`, `placeItem(x, y, emoji)`
- `countGoodItems()`

### `Bot(id, name, emoji, x, y, dir, startingEnergy)`
- `dir` — `0=up 1=right 2=down 3=left`
- `energy`, `collected`, `alive`, `powerUp` (`null | 'star' | 'mushroom'`), `powerUpMoves`
- `facing()` → `{ x, y }` — cell in front of bot

### `GameEngine(grid, bots, opts)`
- `opts`: `{ maxTurns: 200 }`
- `processMove(bot)` — moves bot forward, handles walls/bots/items/power-ups, returns event object
- `processTurn(bot, n, direction)` — turns bot n times left/right
- `lookResult(bot, relDir)` → `''|'wall'|'good'|'bad'|'power'`
  - `relDir` is `'forward'|'left'|'right'`
- `isFinished()`, `getScoreboard()`, `getWinner()`
- `events` — array of event objects pushed after each action; each has `{ botId, botName, botEmoji, type, detail? }`

**Event types:** `move`, `turn`, `hit_wall`, `collect_good`, `collect_bad`, `collect_star`, `collect_mushroom`, `star_steal`, `mushroom_steal`

### `createSounds()`
Returns a sounds object: `{ move(), turn(), collectGood(), collectBad(), hitWall(), starPower(), mushroomPower(), steal(), gameOver() }`. Uses Web Audio API — call after a user gesture.

## Skulpt Suspension Pattern

Both `student.html` and `room.html` use Skulpt's suspension mechanism so `look()` always sees current game state. Bot API functions suspend Python execution, the JS game loop processes one action, updates the engine, then resumes.

**Single-bot (student.html):**

```javascript
// Shared signal between Python execution and the JS game loop
let actionResolve = null;
let pendingAction = null;

function makeSuspend(type, params) {
  pendingAction = { type, ...params };
  return new Sk.misceval.promiseToSuspension(
    new Promise(resolve => { actionResolve = resolve; })
  );
}

Sk.builtins.move = new Sk.builtin.func(() => makeSuspend('move', {}));
Sk.builtins.turn_left = new Sk.builtin.func(n => {
  const turns = n !== undefined ? Sk.ffi.remapToJs(n) : 1;
  return makeSuspend('turn', { direction: 'left', turns });
});
Sk.builtins.look = new Sk.builtin.func((arg) => {
  const dir = arg ? Sk.ffi.remapToJs(arg) : 'forward';
  return new Sk.builtin.str(engine.lookResult(currentBot, dir));
  // look() does NOT suspend — it reads engine state synchronously
});
```

The game loop calls `actionResolve()` to resume Python after processing each action.

**Multi-bot (room.html):** Each bot has its own `state` object (`{ bot, signalResolve, pendingAction }`). `currentBotIdx` tracks which bot is active during the round-robin tick. `Sk.builtins.*` closures capture `currentBotIdx` at call time.

## Student Page (`student.html`)

**localStorage keys** (all keyed by student name to avoid collisions):
- `bmb-student-name` — persists last-used name across sessions
- `bmb-bot-emoji-${STUDENT_NAME}` — persists selected bot emoji
- `bmb-code-${STUDENT_NAME}-${TOURNAMENT_ID}-${levelId}` — code per student/tournament/level

**Level loading flow:**
1. Read `LEVELS` array from `levels.js` (global)
2. Call `level.generate(grid, bot)` to place items/walls and set bot start position
3. Render grid into `#game-grid` using CSS grid; cells are `div.cell` elements
4. Show tutorial steps in sidebar if the level has `steps`

**Submit flow:** calls `db.rpc('submit_bmb_bot', ...)`, shows feedback, updates submit button state. Submit is only enabled when a tournament is active and the student has run their code at least once.

**Starter code** shown in the editor on first visit (no saved code):
```python
for i in range(5):
    move()
```

## Room Page (`room.html`)

**Match execution flow:**
1. Subscribe to `bmb_match_queue` for `status = 'pending'` rows (Supabase realtime)
2. When a match arrives: update row to `status = 'playing'`, fetch bot records
3. Generate grid from `tournamentConfig` (grid size, item counts, walls, power-ups)
4. Place bots at random non-wall, non-overlapping positions
5. Run each bot's code via Skulpt (one `Sk.importMainWithBody` per bot) — each suspends on first action
6. Round-robin tick: for each alive bot, signal it, wait for its `pendingAction`, process in engine, animate, delay `MATCH_SPEED_MS` (200ms)
7. After each tick, call `renderGrid()` and `renderScoreboard()`
8. When `engine.isFinished()`: call `db.rpc('complete_bmb_match', ...)`, trigger end-of-match commentary

**Commentary (Cerebras + ElevenLabs):**
- API keys via URL params: `?cerebras=KEY&elevenlabs=KEY` — stored to localStorage on first load
- `getKey('cerebras', 'bmb_cerebras_key')` pattern reads param then falls back to localStorage
- Commentary only fires for notable events: `hit_wall`, `collect_*`, `star_steal`, `mushroom_steal`
- 5-second cooldown between commentary lines; no cooldown at match end
- ElevenLabs voice ID: `YOq2y2Up4RgXP2HyXjE5` (Xavier), model: `eleven_flash_v2_5`
- Cerebras model: `llama3.1-8b`

**Cell size calculation:**
```javascript
function computeCellSize() {
  const availW = window.innerWidth - 280 - 40; // 280 = scoreboard, 40 = padding
  const availH = window.innerHeight - 56 - 40; // 56 = header
  return Math.max(24, Math.floor(Math.min(availW / grid.width, availH / grid.height)));
}
```

## Conventions

- `engine.js` and `levels.js` are loaded as plain `<script>` tags before the page script — they expose globals, not ES modules. Don't add `import`/`export`.
- All pages use the shared `escapeHtml(s)` helper before inserting user data into innerHTML.
- The `feedback(id, msg, type)` helper in admin and student pages shows a timed message (`type` is `'ok'` or `'err'`).
- Emoji in cells: walls render as a dark `wall` CSS class (no emoji), items render their emoji directly, bots render their emoji with a direction arrow overlay.
- Power-up visual: star bots get a `bot-star` CSS class (gold glow animation), mushroom bots get `bot-mushroom` (larger font size).
