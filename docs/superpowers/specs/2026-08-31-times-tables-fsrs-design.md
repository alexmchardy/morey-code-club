# Times Tables — Spaced Repetition (FSRS) Design Spec

Adds an adaptive "default" practice mode to `math/times-tables.html` that uses the [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) spaced-repetition scheduler to focus a student's practice on the multiplication facts they answer slowly or incorrectly, while keeping the existing manual practice modes available as a secondary option.

## Audience

Elementary school students practicing times tables. The change should feel like "the game gets smarter about what to ask you," not like a flashcard app — no explicit self-rating buttons, no new required steps before `GO!`.

## Setup Screen Changes

- `GO!` requires only a name (table selection and mode configuration are no longer required to start).
- **"Manual practice"** — collapsed section, closed by default, below `GO!`. Contains the existing mode toggle (`# of Questions` / `Timed Race`) and its config (question count, or time limit buttons). Unchanged from today except for its position and default-collapsed state.
- **"Included tables"** — collapsed section, closed by default, below `GO!`, positioned after "Manual practice". Contains the existing table grid (1s–12s) and shortcut buttons (All / None / Hard ones). This is now the **only** table-selection UI — there is no separate manual-mode-only table picker. It is used by both default mode (deck membership, see below) and Manual mode (which tables to draw random questions from, same as today).
- Clicking `GO!` without opening either section starts **default (FSRS) mode**. Opening "Manual practice" and picking a mode there means `GO!` starts a Manual session instead, using the current Included-tables selection as its table pool exactly as today's "Pick your tables" did.

## Data Model

### Included tables (per student, persistent)

`tt-fsrs-cards[studentName].includedTables`: array of ints 1–12. Defaults to **all 12** the first time a student is seen. Persists across sessions. Toggling a table on/off never deletes any card's history — see deck membership below.

### Cards (per student, persistent)

Multiplication facts are tracked as **unordered pairs**: `3x7` and `7x3` are the same card, keyed as `"<min>x<max>"` (78 possible keys for tables 1–12, since 1x1 through 12x12 collapse to unique unordered pairs). When a card is presented to the student, the display order of the two factors is randomized independently of storage.

```
tt-fsrs-cards = {
  [studentName]: {
    includedTables: number[],       // e.g. [1,2,3,4,5,6,7,8,9,10,11,12]
    cards: {
      "3x7": Card,                  // ts-fsrs Card shape, dates as ISO strings on disk
      ...
    }
  }
}
```

