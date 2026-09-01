# Times Tables FSRS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an adaptive "default" FSRS spaced-repetition practice mode to `math/times-tables.html`, collapse the existing manual practice controls under the `GO!` button, and share one persistent per-student "Included tables" filter between both modes.

**Architecture:** Everything stays inline in the single existing HTML file, per this repo's self-contained-app convention. The `<script>` tag becomes `type="module"` so it can `import` `ts-fsrs` from a CDN URL, matching how `canvas-confetti` is already loaded from a CDN. New pure logic (card keys, deck storage, rating derivation, question selection) is added as plain functions inside that same script, in a clearly delimited block, then wired into the existing setup/practice/results flow.

**Tech Stack:** Vanilla HTML/CSS/JS (no build tools), `ts-fsrs` via `https://cdn.jsdelivr.net/npm/ts-fsrs@latest/+esm`, `localStorage`.

**Spec:** `docs/superpowers/specs/2026-08-31-times-tables-fsrs-design.md`

## Global Constraints

- Card key format: unordered pair, `"<min>x<max>"` (e.g. `7x8`, never `8x7`).
- Deck membership rule: pair `(i,j)` eligible if `i` in `includedTables` **or** `j` in `includedTables`.
- New student default: `includedTables = [1,2,3,4,5,6,7,8,9,10,11,12]`.
- Rating: any wrong try before correct → `Again`. Correct first try → band vs. `avgCorrectMs`: no baseline yet → `<3000ms` Easy, `3000-8000ms` Good, `>8000ms` Hard; with baseline → `<0.6x avg` Easy, `0.6x-1.5x avg` Good, `>1.5x avg` Hard. EWMA update on correct-first-try only: `avg = avg == null ? elapsed : avg*0.7 + elapsed*0.3`.
- New-card cap: 10 per 20-question block. Checkpoint: every 20 answered questions (either mode counts toward this only in default mode).
- Mastery buckets: `New` (state New) / `Learning` (state Learning or Relearning) / `Review` (state Review, stability `< 21`) / `Mastered` (state Review, stability `>= 21`).
- Per-table breakdown: a card contributes to **both** of its factors' rows.
- No new files. No build step. No explicit self-rating UI.

---

## File Map

```
math/
└── times-tables.html   # single file — all changes happen here
```

No other files are created. `math/AGENTS.md` gets a short update in the final task.

---

## Task 1: FSRS Module Import and Pure Card-Key Helpers

**Files:**
- Modify: `math/times-tables.html` (`<script>` tag and new helper block at the top of the script)

**Interfaces:**
- Produces: `cardKey(a, b) -> string`, `pairFromKey(key) -> {lo, hi}`, `isEligible(key, includedTables) -> boolean`, `allPossibleKeys() -> string[]` (78 entries), plus module-level bindings `createEmptyCard`, `fsrs`, `Rating`, `State` imported from `ts-fsrs`.

- [ ] **Step 1: Change the script tag to a module and import ts-fsrs**

Find the opening tag:

```html
  <script>
    const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
```

Replace with:

```html
  <script type="module">
    import * as tsFsrs from 'https://cdn.jsdelivr.net/npm/ts-fsrs@latest/+esm';
    const { createEmptyCard, fsrs, Rating, State } = tsFsrs;

    const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
```

- [ ] **Step 2: Add the card-key helpers**

Immediately after the `const HARD_TABLES = [6, 7, 8, 9, 12];` line, add:

```javascript
    // ── FSRS card keys ──
    function cardKey(a, b) {
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      return `${lo}x${hi}`;
    }

    function pairFromKey(key) {
      const [lo, hi] = key.split('x').map(Number);
      return { lo, hi };
    }

    function isEligible(key, includedTables) {
      const { lo, hi } = pairFromKey(key);
      return includedTables.includes(lo) || includedTables.includes(hi);
    }

    function allPossibleKeys() {
      const keys = [];
      for (let i = 1; i <= 12; i++) {
        for (let j = i; j <= 12; j++) {
          keys.push(cardKey(i, j));
        }
      }
      return keys;
    }
```

- [ ] **Step 3: Verify in the browser console**

Open `math/times-tables.html` in a browser, open devtools console, and run:

```javascript
cardKey(7, 8) === cardKey(8, 7)          // true
cardKey(7, 8)                            // "7x8"
isEligible('7x8', [8])                   // true
isEligible('7x1', [8])                   // false
allPossibleKeys().length                 // 78
```

Also confirm the page loads with no console errors (the `import` resolving successfully is the main risk here — check the Network tab shows the `+esm` request succeeding).

- [ ] **Step 4: Commit**

```bash
git add math/times-tables.html
git commit -m "feat(times-tables): import ts-fsrs and add card-key helpers"
```

---

## Task 2: Per-Student Deck Storage

**Files:**
- Modify: `math/times-tables.html` (new storage block, placed after the card-key helpers from Task 1)

**Interfaces:**
- Consumes: `createEmptyCard` (Task 1 import), `allPossibleKeys`, `isEligible` (Task 1).
- Produces: `getStudentDeck(name) -> { includedTables: number[], cards: object }`, `saveStudentDeck(name, deck)`, `syncEligibleCards(deck)`, `serializeCard(card)`, `deserializeCard(raw)`.

- [ ] **Step 1: Add the storage functions**

Add after the Task 1 helpers:

```javascript
    // ── FSRS deck storage ──
    const FSRS_STORAGE_KEY = 'tt-fsrs-cards';

    function loadFsrsData() {
      try { return JSON.parse(localStorage.getItem(FSRS_STORAGE_KEY)) || {}; }
      catch { return {}; }
    }

    function saveFsrsData(data) {
      localStorage.setItem(FSRS_STORAGE_KEY, JSON.stringify(data));
    }

    function serializeCard(card) {
      return {
        ...card,
        due: card.due.toISOString(),
        last_review: card.last_review ? card.last_review.toISOString() : null,
      };
    }

    function deserializeCard(raw) {
      return {
        ...raw,
        due: new Date(raw.due),
        last_review: raw.last_review ? new Date(raw.last_review) : undefined,
      };
    }

    function syncEligibleCards(deck) {
      allPossibleKeys().forEach(key => {
        if (isEligible(key, deck.includedTables) && !deck.cards[key]) {
          deck.cards[key] = serializeCard(createEmptyCard());
        }
      });
    }

    function getStudentDeck(name) {
      const data = loadFsrsData();
      if (!data[name]) {
        data[name] = { includedTables: [...TABLES], cards: {} };
      }
      syncEligibleCards(data[name]);
      saveFsrsData(data);
      return data[name];
    }

    function saveStudentDeck(name, deck) {
      const data = loadFsrsData();
      data[name] = deck;
      saveFsrsData(data);
    }
```

