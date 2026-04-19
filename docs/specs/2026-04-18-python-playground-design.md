# Python Playground Design Spec

A browser-based Python editor and runner for Morey Code Club students to complete coding projects on their Chromebooks.

## Overview

Python Playground provides a three-panel interface:
- **Project Panel** (left): Step-by-step instructions with progress tracking
- **Editor** (center): CodeMirror-based Python editor
- **Terminal** (right): Output display with inline input support

Projects are loaded via query parameter (`?project=snarky-calculator`), allowing multiple coding projects to share the same infrastructure.

## Architecture

```
python-playground/
├── index.html              # Main application (self-contained)
├── shared.css              # Shared styles (Code Club aesthetic)
├── projects/
│   ├── index.js            # Project manifest (list of available projects)
│   └── snarky-calculator.js   # First project module
└── README.md               # Notes for adding new projects
```

### Project Manifest

`projects/index.js` exports a list of available projects for the selector:

```javascript
export default [
  { id: 'snarky-calculator', title: 'Snarky Calculator' },
  // Add new projects here
];
```

### Tech Stack

- **Python Runtime**: Skulpt 1.2.0 (client-side, already used in Code Club)
- **Editor**: CodeMirror 5.65.16 with Python mode, material-darker theme
- **Styling**: Code Club dark theme with neon accents
- **Fonts**: Press Start 2P (headings), Share Tech Mono (code), Fredoka (body)
- **Storage**: localStorage for code persistence

### URL Patterns

- `python-playground/?project=snarky-calculator` → loads Snarky Calculator
- `python-playground/` (no param) → free-form Python sandbox with no project loaded

## UI Layout

### Desktop (>1024px)

Three-column flexbox layout:
- Project panel: ~280px fixed
- Editor: flex: 1 (fills remaining space)
- Terminal: ~320px fixed

### Tablet/Mobile (≤1024px)

Single-column stacked layout:
- Project panel (collapsible)
- Editor
- Terminal

### Component Details

| Component | Description |
|-----------|-------------|
| Project Panel | Project selector dropdown at top, then title, step checklist, expandable hints. Purple accent border. |
| Project Selector | Dropdown with "No project" as default plus available projects. Changing selection updates URL and loads project. |
| Editor | CodeMirror with Python mode, line numbers, syntax highlighting. |
| Terminal Header | Run (green), Stop (red, shown when running), Reset (orange) buttons. |
| Terminal Body | Monospace output. Shows print() output, input() prompts with blinking cursor. |

### No Project Mode

When "No project" is selected (or no query param):
- Project panel shows only the selector dropdown
- Steps and hints sections are hidden
- Editor starts empty (or with a simple `# Start coding!` comment)
- Full editor and terminal functionality available
- Code still auto-saves to localStorage (key: `pp-code-sandbox`)

## Project Module API

Each project is a JS module in `projects/` exporting a configuration object:

```javascript
export default {
  id: 'snarky-calculator',
  title: 'Snarky Calculator',
  description: 'Build a calculator that insults you!',

  steps: [
    {
      id: 'get-inputs',
      text: 'Get two numbers and an operator using input()',
      detect: (code) => (code.match(/input\s*\(/g) || []).length >= 3
    },
    {
      id: 'do-math',
      text: 'Do math based on the operator (+, -, *, /)',
      detect: (code) => /if\s+.*==\s*["'][+\-*/]["']/.test(code)
    },
    {
      id: 'print-answer',
      text: 'Print the answer',
      detect: (code) => /print\s*\(/.test(code) && /int\s*\(/.test(code)
    },
    {
      id: 'add-snark',
      text: 'Add snarky remarks based on the answer',
      manual: true
    },
    {
      id: 'loop-it',
      text: 'Wrap everything in while True:',
      detect: (code) => /while\s+True\s*:/.test(code)
    },
  ],

  hints: [
    { title: 'Getting input', content: 'a = input()\naction = input()\nb = input()' },
    { title: 'Doing math', content: 'if action == "+":\n  answer = int(a) + int(b)' },
    { title: 'Adding snark', content: 'if answer < 10:\n  print("Too easy!")' },
  ],

  starterCode: `# Snarky Calculator