`Card` is exactly [ts-fsrs's `Card` interface](https://github.com/open-spaced-repetition/ts-fsrs) (`due`, `stability`, `difficulty`, `state`, `reps`, `lapses`, `last_review`, etc.), plus one extra app-level field:

- `avgCorrectMs: number | null` — running EWMA of response time on correct-first-try answers for this card, used to derive Hard/Good/Easy (see below). `null` until the first correct-first-try answer.

Extra fields on the stored object are ignored by ts-fsrs's scheduler calls and simply carried through on save/load.

### Deck membership rule

A pair `(i, j)` (`i <= j`) is eligible to exist/appear if **either** `i` or `j` is in `includedTables`. Concretely: deselecting table 7 while table 8 stays selected keeps `7x8` alive (because 8 qualifies), but removes e.g. `7x1` unless 1 is also selected.

- Cards are created lazily (`createEmptyCard()`, due now) the first time a table selection makes a pair eligible — not all 78 upfront.
- Toggling a table off never deletes existing cards for pairs it made eligible; it only removes ineligible pairs from the due/new pool for future sessions until the table (or its partner factor) is re-selected.

### Session-scoped state (not persisted)

- Set of card keys already introduced-as-new this session, and a running count against the per-block cap.
- Questions answered this session (for the 20-question checkpoint).

## Rating Derivation

Every answered question, in **either** mode, produces an FSRS rating and feeds `scheduler.next(card, now, rating)`:

- Any wrong try before the student eventually answers correctly → **Again**.
- Correct on the first try → **Hard**, **Good**, or **Easy**, based on elapsed answer time vs. that card's `avgCorrectMs`:
  - No baseline yet (first-ever correct-first-try answer for this card): use fixed fallback bands — `< 3s` → Easy, `3–8s` → Good, `> 8s` → Hard.
  - With a baseline: `< 0.6x avg` → Easy, `0.6x–1.5x avg` → Good, `> 1.5x avg` → Hard.
  - After a correct-first-try answer, update `avgCorrectMs = avgCorrectMs == null ? elapsed : avgCorrectMs * 0.7 + elapsed * 0.3`.
  - Answers preceded by a wrong try do not update `avgCorrectMs` (an "Again" rating shouldn't skew the speed baseline).

## Question Selection

### Manual mode

Unchanged from today: generate `a` from the current Included-tables selection, `b` random 1–12, avoid immediate repeat. The resulting pair still resolves to an unordered card key and goes through the rating/update pipeline above — Manual practice contributes to the same FSRS deck.

### Default (FSRS) mode

At each pick:

1. **Due review cards**: cards with `state != New`, `due <= now`, deck-eligible per the current `includedTables`, sorted most-overdue-first.
2. **New cards**: deck-eligible cards with `state == New`, not yet introduced this session, capped at **10 per 20-question block**.
3. If both pools are empty, end the session immediately (go to results), regardless of where the 20-question checkpoint counter is.
4. Otherwise pick from the combined pool, weighted to interleave: mostly take the most-overdue review card, occasionally (when the new-card cap isn't yet hit) introduce a new card instead, so a session doesn't read as "all review, then all new."

New cards introduced by a mid-session table-selection change (student opens Included tables and adds a table during setup, or on Play Again) are created at that point and enter the New pool for the next session start.

Uses ts-fsrs's default scheduler parameters and learning steps for v1 — these are the kind of thing that may need tuning after real classroom use, not worth guessing at now.

## Session Flow (default mode)

- Every 20 answered questions, pause with a "Nice work! 🎉 [Keep going] [Stop now]" prompt.
- Choosing **Keep going**: resume, with a small persistent "Stop now" button visible during play; the next checkpoint is 20 questions later.
- Choosing **Stop now**, or the due/new pools going empty (checked before every pick, not just at checkpoints): go straight to the results screen.
- Manual mode is unaffected by this checkpoint — it keeps its existing fixed-count / timed-race end conditions.

## Results Screen

Both of the following are shown after a default-mode session, alongside the existing overall stats (accuracy, avg/fastest time, streak):

- **Per-table accuracy grid** (existing): a fact like `7x8` counts toward **both** the 7s and 8s breakdown rows, since it belongs to both tables.
- **Mastery buckets** (new): counts of the student's deck-eligible cards in **New** / **Learning** (FSRS `Learning`/`Relearning` states) / **Mastered** (FSRS `Review` state with `stability` above a threshold, e.g. 21 days) / **Review** (FSRS `Review` state below that threshold). Computed over the student's whole eligible deck at session end, not just cards seen this session.

Manual-mode results screens are unchanged (existing per-table breakdown only, no mastery buckets, since Manual sessions are a fixed slice of tables rather than the full adaptive deck).

## Library Integration

- Load via `<script type="module">` importing `ts-fsrs` from `https://cdn.jsdelivr.net/npm/ts-fsrs@latest/+esm` — no bundler, consistent with how `canvas-confetti` is already loaded from a CDN.
- All new logic stays inline in `times-tables.html`, per this repo's self-contained single-file-app convention (see root and `math/` `AGENTS.md`). No new files.

## Out of Scope (v1)

- Tuning ts-fsrs scheduler parameters/weights for this age group.
- Explicit self-rating UI (Again/Hard/Good/Easy buttons).
- Cross-device sync of card/stat data (remains localStorage-only, per-browser).
- Retroactively backfilling FSRS cards from past `tt-players` session history.
