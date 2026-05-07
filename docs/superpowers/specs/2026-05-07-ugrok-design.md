# ugrok — Control Flow Learning Tool

**Date:** 2026-05-07
**Status:** Design approved

## Overview

ugrok is a self-paced learning tool that helps students read, reason about, understand, and write simple control flow programming structures in Python. Students are led through a series of exercises (a "grokset") that teach each topic through explanations, step-by-step code execution visualization, and quizzes.

The core differentiator is the **code stepper** — students watch code execute line by line, seeing the current line highlighted, variables update, conditions evaluate, and output accumulate. This makes the invisible flow of control visible.

## Architecture

### File Structure

```
ugrok/
├── index.html          # Single-page app — loads groksets, renders exercises
├── shared.css          # Styles (purple/green retro theme)
└── groksets/
    ├── conditionals.json    # Fully implemented
    ├── loops.json           # Stub
    ├── variables.json       # Stub
    ├── operators.json       # Stub
    ├── comparisons.json     # Stub
    └── functions.json       # Stub
```

### Key Decisions

- **Single HTML file** with inline JS, consistent with the rest of the site. `shared.css` is separate for readability.
- **Groksets are fetched via `fetch()`** — the app reads `groksets/*.json` at runtime. A manifest array in `index.html` lists available groksets and their order.
- **Hybrid execution model:** stepper demos use pre-authored execution traces in the JSON (full control over annotations and pacing). Quiz validation uses Skulpt to actually run student code.
- **Skulpt** loaded via CDN (same as other projects) — used only for quiz-code validation, never for stepper demos.
- **CodeMirror 5.65.16** for the quiz-code editor, same version as the rest of the site.
- **Cerebras API** called directly from the client for Help (same pattern as RPS Arena / Character Clash).
- **Sound effects** via Web Audio API using the same `createSounds()` pattern from `botty-mcbotface/engine.js`.
- **Progress** saved to localStorage — which groksets are complete, which exercise the student is on within each.
- **Student code** for quiz-code exercises saved to localStorage keyed by grokset ID and exercise index, restored when the student returns.
- **No Supabase** — this is a self-paced learning tool, no multiplayer/tournament component.

## Grokset JSON Format

Each grokset is a JSON file in `ugrok/groksets/`. A grokset contains metadata and an ordered array of exercises.

```json
{
  "id": "conditionals",
  "title": "Conditionals",
  "description": "Learn how if, else, and elif control which code runs",
  "language": "python",
  "exercises": [...]
}
```

### Exercise Types

#### `explanation`

Text + code with highlighted line annotations. "Got it" button to advance.

```json
{
  "type": "explanation",
  "title": "The If Statement",
  "content": "This is an 'if' statement. You can read it like this...",
  "code": "a = 5\nb = 5\nif a == b:\n    print(\"yes\")",
  "highlights": [
    { "lines": [3], "note": "The 'if' keyword starts a conditional check" },
    { "lines": [4], "note": "This line is indented — it only runs if the condition is True" }
  ]
}
```

#### `stepper`

Code with a pre-authored execution trace. Auto-play/manual step controls show line highlight, variable state, output, and condition evaluation.

```json
{
  "type": "stepper",
  "title": "Watch It Run",
  "code": "a = 5\nb = 5\nif a == b:\n    print(\"yes\")",
  "trace": [
    { "line": 1, "state": { "a": 5 }, "output": [], "eval": null },
    { "line": 2, "state": { "a": 5, "b": 5 }, "output": [], "eval": null },
    { "line": 3, "state": { "a": 5, "b": 5 }, "output": [], "eval": "a == b → 5 == 5 → True" },
    { "line": 4, "state": { "a": 5, "b": 5 }, "output": ["yes"], "eval": null }
  ]
}
```

Each step represents the state *after* that line executes:
- `line` — 1-indexed line number to highlight
- `state` — full variable snapshot (all variables and their current values)
- `output` — cumulative array of printed strings
- `eval` — optional string showing condition/expression evaluation, displayed only when present

#### `quiz-choice`

Multiple choice question, optionally with a code snippet.

```json
{
  "type": "quiz-choice",
  "question": "What does this code print?",
  "code": "x = 10\nif x > 5:\n    print(\"big\")\nelse:\n    print(\"small\")",
  "choices": ["big", "small", "big small", "nothing"],
  "answer": 0
}
```

#### `quiz-code`

Code editor where the student writes code. Validated by running in Skulpt.

```json
{
  "type": "quiz-code",
  "question": "Write code that prints \"yes\" if a equals b",
  "starterCode": "a = 5\nb = 5\n# write your if statement below\n",
  "validation": {
    "type": "output",
    "expected": ["yes"]
  }
}
```

Validation types:
- `"output"` — run the code, check printed output matches `expected` array
- `"state"` — run the code, check variable values match `check` object (e.g., `{ "result": "odd" }`)

## UI Layout & Flow

### Landing Screen

- Title "ugrok" with tagline
- List of groksets as cards/rows showing title, description, and progress (e.g., "3/12 exercises done", or checkmark if complete)
- Default order indicated visually (numbered), all clickable
- Current/suggested grokset highlighted

### Exercise Screen

All exercise types share a common frame:

- **Top bar:** grokset title, exercise counter (e.g., "4 of 12"), back-to-menu button
- **Progress dots** — one per exercise, filled for completed, current one highlighted. Clickable to jump to completed exercises only.
- **Main content area** — changes based on exercise type (see below)
- **Help button** — fixed in bottom-right corner (see LLM Help section)

#### Explanation Layout

- Code panel on the left with highlighted lines
- Explanation text on the right
- "Got it" button at the bottom

#### Stepper Layout