# The computer is better than you at math, dummy!

`,
};
```

### API Contract

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | URL-safe identifier |
| `title` | string | Yes | Display name |
| `description` | string | No | Short tagline |
| `steps` | array | Yes | Ordered checklist items |
| `steps[].id` | string | Yes | Unique step identifier |
| `steps[].text` | string | Yes | Display text |
| `steps[].detect` | function | No | `(code) => boolean` for auto-completion |
| `steps[].manual` | boolean | No | If true, student checks off manually |
| `hints` | array | No | Expandable hint sections |
| `hints[].title` | string | Yes | Hint header |
| `hints[].content` | string | Yes | Code/text shown in monospace |
| `starterCode` | string | No | Initial editor content |

## Python Execution

### Skulpt Configuration

```javascript
Sk.configure({
  output: (text) => appendToTerminal(text, 'output'),
  inputfun: () => new Promise((resolve) => {
    isWaitingForInput = true;
    inputResolve = resolve;
    showInputCursor();
  }),
  read: (filename) => Sk.builtinFiles["files"][filename],
});
```

### Input Handling (Async Input Queue)

When `input()` is called:
1. Skulpt execution pauses via Promise
2. Terminal shows blinking cursor, becomes focusable
3. Student types, presses Enter
4. Input captured, execution resumes

### Terminal States

| State | Appearance |
|-------|------------|
| Idle | Empty or previous output, no cursor |
| Running | Output streaming, Stop button visible |
| Waiting for input | Blinking cursor, terminal focusable |
| Error | Red error message with line number |
| Complete | Output visible, ready for next run |

### Button Behavior

- **Run**: Executes code, becomes Stop while running
- **Stop**: Interrupts execution, returns to idle
- **Reset**: Clears terminal, resets code to starterCode, clears step states

## Step Completion

### Hybrid System

- **Auto-detect steps**: Have `detect` function, checkbox updates based on code analysis
- **Manual steps**: Have `manual: true`, student clicks to check off

### Detection Timing

- Code changes trigger detection (debounced 500ms)
- Detection runs for all steps with `detect` function
- Results update checkbox UI immediately

### Visual Differentiation

| Step Type | Style | Interaction |
|-----------|-------|-------------|
| Auto-detect (incomplete) | ☐ with "auto" badge | Not clickable |
| Auto-detect (complete) | ☑ green | Not clickable |
| Manual (incomplete) | ☐ standard | Clickable |
| Manual (complete) | ☑ green | Clickable to uncheck |

## Local Storage

### Keys

| Pattern | Value | Purpose |
|---------|-------|---------|
| `pp-code-{projectId}` | string | Student's current code |
| `pp-steps-{projectId}` | JSON | Manual step completion states |

### Behavior

- Code auto-saves on every change (debounced)
- Manual step states save on checkbox click
- On load: restore saved code or use starterCode
- Reset clears both code and step states

### Error Handling

- Invalid localStorage data → fall back to defaults
- Project not found → show error in project panel, fall back to sandbox mode

## Visual Style

Follows existing Code Club aesthetic:

```css
:root {
  --bg: #030310;
  --surface: #0a0a1e;
  --border: #2a2a4a;
  --text: #e8e8f0;
  --neon-green: #39ff14;
  --neon-red: #ff4444;
  --neon-orange: #ff8c00;
  --neon-purple: #bf00ff;
  --neon-cyan: #00f5ff;
}
```

- Dark background with neon accents
- Glowing hover effects on buttons
- Panel components with subtle borders
- Retro pixel font for headings

## First Project: Snarky Calculator

Students build a calculator that:
1. Gets two numbers and an operator via `input()`
2. Performs the calculation
3. Prints the answer
4. Adds snarky remarks based on the result
5. Loops forever with `while True:`

Example interaction:
```
2
+
3
= 5
Cmon! You can do that in your head, dummy!
```