- [ ] **Step 2: Verify in the browser console**

Reload the page, then in devtools console:

```javascript
const deck = getStudentDeck('Test Student');
deck.includedTables.length              // 12
Object.keys(deck.cards).length           // 78 (all tables included by default)
deck.cards['7x8'].due                    // an ISO date string, close to "now"

// Restrict to table 8 only, re-fetch as a fresh student to see lazy creation:
localStorage.removeItem('tt-fsrs-cards');
let data = loadFsrsData();
data['Restricted'] = { includedTables: [8], cards: {} };
saveFsrsData(data);
const deck2 = getStudentDeck('Restricted');
Object.keys(deck2.cards).length          // 12 (8x1..8x8..8x12, "8x8" counted once)
Object.keys(deck2.cards).includes('7x8') // true (8 is eligible)
Object.keys(deck2.cards).includes('1x7') // false (neither 1 nor 7 is included)
```

- [ ] **Step 3: Clean up test data and commit**

```javascript
localStorage.removeItem('tt-fsrs-cards');
```

```bash
git add math/times-tables.html
git commit -m "feat(times-tables): add per-student FSRS deck storage"
```

---

## Task 3: Rating Derivation and Review Recording

**Files:**
- Modify: `math/times-tables.html` (new block after Task 2's storage functions)

**Interfaces:**
- Consumes: `fsrs`, `Rating` (Task 1 import), `deserializeCard`, `serializeCard` (Task 2).
- Produces: `recordAnswer(deck, key, wrongTries, elapsedMs, now?) -> { rating, card }` — updates `deck.cards[key]` in place (caller must still call `saveStudentDeck`).

- [ ] **Step 1: Add the scheduler and rating functions**

```javascript
    // ── FSRS rating derivation ──
    const scheduler = fsrs();

    function deriveRating(card, wrongTries, elapsedMs) {
      if (wrongTries > 0) return Rating.Again;
      const avg = card.avgCorrectMs ?? null;
      if (avg == null) {
        if (elapsedMs < 3000) return Rating.Easy;
        if (elapsedMs <= 8000) return Rating.Good;
        return Rating.Hard;
      }
      if (elapsedMs < avg * 0.6) return Rating.Easy;
      if (elapsedMs <= avg * 1.5) return Rating.Good;
      return Rating.Hard;
    }

    function nextAvg(card, wrongTries, elapsedMs) {
      if (wrongTries > 0) return card.avgCorrectMs ?? null;
      const avg = card.avgCorrectMs ?? null;
      return avg == null ? elapsedMs : avg * 0.7 + elapsedMs * 0.3;
    }

    function recordAnswer(deck, key, wrongTries, elapsedMs, now = new Date()) {
      const before = deserializeCard(deck.cards[key]);
      const rating = deriveRating(before, wrongTries, elapsedMs);
      const avgCorrectMs = nextAvg(before, wrongTries, elapsedMs);
      const { card: after } = scheduler.next(before, now, rating);
      after.avgCorrectMs = avgCorrectMs;
      deck.cards[key] = serializeCard(after);
      return { rating, card: after };
    }
```

- [ ] **Step 2: Verify in the browser console**

```javascript
const deck = getStudentDeck('Rating Test');
const key = '7x8';

// 1) A wrong try → Again, card enters Learning
let r1 = recordAnswer(deck, key, 1, 4000);
r1.rating === Rating.Again               // true
r1.card.state === State.Learning         // true
deck.cards[key].avgCorrectMs             // null (unchanged — wrong tries don't update avg)

// 2) Correct on first try, no baseline yet, 2000ms → fast fallback band → Easy
let r2 = recordAnswer(deck, key, 0, 2000);
r2.rating === Rating.Easy                // true
deck.cards[key].avgCorrectMs             // 2000

// 3) Correct on first try, 2500ms vs baseline 2000 → within 1.5x → Good
let r3 = recordAnswer(deck, key, 0, 2500);
r3.rating === Rating.Good                // true
deck.cards[key].avgCorrectMs             // 2150 (2000*0.7 + 2500*0.3)

// 4) Correct on first try, 500ms vs baseline 2150 → under 0.6x (1290) → Easy
let r4 = recordAnswer(deck, key, 0, 500);
r4.rating === Rating.Easy                // true
deck.cards[key].avgCorrectMs             // 1655 (2150*0.7 + 500*0.3)
```

- [ ] **Step 3: Clean up and commit**

```javascript
localStorage.removeItem('tt-fsrs-cards');
```

```bash
git add math/times-tables.html
git commit -m "feat(times-tables): add FSRS rating derivation and review recording"
```

---

## Task 4: Collapsible Setup Sections and Name-Only GO!

**Files:**
- Modify: `math/times-tables.html` (setup screen HTML, CSS, and the `updateStartBtn`/name-input wiring)

**Interfaces:**
- Produces: DOM ids `#manualToggle`, `#manualBody`, `#tablesToggle`, `#tablesBody`; module-level `let manualModeChosen = false;` flipped to `true` the first time `#manualToggle` is clicked.
- Consumes: nothing new from earlier tasks (independent of Tasks 1-3; can be done in parallel, but numbered here for a sane read-through order).

- [ ] **Step 1: Add collapsible section CSS**

Add after the `.select-shortcuts` / `.shortcut-btn` rules (right before the `/* ── PRACTICE ── */` comment):

```css
    .collapsible {
      margin-bottom: 16px;
    }
    .collapsible-toggle {
      font-family: 'Cause', sans-serif;
      font-size: 14px;
      font-weight: 600;
      width: 100%;
      text-align: left;
      padding: 12px 14px;
      border: 2px solid var(--border);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text-dim);
      cursor: pointer;
      transition: all 0.15s;
    }
    .collapsible-toggle:hover {
      border-color: var(--accent);
      color: var(--text);
    }
    .collapsible-toggle .arrow {
      display: inline-block;
      transition: transform 0.15s;
      margin-right: 6px;
    }
    .collapsible.open .collapsible-toggle .arrow {
      transform: rotate(90deg);
    }
    .collapsible-body {
      display: none;
      padding-top: 14px;
    }
    .collapsible.open .collapsible-body {
      display: block;
    }

    body.light .collapsible-toggle {
      background: #fff;
      border-color: rgba(0,0,0,0.12);
      color: #888;
    }
    body.light .collapsible-toggle:hover {
      border-color: var(--accent);
      color: #444;
    }
```

- [ ] **Step 2: Restructure the setup screen HTML**

Replace this whole block:

```html
      <div class="section-label">Pick your tables</div>
      <div class="select-shortcuts">
        <button class="shortcut-btn" data-action="all">All</button>
        <button class="shortcut-btn" data-action="none">None</button>
        <button class="shortcut-btn" data-action="hard">Hard ones</button>
      </div>
      <div class="table-grid" id="tableGrid"></div>

      <div class="section-label">Mode</div>
      <div class="mode-row">
        <button class="mode-btn selected" data-mode="count"># of Questions</button>
        <button class="mode-btn" data-mode="timed">Timed Race</button>
      </div>

      <div class="mode-config" id="modeConfig">
        <div id="countConfig">
          <label>How many questions?</label>
          <input type="number" id="questionCount" value="20" min="5" max="100" step="5">
        </div>
        <div id="timedConfig" style="display:none">
          <label>How long?</label>
          <div class="time-options" id="timeOptions"></div>
        </div>
      </div>

      <button class="start-btn" id="startBtn" disabled>GO!</button>
```

With:

```html
      <button class="start-btn" id="startBtn" disabled>GO!</button>

      <div class="collapsible" id="manualCollapsible">
        <button class="collapsible-toggle" id="manualToggle" type="button">
          <span class="arrow">&#9656;</span>Manual practice
        </button>
        <div class="collapsible-body" id="manualBody">
          <div class="section-label">Mode</div>
          <div class="mode-row">
            <button class="mode-btn selected" data-mode="count"># of Questions</button>
            <button class="mode-btn" data-mode="timed">Timed Race</button>
          </div>

          <div class="mode-config" id="modeConfig">
            <div id="countConfig">
              <label>How many questions?</label>
              <input type="number" id="questionCount" value="20" min="5" max="100" step="5">
            </div>
            <div id="timedConfig" style="display:none">
              <label>How long?</label>
              <div class="time-options" id="timeOptions"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="collapsible" id="tablesCollapsible">
        <button class="collapsible-toggle" id="tablesToggle" type="button">
          <span class="arrow">&#9656;</span>Included tables
        </button>
        <div class="collapsible-body" id="tablesBody">
          <div class="select-shortcuts">
            <button class="shortcut-btn" data-action="all">All</button>
            <button class="shortcut-btn" data-action="none">None</button>
            <button class="shortcut-btn" data-action="hard">Hard ones</button>
          </div>
          <div class="table-grid" id="tableGrid"></div>
        </div>
      </div>
```

- [ ] **Step 3: Wire the collapsible toggles and the manual-mode flag**

Add near the top of the script, with the other `let` state declarations:

```javascript
    let manualModeChosen = false;
```

Add after the DOM refs block (near `const startBtn = ...`), a new block:

```javascript
    // ── Collapsible sections ──
    document.getElementById('manualToggle').addEventListener('click', () => {
      manualModeChosen = true;
      document.getElementById('manualCollapsible').classList.toggle('open');
    });
    document.getElementById('tablesToggle').addEventListener('click', () => {
      document.getElementById('tablesCollapsible').classList.toggle('open');
    });
```

- [ ] **Step 4: Make GO! require only a name**

Find:

```javascript
    function updateStartBtn() {
      startBtn.disabled = selectedTables.size === 0 || !currentPlayer;
    }
```

Replace with:

```javascript
    function updateStartBtn() {
      startBtn.disabled = !currentPlayer;
    }
```

- [ ] **Step 5: Verify in the browser**

Open the page. Confirm:
- Typing a name enables `GO!` immediately, with both "Manual practice" and "Included tables" collapsed and no table selection required.
- Clicking "Manual practice" expands it (arrow rotates) and reveals the mode/config controls; clicking again collapses it.
- Clicking "Included tables" expands the table grid and shortcuts independently of the Manual practice section.
- No console errors.

- [ ] **Step 6: Commit**

```bash
git add math/times-tables.html
git commit -m "feat(times-tables): collapse manual mode and table picker under GO!"
```

---

## Task 5: Wire Included Tables to Persistent Per-Student Storage

**Files:**
- Modify: `math/times-tables.html` (table-grid build logic, shortcut buttons, and name-selection handlers)

**Interfaces:**
- Consumes: `getStudentDeck`, `saveStudentDeck`, `syncEligibleCards` (Task 2).
- Produces: module-level `let currentDeck = null;` (the loaded deck for whichever name is currently entered/selected), kept in sync with `deck.includedTables` whenever the table grid changes.

- [ ] **Step 1: Add `currentDeck` state and a loader**

Add near `let manualModeChosen = false;`:

```javascript
    let currentDeck = null;

    function loadDeckForCurrentPlayer() {
      if (!currentPlayer) {
        currentDeck = null;
        return;
      }
      currentDeck = getStudentDeck(currentPlayer);
      renderTableGrid();
    }
```

- [ ] **Step 2: Replace the static table-button builder with one driven by `currentDeck.includedTables`**

Find:

```javascript
    // ── Build table buttons ──
    TABLES.forEach(n => {
      const btn = document.createElement('button');
      btn.className = 'table-btn';
      btn.textContent = n + 's';
      btn.addEventListener('click', () => {
        if (selectedTables.has(n)) {
          selectedTables.delete(n);
          btn.classList.remove('selected');
        } else {
          selectedTables.add(n);
          btn.classList.add('selected');
        }
        updateStartBtn();
      });
      tableGrid.appendChild(btn);
    });
```

Replace with:

```javascript
    // ── Build table buttons ──
    function renderTableGrid() {
      tableGrid.innerHTML = '';
      const included = currentDeck ? currentDeck.includedTables : [...TABLES];
      TABLES.forEach(n => {
        const btn = document.createElement('button');
        btn.className = 'table-btn' + (included.includes(n) ? ' selected' : '');
        btn.textContent = n + 's';
        btn.addEventListener('click', () => toggleTable(n, btn));
        tableGrid.appendChild(btn);
      });
    }

    function toggleTable(n, btn) {
      if (!currentDeck) return;
      const included = currentDeck.includedTables;
      const idx = included.indexOf(n);
      if (idx >= 0) {
        included.splice(idx, 1);
        btn.classList.remove('selected');
      } else {
        included.push(n);
        btn.classList.add('selected');
      }
      syncEligibleCards(currentDeck);
      saveStudentDeck(currentPlayer, currentDeck);
    }

    renderTableGrid();
```

- [ ] **Step 3: Update the shortcut buttons to act on `currentDeck.includedTables`**

Find:

```javascript
    // ── Shortcut buttons ──
    document.querySelectorAll('.shortcut-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const allBtns = tableGrid.querySelectorAll('.table-btn');
        if (action === 'all') {
          selectedTables = new Set(TABLES);
          allBtns.forEach(b => b.classList.add('selected'));
        } else if (action === 'none') {
          selectedTables.clear();
          allBtns.forEach(b => b.classList.remove('selected'));
        } else if (action === 'hard') {
          selectedTables = new Set(HARD_TABLES);
          allBtns.forEach((b, i) => {
            const n = TABLES[i];
            b.classList.toggle('selected', HARD_TABLES.includes(n));
          });
        }
        updateStartBtn();
      });
    });
```

Replace with:

```javascript
    // ── Shortcut buttons ──
    document.querySelectorAll('.shortcut-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!currentDeck) return;
        const action = btn.dataset.action;
        if (action === 'all') {
          currentDeck.includedTables = [...TABLES];
        } else if (action === 'none') {
          currentDeck.includedTables = [];
        } else if (action === 'hard') {
          currentDeck.includedTables = [...HARD_TABLES];
        }
        syncEligibleCards(currentDeck);
        saveStudentDeck(currentPlayer, currentDeck);
        renderTableGrid();
      });
    });
```

- [ ] **Step 4: Load the deck whenever the player name changes**

Find:

```javascript
    nameInput.addEventListener('input', () => {
      currentPlayer = nameInput.value.trim();
      renderSavedNames();
      updateStartBtn();
    });

    const lastPlayer = localStorage.getItem('tt-last-player') || '';
    if (lastPlayer) {
      currentPlayer = lastPlayer;
      nameInput.value = lastPlayer;
    }
    renderSavedNames();
    updateStartBtn();
```

Replace with:

```javascript
    nameInput.addEventListener('input', () => {
      currentPlayer = nameInput.value.trim();
      renderSavedNames();
      updateStartBtn();
      loadDeckForCurrentPlayer();
    });

    const lastPlayer = localStorage.getItem('tt-last-player') || '';
    if (lastPlayer) {
      currentPlayer = lastPlayer;
      nameInput.value = lastPlayer;
    }
    renderSavedNames();
    updateStartBtn();
    loadDeckForCurrentPlayer();
```

Also update the saved-name chip click handler — find:

```javascript
        chip.addEventListener('click', () => {
          currentPlayer = name;
          nameInput.value = name;
          renderSavedNames();
          updateStartBtn();
        });
```

Replace with:

```javascript
        chip.addEventListener('click', () => {
          currentPlayer = name;
          nameInput.value = name;
          renderSavedNames();
          updateStartBtn();
          loadDeckForCurrentPlayer();
        });
```

Also remove the now-unused `let selectedTables = new Set();` declaration and the `renderTableGrid();` call added in Step 2 should NOT run at module-eval time before `currentDeck` exists — delete that trailing standalone `renderTableGrid();` line from Step 2 (grid rendering now happens via `loadDeckForCurrentPlayer`, which is called once at startup in this step).

- [ ] **Step 5: Verify in the browser**

- Clear `localStorage` (`localStorage.clear()` in devtools), reload.
- Type a new name → table grid shows all 12 tables selected.
- Click "9s" to deselect it, reload the page, re-enter the same name → "9s" is still deselected (persisted).
- Click a previously-used name chip → its table selection loads correctly.
- `getStudentDeck('<name>').cards` in console still reflects prior card data after toggling tables (no cards deleted).

- [ ] **Step 6: Commit**

```bash
git add math/times-tables.html
git commit -m "feat(times-tables): persist included-tables selection per student"
```

---

## Task 6: Route Manual-Mode Answers Through the FSRS Pipeline

**Files:**
- Modify: `math/times-tables.html` (`checkAnswer` function and `startBtn` click handler's manual question generation)

**Interfaces:**
- Consumes: `cardKey`, `recordAnswer` (Tasks 1, 3), `currentDeck` (Task 5).
- Produces: each `questions[i]` object gains a `key` field (its FSRS card key); `checkAnswer` calls `recordAnswer` + `saveStudentDeck` on every submit, in both modes (default mode wiring lands in Task 7-8, but the shared call site is added here).

- [ ] **Step 1: Give generated questions a `key`**

Find:

```javascript
    // ── Generate a question ──
    function generateQuestion() {
      const tables = [...selectedTables];
      let a, b;
      const maxAttempts = 20;
      for (let i = 0; i < maxAttempts; i++) {
        a = tables[Math.floor(Math.random() * tables.length)];
        b = Math.floor(Math.random() * 12) + 1;
        if (!lastQuestion || a !== lastQuestion.a || b !== lastQuestion.b) break;
      }
      const q = { a, b, answer: a * b };
      lastQuestion = q;
      return q;
    }
```

Replace with:

```javascript
    // ── Generate a manual-mode question ──
    function generateQuestion() {
      const tables = currentDeck.includedTables.length > 0 ? currentDeck.includedTables : [...TABLES];
      let a, b;
      const maxAttempts = 20;
      for (let i = 0; i < maxAttempts; i++) {
        a = tables[Math.floor(Math.random() * tables.length)];
        b = Math.floor(Math.random() * 12) + 1;
        if (!lastQuestion || a !== lastQuestion.a || b !== lastQuestion.b) break;
      }
      const q = { a, b, answer: a * b, key: cardKey(a, b) };
      lastQuestion = q;
      return q;
    }
```

- [ ] **Step 2: Record every answer against the FSRS deck**

Find `checkAnswer`'s correct branch:

```javascript
      if (userAnswer === q.answer) {
        isTransitioning = true;
        correctCount++;
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        answerTimes.push(elapsed);

        perTable[q.a].correct++;
        perTable[q.a].total++;

        answerInput.classList.add('correct');
        spawnPlusOne();

        setTimeout(() => {
          isTransitioning = false;
          advance();
        }, 400);
      } else {
        wrongCount++;
        currentStreak = 0;
        wrongTriesForQuestion++;
        perTable[q.a].total++;

        answerInput.classList.add('wrong');
```

Replace with:

```javascript
      if (userAnswer === q.answer) {
        isTransitioning = true;
        correctCount++;
        currentStreak++;
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        answerTimes.push(elapsed);

        recordPerTable(q, true);
        recordAnswer(currentDeck, q.key, wrongTriesForQuestion, elapsed * 1000);
        saveStudentDeck(currentPlayer, currentDeck);

        answerInput.classList.add('correct');
        spawnPlusOne();

        setTimeout(() => {
          isTransitioning = false;
          advance();
        }, 400);
      } else {
        wrongCount++;
        currentStreak = 0;
        wrongTriesForQuestion++;
        recordPerTable(q, false);

        answerInput.classList.add('wrong');
```

- [ ] **Step 3: Add the `recordPerTable` helper (used above and by Task 9's dual-table breakdown)**

Add just above `function checkAnswer() {`:

```javascript
    function recordPerTable(q, correct) {
      [q.a, q.b].forEach(t => {
        if (!perTable[t]) perTable[t] = { correct: 0, total: 0 };
        perTable[t].total++;
        if (correct) perTable[t].correct++;
      });
    }
```

Note this replaces the old per-question `perTable[q.a].total++` bookkeeping — `recordPerTable` now updates **both** `q.a` and `q.b` rows, on every call (wrong tries call it once per wrong try too, matching the prior behavior of incrementing `.total` on each wrong try).

- [ ] **Step 4: Remove the now-redundant `perTable` pre-population in the start handler**

Find (inside the `startBtn` click handler):

```javascript
      selectedTables.forEach(t => {
        perTable[t] = { correct: 0, total: 0 };
      });
```

Delete this block — `recordPerTable` now creates entries lazily on first use, which is required anyway since default-mode sessions don't have a fixed `selectedTables` set.

- [ ] **Step 5: Verify in the browser**

- Start a Manual practice session (expand "Manual practice", pick "# of Questions", `GO!`).
- Answer a couple of questions correctly and a couple incorrectly (with retries).
- In devtools console mid-session or right after: `getStudentDeck(currentPlayerNameYouUsed).cards` (or re-run `getStudentDeck('<name>')`) shows updated `due`/`state`/`reps` for the keys you answered.
- Results screen still renders normally (per-table breakdown will now show both factors' rows incremented — full correctness of that display is verified in Task 9, but confirm nothing crashes here).

- [ ] **Step 6: Commit**

```bash
git add math/times-tables.html
git commit -m "feat(times-tables): route manual-mode answers through FSRS recording"
```

---

## Task 7: Default-Mode Question Selection

**Files:**
- Modify: `math/times-tables.html` (new selection block placed after Task 3's rating functions)

**Interfaces:**
- Consumes: `isEligible`, `pairFromKey` (Task 1), `deserializeCard` (Task 2), `State` (Task 1 import).
- Produces: `createSessionState() -> object`, `pickNextCard(deck, sessionState, now?) -> string|null` (a card key, or `null` when the deck has nothing due/new), `questionFromKey(key) -> {a, b, answer, key}` (randomizes display order).

- [ ] **Step 1: Add the selection functions**

```javascript
    // ── Default-mode question selection ──
    const NEW_CARD_CAP_PER_BLOCK = 10;

    function createSessionState() {
      return {
        introducedKeys: new Set(),   // new cards already shown this session
        newIntroducedInBlock: 0,     // resets every 20 questions (Task 8)
      };
    }

    function eligibleKeys(deck) {
      return Object.keys(deck.cards).filter(key => isEligible(key, deck.includedTables));
    }

    function dueReviewKeys(deck, now) {
      return eligibleKeys(deck)
        .map(key => ({ key, card: deserializeCard(deck.cards[key]) }))
        .filter(({ card }) => card.state !== State.New && card.due <= now)
        .sort((a, b) => a.card.due - b.card.due)
        .map(({ key }) => key);
    }

    function freshNewKeys(deck, sessionState) {
      return eligibleKeys(deck)
        .filter(key => deserializeCard(deck.cards[key]).state === State.New)
        .filter(key => !sessionState.introducedKeys.has(key));
    }

    function pickNextCard(deck, sessionState, now = new Date()) {
      const due = dueReviewKeys(deck, now);
      const fresh = freshNewKeys(deck, sessionState);

      if (due.length === 0 && fresh.length === 0) return null;

      const capReached = sessionState.newIntroducedInBlock >= NEW_CARD_CAP_PER_BLOCK;
      const introduceNew = fresh.length > 0 && !capReached && (due.length === 0 || Math.random() < 0.3);

      if (introduceNew) {
        const key = fresh[Math.floor(Math.random() * fresh.length)];
        sessionState.introducedKeys.add(key);
        sessionState.newIntroducedInBlock++;
        return key;
      }
      return due[0];
    }

    function questionFromKey(key) {
      const { lo, hi } = pairFromKey(key);
      const a = Math.random() < 0.5 ? lo : hi;
      const b = a === lo ? hi : lo;
      return { a, b, answer: a * b, key };
    }
```

- [ ] **Step 2: Verify in the browser console**

```javascript
localStorage.removeItem('tt-fsrs-cards');
const deck = getStudentDeck('Selection Test');   // all 78 cards, all New
const session = createSessionState();

const key1 = pickNextCard(deck, session);
key1 !== null                                    // true — plenty of new cards
session.introducedKeys.has(key1)                 // true
session.newIntroducedInBlock                     // 1

// Drain the cap:
for (let i = 0; i < 20; i++) pickNextCard(deck, session);
session.newIntroducedInBlock >= NEW_CARD_CAP_PER_BLOCK   // true (capped at 10)

// Mark every card as reviewed-and-not-due (simulate "nothing due, nothing new left"):
Object.keys(deck.cards).forEach(k => {
  const c = deserializeCard(deck.cards[k]);
  c.state = State.Review;
  c.due = new Date(Date.now() + 86400000); // due tomorrow
  deck.cards[k] = serializeCard(c);
});
session.introducedKeys = new Set(Object.keys(deck.cards)); // pretend all "new" ones were already shown
pickNextCard(deck, session)                      // null — nothing due or new
localStorage.removeItem('tt-fsrs-cards');
```

- [ ] **Step 3: Commit**

```bash
git add math/times-tables.html
git commit -m "feat(times-tables): add default-mode due/new card selection"
```

---

## Task 8: Default-Mode Session Flow (Checkpoints, GO! Branching)

**Files:**
- Modify: `math/times-tables.html` (practice screen HTML for the checkpoint modal/stop button, CSS, `startBtn` handler, `showQuestion`/`checkAnswer`/`advance`/`finishPractice`)

**Interfaces:**
- Consumes: `createSessionState`, `pickNextCard`, `questionFromKey` (Task 7), `manualModeChosen` (Task 4), `recordAnswer` (Task 3).
- Produces: module-level `let practiceMode = 'manual' | 'default';`, `let sessionState = null;`, `let questionsAnswered = 0;`.

- [ ] **Step 1: Add checkpoint modal and stop-now button markup**

Find the practice screen's closing tag:

```html
      <div class="help-row" id="helpRow"></div>
    </div>

    <!-- ── RESULTS SCREEN ── -->
```

Replace with:

```html
      <div class="help-row" id="helpRow"></div>
      <button class="shortcut-btn" id="stopNowBtn" style="display:none; margin: 16px auto 0; display:block;">Stop now</button>
    </div>

    <div class="checkpoint-overlay" id="checkpointOverlay" style="display:none">
      <div class="checkpoint-card">
        <h2>Nice work! &#127881;</h2>
        <div class="checkpoint-actions">
          <button class="play-again-btn" id="keepGoingBtn">Keep going</button>
          <button class="shortcut-btn" id="stopFromCheckpointBtn">Stop now</button>
        </div>
      </div>
    </div>

    <!-- ── RESULTS SCREEN ── -->
```

- [ ] **Step 2: Add checkpoint overlay CSS**

Add after the `.help-hint` / `@keyframes fadeIn` rules:

```css
    .checkpoint-overlay {
      position: fixed;
      inset: 0;
      background: rgba(10, 10, 46, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: 16px;
    }
    .checkpoint-card {
      background: var(--surface);
      border: 2px solid var(--accent);
      border-radius: 14px;
      padding: 28px;
      text-align: center;
      max-width: 360px;
      box-shadow: 0 0 30px rgba(0, 229, 255, 0.3);
    }
    .checkpoint-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    }

    body.light .checkpoint-card {
      background: #fff;
      border-color: var(--accent);
    }
```

- [ ] **Step 3: Add mode/session state and DOM refs**

Add near `let manualModeChosen = false;`:

```javascript
    let practiceMode = 'manual';
    let sessionState = null;
    let questionsAnswered = 0;
    const CHECKPOINT_SIZE = 20;
```

Add near the other DOM ref `const` declarations:

```javascript
    const stopNowBtn = document.getElementById('stopNowBtn');
    const checkpointOverlay = document.getElementById('checkpointOverlay');
    const keepGoingBtn = document.getElementById('keepGoingBtn');
    const stopFromCheckpointBtn = document.getElementById('stopFromCheckpointBtn');
```

- [ ] **Step 4: Branch `GO!` into manual vs. default start**

Find the whole `startBtn.addEventListener('click', ...)` handler and replace its body's mode-specific parts. The current handler:

```javascript
    startBtn.addEventListener('click', () => {
      currentPlayer = nameInput.value.trim();
      if (!currentPlayer) return;
      localStorage.setItem('tt-last-player', currentPlayer);

      if (mode === 'count') {
        questionLimit = Math.max(5, Math.min(100, parseInt(questionCountInput.value) || 20));
      }

      questions = [];
      currentIndex = 0;
      correctCount = 0;
      wrongCount = 0;
      currentStreak = 0;
      bestStreak = 0;
      answerTimes = [];
      perTable = {};
      lastQuestion = null;
      isTransitioning = false;

      if (mode === 'count') {
        for (let i = 0; i < questionLimit; i++) {
          questions.push(generateQuestion());
        }
      } else {
        questions.push(generateQuestion());
      }

      hudTimerWrap.style.display = mode === 'timed' ? '' : 'none';

      if (mode === 'timed') {
        timeRemaining = timeLimit;
        hudTimer.textContent = timeRemaining;
        startTimer();
      }

      showScreen(practiceScreen);
      showQuestion();
    });
```

Replace with:

```javascript
    startBtn.addEventListener('click', () => {
      currentPlayer = nameInput.value.trim();
      if (!currentPlayer) return;
      localStorage.setItem('tt-last-player', currentPlayer);
      currentDeck = getStudentDeck(currentPlayer);

      questions = [];
      currentIndex = 0;
      correctCount = 0;
      wrongCount = 0;
      currentStreak = 0;
      bestStreak = 0;
      answerTimes = [];
      perTable = {};
      lastQuestion = null;
      isTransitioning = false;
      questionsAnswered = 0;
      stopNowBtn.style.display = 'none';

      practiceMode = manualModeChosen ? 'manual' : 'default';

      if (practiceMode === 'manual') {
        if (mode === 'count') {
          questionLimit = Math.max(5, Math.min(100, parseInt(questionCountInput.value) || 20));
        }
        if (mode === 'count') {
          for (let i = 0; i < questionLimit; i++) {
            questions.push(generateQuestion());
          }
        } else {
          questions.push(generateQuestion());
        }
        hudTimerWrap.style.display = mode === 'timed' ? '' : 'none';
        if (mode === 'timed') {
          timeRemaining = timeLimit;
          hudTimer.textContent = timeRemaining;
          startTimer();
        }
      } else {
        hudTimerWrap.style.display = 'none';
        sessionState = createSessionState();
        const firstKey = pickNextCard(currentDeck, sessionState);
        if (firstKey === null) {
          // Nothing due or new for the current table selection — nothing to practice.
          alert("No cards to practice yet! Try selecting more tables under Included tables.");
          return;
        }
        questions.push(questionFromKey(firstKey));
      }

      showScreen(practiceScreen);
      showQuestion();
    });
```

- [ ] **Step 5: Update `hudProgress` for default mode**

Find:

```javascript
      if (mode === 'count') {
        hudProgress.textContent = (currentIndex + 1) + ' / ' + questions.length;
      } else {
        hudProgress.textContent = '' + (currentIndex + 1);
      }
```

Replace with:

```javascript
      if (practiceMode === 'manual' && mode === 'count') {
        hudProgress.textContent = (currentIndex + 1) + ' / ' + questions.length;
      } else {
        hudProgress.textContent = '' + (currentIndex + 1);
      }
```

- [ ] **Step 6: Count answers and trigger checkpoints, only in default mode**

Find the `setTimeout` inside `checkAnswer`'s correct branch (added to in Task 6):

```javascript
        setTimeout(() => {
          isTransitioning = false;
          advance();
        }, 400);
```

Replace with:

```javascript
        setTimeout(() => {
          isTransitioning = false;
          if (practiceMode === 'default') {
            questionsAnswered++;
            if (questionsAnswered % CHECKPOINT_SIZE === 0) {
              showCheckpoint();
              return;
            }
          }
          advance();
        }, 400);
```

- [ ] **Step 7: Update `advance()` to pull from the FSRS queue in default mode**

Find:

```javascript
    function advance() {
      currentIndex++;

      if (mode === 'count' && currentIndex >= questions.length) {
        finishPractice();
        return;
      }

      if (mode === 'timed') {
        if (timeRemaining <= 0) {
          finishPractice();
          return;
        }
        questions.push(generateQuestion());
      }

      showQuestion();
    }
```

Replace with:

```javascript
    function advance() {
      currentIndex++;

      if (practiceMode === 'default') {
        const nextKey = pickNextCard(currentDeck, sessionState);
        if (nextKey === null) {
          finishPractice();
          return;
        }
        sessionState.newIntroducedInBlock = questionsAnswered % CHECKPOINT_SIZE === 0
          ? 0
          : sessionState.newIntroducedInBlock;
        questions.push(questionFromKey(nextKey));
        showQuestion();
        return;
      }

      if (mode === 'count' && currentIndex >= questions.length) {
        finishPractice();
        return;
      }

      if (mode === 'timed') {
        if (timeRemaining <= 0) {
          finishPractice();
          return;
        }
        questions.push(generateQuestion());
      }

      showQuestion();
    }
```

- [ ] **Step 8: Add the checkpoint overlay logic and stop-now wiring**

Add near `function finishPractice() {`:

```javascript
    function showCheckpoint() {
      checkpointOverlay.style.display = 'flex';
    }

    keepGoingBtn.addEventListener('click', () => {
      checkpointOverlay.style.display = 'none';
      sessionState.newIntroducedInBlock = 0;
      stopNowBtn.style.display = 'block';
      advance();
    });

    stopFromCheckpointBtn.addEventListener('click', () => {
      checkpointOverlay.style.display = 'none';
      finishPractice();
    });

    stopNowBtn.addEventListener('click', () => {
      finishPractice();
    });
```

- [ ] **Step 9: Only show the stop-now button in default mode**

Find `showQuestion()`'s reset block:

```javascript
      answerInput.value = '';
      answerInput.classList.remove('correct', 'wrong');
      wrongTriesForQuestion = 0;
      helpRevealed = false;
      helpRow.innerHTML = '';
      answerInput.focus();
      questionStartTime = performance.now();
```

Replace with:

```javascript
      answerInput.value = '';
      answerInput.classList.remove('correct', 'wrong');
      wrongTriesForQuestion = 0;
      helpRevealed = false;
      helpRow.innerHTML = '';
      answerInput.focus();
      questionStartTime = performance.now();
      stopNowBtn.style.display = (practiceMode === 'default' && questionsAnswered >= CHECKPOINT_SIZE) ? 'block' : 'none';
```

- [ ] **Step 10: Verify in the browser**

- Clear `localStorage`, enter a name, click `GO!` directly (no sections opened) → default mode starts, HUD shows a running count (not "`x / y`"), no timer shown.
- Answer 20 questions → checkpoint overlay appears with "Keep going" / "Stop now".
- Click "Keep going" → overlay closes, a small "Stop now" button is visible under the answer area, play continues.
- Click "Stop now" (either the checkpoint or the persistent button) → results screen appears.
- Expand "Manual practice", pick "# of Questions", set 5, click `GO!` → Manual mode starts exactly as before (fixed count, no checkpoint, no stop-now button).

- [ ] **Step 11: Commit**

```bash
git add math/times-tables.html
git commit -m "feat(times-tables): add default-mode session flow with checkpoints"
```

---

## Task 9: Mastery Buckets, Results Screen, and Docs

**Files:**
- Modify: `math/times-tables.html` (results screen HTML/CSS/render logic)
- Modify: `math/AGENTS.md`

**Interfaces:**
- Consumes: `deserializeCard`, `isEligible` (Tasks 1-2), `State` (Task 1 import), `currentDeck`, `practiceMode` (Task 8).
- Produces: `masteryBuckets(deck) -> {new, learning, review, mastered}`.

- [ ] **Step 1: Add the mastery bucket function**

Add near `syncEligibleCards` (Task 2):

```javascript
    // ── Mastery buckets ──
    const MASTERED_STABILITY_DAYS = 21;

    function masteryBuckets(deck) {
      const buckets = { new: 0, learning: 0, review: 0, mastered: 0 };
      Object.keys(deck.cards)
        .filter(key => isEligible(key, deck.includedTables))
        .forEach(key => {
          const card = deserializeCard(deck.cards[key]);
          if (card.state === State.New) buckets.new++;
          else if (card.state === State.Learning || card.state === State.Relearning) buckets.learning++;
          else if (card.state === State.Review) {
            if (card.stability >= MASTERED_STABILITY_DAYS) buckets.mastered++;
            else buckets.review++;
          }
        });
      return buckets;
    }
```

- [ ] **Step 2: Add a mastery-bucket section to the results screen HTML**

Find:

```html
      <div class="breakdown-section" id="breakdownSection">
        <h3>Per-Table Breakdown</h3>
        <div class="breakdown-grid" id="breakdownGrid"></div>
      </div>
```

Replace with:

```html
      <div class="breakdown-section" id="masterySection" style="display:none">
        <h3>Mastery</h3>
        <div class="breakdown-grid" id="masteryGrid"></div>
      </div>
      <div class="breakdown-section" id="breakdownSection">
        <h3>Per-Table Breakdown</h3>
        <div class="breakdown-grid" id="breakdownGrid"></div>
      </div>
```

- [ ] **Step 3: Add DOM refs**

Add near `const breakdownGrid = ...`:

```javascript
    const masterySection = document.getElementById('masterySection');
    const masteryGrid = document.getElementById('masteryGrid');
```

- [ ] **Step 4: Render mastery buckets in `renderResults`, only for default mode**

Find (end of `renderResults`, right before the `renderAlltimeStats();` call):

```javascript
      renderAlltimeStats();
    }
```

Replace with:

```javascript
      if (practiceMode === 'default' && currentDeck) {
        const buckets = masteryBuckets(currentDeck);
        masterySection.style.display = '';
        masteryGrid.innerHTML = `
          <div class="breakdown-item">
            <div class="breakdown-table">New</div>
            <div class="breakdown-pct needs-work">${buckets.new}</div>
          </div>
          <div class="breakdown-item">
            <div class="breakdown-table">Learning</div>
            <div class="breakdown-pct good">${buckets.learning}</div>
          </div>
          <div class="breakdown-item">
            <div class="breakdown-table">Review</div>
            <div class="breakdown-pct good">${buckets.review}</div>
          </div>
          <div class="breakdown-item">
            <div class="breakdown-table">Mastered</div>
            <div class="breakdown-pct perfect">${buckets.mastered}</div>
          </div>
        `;
      } else {
        masterySection.style.display = 'none';
      }

      renderAlltimeStats();
    }
```

- [ ] **Step 5: Verify per-table breakdown dual-counting still renders correctly**

Find the existing breakdown-grid population (unchanged code, just confirm it still works given `perTable` is now populated by `recordPerTable` from Task 6):

```javascript
      const tableKeys = Object.keys(perTable).map(Number).sort((a, b) => a - b);
      if (tableKeys.length > 1) {
```

No code change needed here — `perTable` now naturally contains entries for every table touched by either factor of any answered question, in both modes.

- [ ] **Step 6: Verify in the browser**

- Clear `localStorage`. Enter a name, click `GO!` (default mode). Answer 20 questions, click "Stop now" at the checkpoint.
- Results screen shows: the usual stat cards, a new "Mastery" grid (all-but-Mastered buckets populated since nothing has reached 21-day stability yet — `New` count should equal `78 - <cards touched this session>`, `Learning` should equal cards you got at least one Again/Learning-state review on, etc.), and the per-table breakdown grid where a fact like `7x8` bumped both the `7s` and `8s` rows.
- Start a Manual-mode session and finish it — confirm the Mastery section is hidden (`display:none`) and only the per-table breakdown shows, as before.

- [ ] **Step 7: Update `math/AGENTS.md`**

Read the current file, then update the "Times Tables" section's "How It Works" and "Data & Persistence" to describe the new default FSRS mode, the collapsed Manual practice / Included tables sections, and the `tt-fsrs-cards` storage key, following the same style as the existing entries (mirroring the level of detail in the root `AGENTS.md`'s per-project sections).

- [ ] **Step 8: Full manual playtest against the spec**

Walk through `docs/superpowers/specs/2026-08-31-times-tables-fsrs-design.md` section by section in the browser:
- Setup screen behavior (name-only `GO!`, both sections collapsed by default, correct one starts based on which was opened).
- Included-tables OR-eligibility (deselect 7, keep 8 — confirm `7x8` still appears in a default-mode session; deselect both 7 and 8 — confirm no pure-7 or pure-8 fact appears, but e.g. `7x9` still can if 9 is selected).
- Rating derivation on a few real answers of varying speed/correctness (spot-check via console against Task 3's formulas).
- New-card cap and checkpoint/stop-now flow across a longer default session (40+ questions) with a fresh student.
- Manual mode still works exactly as before, and its answers now show up in `getStudentDeck(name).cards`.
- Results screen for both modes.

- [ ] **Step 9: Commit**

```bash
git add math/times-tables.html math/AGENTS.md
git commit -m "feat(times-tables): add mastery buckets to results and update docs"
```