- **Left panel:** code with line numbers. Current line has highlighted background. Already-executed lines subtly dimmed.
- **Right panel** split into three stacked sections:
  - **Variables** — table of variable names and values. New/changed values flash briefly.
  - **Evaluation** — shows condition evaluation chain when present (e.g., `a == b → 5 == 5 → True`). Empty otherwise.
  - **Output** — terminal-style area showing printed output so far. New output highlights briefly.
- **Controls at bottom:**
  - Play/pause button (auto-play steps at current speed)
  - Step forward / step back buttons
  - Speed slider: slow (1.5s per step), normal (0.8s), fast (0.4s)
  - Reset button
  - Auto-play pauses at the last step

Step-back works by indexing backward in the trace array — each step is a full snapshot, no reverse computation needed.

#### Quiz-Choice Layout

- Question text at top
- Code snippet if present
- Answer buttons below

#### Quiz-Code Layout

- Question text at top
- CodeMirror editor in the center
- "Run" button
- Output/result panel below showing success/failure feedback

### Navigation Between Exercises

- "Got it" / correct answer advances to the next exercise
- Wrong answers show feedback ("Not quite — try again") but don't advance
- On grokset completion, show a celebration screen with "Back to menu" button

## LLM Help Integration

### Behavior

- Help button always visible in bottom-right corner
- Opens a small panel with text input and "Ask" button
- Single-shot: one question, one response, done. No conversation. Student can click Help again for a new question.

### System Prompts

**Explanation/stepper exercises:**
```
You are a friendly coding tutor helping an elementary/middle school student
understand Python. The student is learning about [grokset topic]. They are
currently looking at this code:
[code]
Answer their question simply and concisely. Use analogies when helpful.
Keep responses under 3 sentences.
```

**Quiz exercises (choice or code):**
```
You are a friendly coding tutor. The student is working on this quiz question:
[question]
[code if present]
Give a helpful hint that guides them toward the answer WITHOUT giving it away.
Use leading questions or point out what to focus on.
Keep responses under 3 sentences.
```

**Quiz-code exercises with student code, append:**
```
The student's current code:
[student code]
[error message if their last run produced one]
```

### Rate Limiting

- After each request, the Ask button is disabled for 10 seconds with a visible countdown
- Client-side only

### API

- Direct fetch to Cerebras API from the client (same pattern as RPS Arena)
- Response displayed as plain text in the Help panel

## Sound Effects

Using the Web Audio API `createSounds()` pattern from `botty-mcbotface/engine.js`:

- **Step advance** — subtle blip
- **Correct answer** — ascending chime
- **Wrong answer** — descending tone
- **Grokset completion** — fanfare

## Visual Theme

Purple/green retro theme — same family as Code Quest but distinct identity.

### Colors

```css
--bg: #0a0a1a;
--surface: #141430;
--primary: #b388ff;       /* soft purple — main accent, buttons, current line */
--secondary: #69f0ae;     /* green — correct, progress, success */
--warning: #ffbe0b;       /* yellow — hints, help panel */
--error: #ff5252;         /* red — wrong answers */
--text: #e0e0e0;          /* light gray body */
--code-bg: #1a1a3e;       /* code panel background */
```

### Typography

- **Headers:** Press Start 2P (pixel font)
- **Code:** Share Tech Mono
- **Body:** Fredoka

### Visual Identity

- Stepper current-line highlight uses purple glow
- Progress dots use green accent for completed exercises
- Help panel uses yellow accent
- CRT scanline overlay and glow effects, in the purple/green palette

## Grokset Content Plan

| Order | ID | Title | Topics | Status |
|-------|----|-------|--------|--------|
| 1 | `variables` | Variables | Creating variables, types, printing | Stub |
| 2 | `operators` | Operators | +, -, *, /, %, string concatenation | Stub |
| 3 | `comparisons` | Comparisons | ==, !=, <, >, <=, >= | Stub |
| 4 | `conditionals` | Conditionals | if, else, elif, nested conditions | **Fully implemented** |
| 5 | `loops` | Loops | while, for, range(), break | Stub |
| 6 | `functions` | Functions | def, parameters, return, calling | Stub |

### Conditionals Grokset (~20 exercises)

1. Explanation: what is an `if` statement
2. Stepper: simple `if` (condition True)
3. Stepper: simple `if` (condition False — nothing happens)
4. Quiz-choice: "What does this code print?" (if True)
5. Quiz-choice: "What does this code print?" (if False)
6. Quiz-code: write an `if` that prints something
7. Explanation: introducing `else`
8. Stepper: `if/else` (True branch taken)
9. Stepper: `if/else` (False branch taken)
10. Quiz-choice: predict output of `if/else`
11. Quiz-code: write an `if/else`
12. Explanation: comparison operators (==, !=, <, >, <=, >=)
13. Quiz-choice: what does `x > 5` evaluate to?
14. Quiz-code: write an `if` using a comparison
15. Explanation: introducing `elif`
16. Stepper: `if/elif/else` chain
17. Quiz-choice: predict output of `if/elif/else`
18. Quiz-code: write an `if/elif/else`
19. Stepper: nested `if` (stretch)
20. Quiz-code: final challenge combining concepts

## Hub Integration

- Add a card for ugrok to `2026/index.html`
- Link to `ugrok/index.html`

## Future Extensibility

- **New groksets:** add a JSON file to `groksets/` and add it to the manifest in `index.html`
- **JavaScript support:** the `language` field in the grokset JSON allows future groksets to specify `"javascript"`. The quiz runner would use `eval()` instead of Skulpt. The stepper trace format is language-agnostic.
- **New exercise types:** the rendering engine dispatches on `exercise.type`, so new types can be added without changing existing exercises
