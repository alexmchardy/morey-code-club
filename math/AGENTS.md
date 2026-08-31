# Math

Single-file HTML apps for elementary school students to practice math skills.

## Structure

```
math/
└── times-tables.html   # Multiplication tables practice game
```

## Times Tables (`times-tables.html`)

A self-contained times-tables quiz game with a retro neon aesthetic (dark mode by default, light mode toggle).

### How It Works

- **Setup screen**: `GO!` requires only a name — no table selection or mode configuration is required to start. Two collapsed sections sit below `GO!`, both closed by default:
  - **Manual practice** — the mode toggle (`# of Questions` / `Timed Race`) and its config (question count, or time-limit buttons).
  - **Included tables** — the table grid (1s–12s) plus shortcut buttons (All / None / Hard ones). This is the single, shared table-selection UI used by both modes.
- Clicking `GO!` without opening either section starts **default (FSRS) mode** — an adaptive spaced-repetition session using [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (loaded via `<script type="module">` from the jsDelivr `+esm` CDN, no bundler). Opening "Manual practice" and picking a mode there makes `GO!` start a **Manual** session instead, drawing random questions from the Included-tables selection exactly as before.
- **Default mode**: each question is picked from the student's per-student FSRS deck — due review cards first (most-overdue first), interleaved with new cards (capped at 10 per 20-question block). Facts are unordered pairs (`3x7` and `7x3` are the same card), so the two factors are shown in a random order each time a card is drawn. Every 20 answered questions the session pauses with a "Keep going / Stop now" checkpoint; it also ends immediately if the due/new pools run dry. There are no explicit self-rating buttons — a rating (Again/Hard/Good/Easy) is derived automatically from correctness and answer speed relative to that card's running average, and fed to `scheduler.next(card, now, rating)`.
- **Manual mode**: unchanged fixed-count or timed-race practice, still drawing from the Included-tables selection. Its answers are now also recorded into the same per-student FSRS deck (so Manual practice contributes to mastery over time), but its own session end condition and results screen are unaffected.
- **Results screen**: both modes show the existing per-table accuracy breakdown (a fact like `7x8` counts toward both the 7s and 8s rows). Default-mode sessions additionally show a **Mastery** grid — New / Learning (FSRS `Learning`/`Relearning`) / Review / Mastered (FSRS `Review` with `stability >= 21` days) counts across the student's whole eligible deck, not just cards seen that session. Manual-mode results never show the Mastery grid.

### Data & Persistence

- All state is client-side — no backend, no network calls except font/confetti/ts-fsrs CDN assets
- `tt-players` (localStorage) — existing per-player session history (streaks, best times, etc.), unchanged.
- `tt-last-player` (localStorage) — last-used name, pre-filled on load
- `tt-theme` (localStorage) — light/dark preference
- `tt-fsrs-cards` (localStorage) — new key holding the FSRS deck, one entry per student name:
  ```
  tt-fsrs-cards = {
    [studentName]: {
      includedTables: number[],   // e.g. [1..12]; defaults to all 12 the first time a student is seen
      cards: {
        "3x7": Card,               // ts-fsrs Card shape, dates as ISO strings on disk
        ...
      }
    }
  }
  ```
  Each `Card` is ts-fsrs's `Card` interface (`due`, `stability`, `difficulty`, `state`, `reps`, `lapses`, `last_review`, ...) plus one app-level field, `avgCorrectMs` (EWMA of response time on correct-first-try answers, used to derive Hard/Good/Easy ratings).
- A pair `(i, j)` is deck-eligible if **either** `i` or `j` is in `includedTables` — deselecting table 7 while 8 stays selected keeps `7x8` alive. Cards are created lazily the first time a selection makes a pair eligible, never deleted when a table is deselected (`syncEligibleCards`).
- Toggling Included tables mid-session or on Play Again re-syncs eligible cards immediately; it never wipes existing card history.

### Tech Stack

- Pure HTML/CSS/JS — no build tools, no framework
- **canvas-confetti** (CDN) — results-screen celebration
- **Google Fonts** — Press Start 2P (headings/HUD), Cause (body)
- **ts-fsrs** — adaptive spaced-repetition scheduling for default mode; loaded as an ES module via the jsDelivr `+esm` CDN, same no-bundler approach as canvas-confetti

## Conventions

- Self-contained HTML files — styles and scripts inline, matching the rest of the site
- Retro pixel-font aesthetic with a light/dark theme toggle, consistent with other Morey Code Club projects
- Keep new math apps approachable for elementary/middle school students — see the root [AGENTS.md](../AGENTS.md) for site-wide conventions and deployment

## Adding to the Hub

When adding a new math app here, add a project card in `../2026/index.html` per the root AGENTS.md conventions.
