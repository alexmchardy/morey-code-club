# ugrok

A self-paced learning tool that teaches Python control flow through step-by-step code execution visualization, explanations, and quizzes.

## How It Works

1. **Students** pick a topic (grokset) from the landing screen
2. **Exercises** progress through explanation, stepper demo, and quiz stages
3. **Code stepper** shows code executing line by line — highlighting the current line, updating variables, showing condition evaluations, and accumulating output
4. **Quizzes** are multiple choice or write-code, validated by running student code in Skulpt
5. **Help button** sends questions to Cerebras LLM with exercise context, rate-limited to 10s between requests

## Structure

```
ugrok/
├── index.html          # Single-page app — all JS inline
├── shared.css          # Purple/green retro theme
├── AGENTS.md
└── groksets/
    ├── conditionals.json    # Fully implemented (20 exercises)
    ├── variables.json       # Stub
    ├── operators.json       # Stub
    ├── comparisons.json     # Stub
    ├── loops.json           # Stub
    └── functions.json       # Stub
```

## Tech Stack

- **Skulpt 1.2.0** — Python execution in the browser (quiz-code validation only)
- **CodeMirror 5.65.16** — code editor for quiz-code exercises
- **Cerebras API** — LLM help (llama3.1-8b, called directly from client)
- **Web Audio API** — generated sound effects (step, correct, wrong, complete)
- **localStorage** — progress tracking and student code persistence

## Grokset JSON Format

Each grokset is a JSON file with metadata and an ordered array of exercises:

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

- **`explanation`** — text + code with highlighted line annotations, "Got it" button
- **`stepper`** — code with pre-authored execution trace (line, state, output, eval), auto-play/manual step controls
- **`quiz-choice`** — multiple choice question with optional code snippet
- **`quiz-code`** — CodeMirror editor, validated via Skulpt (output match or state check)

### Stepper Trace Format

Each step is a full snapshot (enables step-back without reverse computation):
- `line` — 1-indexed line number to highlight
- `state` — all variable names and values at this point
- `output` — cumulative array of printed strings
- `eval` — optional condition evaluation string (e.g., `"a == b → 5 == 5 → True"`)

### Validation Types (quiz-code)

- `"output"` — run code, compare printed output to `expected` array
- `"state"` — run code, check variable values match `check` object

## Key Architecture

- **Hybrid execution model:** stepper demos use pre-authored traces in JSON (full control over annotations). Quiz validation uses live Skulpt execution.
- **Grokset manifest** in `index.html` defines the order and file paths
- **Progress** stored per-grokset in localStorage as boolean arrays (one per exercise)
- **Student code** stored per-exercise in localStorage, restored on return
- **CSS classes** use a `hidden` class for show/hide toggling

## Adding a New Grokset

1. Create `groksets/<id>.json` with the grokset format above
2. Add an entry to `GROKSET_MANIFEST` in `index.html`
3. The `language` field supports `"python"` — JavaScript support is architecturally possible but not yet implemented

## Design System

Purple/green variant of the site's retro theme:
- **Primary:** `#b388ff` (purple — accents, highlights, buttons)
- **Secondary:** `#69f0ae` (green — correct, progress, success)
- **Warning:** `#ffbe0b` (yellow — help panel)
- **Error:** `#ff5252` (red — wrong answers)
- **Fonts:** Press Start 2P (headers), Share Tech Mono (code), Fredoka (body)
