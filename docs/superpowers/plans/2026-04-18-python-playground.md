# Python Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based Python editor and runner with project-based step tracking for elementary/middle school students.

**Architecture:** Three-panel layout (project instructions, CodeMirror editor, terminal output) with Skulpt for client-side Python execution. Projects are loaded via URL query parameter and define steps with auto-detection or manual completion.

**Tech Stack:** Skulpt 1.2.0, CodeMirror 5.65.16, vanilla HTML/CSS/JS, localStorage for persistence

---

## File Structure

```
python-playground/
├── index.html              # Main application (~600 lines)
├── shared.css              # Shared styles (~200 lines)
├── projects/
│   ├── index.js            # Project manifest
│   └── snarky-calculator.js   # First project
└── README.md               # Notes for adding new projects
```

| File | Responsibility |
|------|----------------|
| `index.html` | Three-panel layout, CodeMirror integration, Skulpt execution, project loading, step detection, localStorage persistence |
| `shared.css` | CSS variables, panel styles, button styles, terminal styles, responsive breakpoints |
| `projects/index.js` | Exports array of `{ id, title }` for project selector dropdown |
| `projects/snarky-calculator.js` | Exports full project config with steps, hints, and starterCode |
| `README.md` | Instructions for adding new projects |

---

## Task 1: Create Basic File Structure and Shared CSS

**Files:**
- Create: `python-playground/index.html`
- Create: `python-playground/shared.css`

- [ ] **Step 1: Create shared.css with CSS variables and base styles**

```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&family=Fredoka:wght@400;500;600;700&display=swap');

:root {
  --bg: #030310;
  --surface: #0a0a1e;
  --surface2: #151530;
  --border: #2a2a4a;
  --text: #e8e8f0;
  --text-dim: #8888a8;
  --neon-green: #39ff14;
  --neon-red: #ff4444;
  --neon-orange: #ff8c00;
  --neon-purple: #bf00ff;
  --neon-cyan: #00f5ff;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Fredoka', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow: hidden;
}

h1, h2, h3, h4 {
  font-family: 'Press Start 2P', monospace;
  font-weight: 400;
}

.hidden {
  display: none !important;
}

/* Scanline overlay */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    transparent, transparent 3px,
    rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px
  );
  pointer-events: none;
  z-index: 9999;
}
```

- [ ] **Step 2: Verify shared.css loads correctly**

Create a minimal `index.html` to test:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Python Playground</title>
  <link rel="stylesheet" href="shared.css">
</head>
<body>
  <h1>Test</h1>
  <p>If you see this with dark background and correct fonts, CSS is working.</p>
</body>
</html>
```

Open in browser. Expected: Dark background (#030310), white text, Press Start 2P font on heading, Fredoka on paragraph.

- [ ] **Step 3: Commit**

```bash
git add python-playground/
git commit -m "feat(python-playground): add base file structure and CSS variables"
```

---

## Task 2: Create Three-Panel Layout Structure

**Files:**
- Modify: `python-playground/shared.css`
- Modify: `python-playground/index.html`

- [ ] **Step 1: Add panel layout styles to shared.css**

Append to `shared.css`:

```css
/* === LAYOUT === */
.app-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* === PROJECT PANEL === */
.project-panel {
  width: 280px;
  min-width: 240px;
  background: var(--surface);
  border-right: 2px solid var(--neon-purple);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.project-header {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.project-selector {
  width: 100%;
  padding: 10px 12px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  cursor: pointer;
}

.project-selector:focus {
  border-color: var(--neon-purple);
  outline: none;
}

.project-title {
  font-size: 12px;
  color: var(--neon-purple);
  text-shadow: 0 0 10px var(--neon-purple);
  margin-top: 16px;
  line-height: 1.4;
}

.project-description {
  font-size: 13px;
  color: var(--text-dim);
  margin-top: 8px;
}

.project-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* === EDITOR PANEL === */
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 300px;
  background: var(--surface);
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

.editor-container .CodeMirror {
  height: 100%;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
}

/* === TERMINAL PANEL === */
.terminal-panel {
  width: 320px;
  min-width: 280px;
  background: var(--surface);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.terminal-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: 8px;
}

.terminal-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  padding: 8px 16px;
  border: 2px solid;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}

.terminal-btn.run {
  border-color: var(--neon-green);
  color: var(--neon-green);
  background: rgba(57, 255, 20, 0.1);
}

.terminal-btn.run:hover {
  background: rgba(57, 255, 20, 0.2);
  box-shadow: 0 0 15px rgba(57, 255, 20, 0.4);
}

.terminal-btn.stop {
  border-color: var(--neon-red);
  color: var(--neon-red);
  background: rgba(255, 68, 68, 0.1);
}

.terminal-btn.stop:hover {
  background: rgba(255, 68, 68, 0.2);
  box-shadow: 0 0 15px rgba(255, 68, 68, 0.4);
}

.terminal-btn.reset {
  border-color: var(--neon-orange);
  color: var(--neon-orange);
  background: rgba(255, 140, 0, 0.1);
}

.terminal-btn.reset:hover {
  background: rgba(255, 140, 0, 0.2);
  box-shadow: 0 0 15px rgba(255, 140, 0, 0.4);
}

.terminal-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.terminal-output {
  color: var(--text);
}

.terminal-error {
  color: var(--neon-red);
}

.terminal-input-line {
  display: flex;
  align-items: center;
}

.terminal-cursor {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: var(--neon-green);
  animation: blink 1s step-start infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}
```

- [ ] **Step 2: Update index.html with three-panel structure**

Replace `index.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Python Playground</title>
  <link rel="stylesheet" href="shared.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/material-darker.min.css">
</head>
<body>
  <div class="app-container">
    <!-- Project Panel -->
    <div class="project-panel">
      <div class="project-header">
        <select class="project-selector" id="projectSelector">
          <option value="">No project</option>
        </select>
        <h2 class="project-title hidden" id="projectTitle"></h2>
        <p class="project-description hidden" id="projectDescription"></p>
      </div>
      <div class="project-content" id="projectContent">
        <!-- Steps and hints render here -->
      </div>
    </div>

    <!-- Editor Panel -->
    <div class="editor-panel">
      <div class="editor-container">
        <textarea id="codeEditor"># Start coding!</textarea>
      </div>
    </div>

    <!-- Terminal Panel -->
    <div class="terminal-panel">
      <div class="terminal-header">
        <button class="terminal-btn run" id="runBtn">RUN</button>
        <button class="terminal-btn stop hidden" id="stopBtn">STOP</button>
        <button class="terminal-btn reset" id="resetBtn">RESET</button>
      </div>
      <div class="terminal-body" id="terminalBody"></div>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js"></script>
</body>
</html>
```

- [ ] **Step 3: Verify layout renders correctly**

Open in browser. Expected: Three columns visible - purple-bordered project panel on left (~280px), editor area in center (flexible), terminal panel on right (~320px). Run/Reset buttons visible in terminal header.

- [ ] **Step 4: Commit**

```bash
git add python-playground/
git commit -m "feat(python-playground): add three-panel layout structure"
```

---

## Task 3: Integrate CodeMirror Editor

**Files:**
- Modify: `python-playground/index.html`

- [ ] **Step 1: Add CodeMirror initialization script**

Add before closing `</body>` tag in `index.html`:

```html
<script>
  // === EDITOR ===
  const editorTextarea = document.getElementById('codeEditor');
  const editor = CodeMirror.fromTextArea(editorTextarea, {
    mode: 'python',
    theme: 'material-darker',
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    lineWrapping: true,
    autofocus: true,
  });

  // Ensure editor fills container
  editor.setSize('100%', '100%');
</script>
```

- [ ] **Step 2: Verify CodeMirror renders with Python syntax highlighting**

Open in browser. Expected: Editor shows with line numbers, dark theme, Python syntax highlighting. Type `def hello():` and verify keyword `def` is highlighted differently than `hello`.

- [ ] **Step 3: Commit**

```bash
git add python-playground/index.html
git commit -m "feat(python-playground): integrate CodeMirror with Python mode"
```

---

## Task 4: Integrate Skulpt and Basic Execution

**Files:**
- Modify: `python-playground/index.html`

- [ ] **Step 1: Add Skulpt script tags**

Add after CodeMirror scripts, before the initialization `<script>`:

```html
<script src="https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js"></script>
```

- [ ] **Step 2: Add execution state and terminal functions**

Update the `<script>` section. Replace entire script with:

```html
<script>
  // === STATE ===
  let isRunning = false;
  let interruptExecution = false;

  // === DOM REFS ===
  const editorTextarea = document.getElementById('codeEditor');
  const terminalBody = document.getElementById('terminalBody');
  const runBtn = document.getElementById('runBtn');
  const stopBtn = document.getElementById('stopBtn');
  const resetBtn = document.getElementById('resetBtn');

  // === EDITOR ===
  const editor = CodeMirror.fromTextArea(editorTextarea, {
    mode: 'python',
    theme: 'material-darker',
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    lineWrapping: true,
    autofocus: true,
  });
  editor.setSize('100%', '100%');

  // === TERMINAL ===
  function clearTerminal() {
    terminalBody.innerHTML = '';
  }

  function appendToTerminal(text, className = 'terminal-output') {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = text;
    terminalBody.appendChild(span);
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  // === SKULPT CONFIG ===
  function builtinRead(filename) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][filename] === undefined) {
      throw "File not found: '" + filename + "'";
    }
    return Sk.builtinFiles["files"][filename];
  }

  // === EXECUTION ===
  async function runCode() {
    if (isRunning) return;

    isRunning = true;
    interruptExecution = false;
    runBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    clearTerminal();

    const code = editor.getValue();

    Sk.configure({
      output: (text) => appendToTerminal(text),
      read: builtinRead,
      __future__: Sk.python3,
    });

    try {
      await Sk.misceval.asyncToPromise(() => {
        return Sk.importMainWithBody("<stdin>", false, code, true);
      });
    } catch (err) {
      appendToTerminal('\n' + err.toString(), 'terminal-error');
    }

    isRunning = false;
    runBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
  }

  function stopCode() {
    interruptExecution = true;
    isRunning = false;
    runBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    appendToTerminal('\n[Execution stopped]', 'terminal-error');
  }

  // === EVENT LISTENERS ===
  runBtn.addEventListener('click', runCode);
  stopBtn.addEventListener('click', stopCode);
  resetBtn.addEventListener('click', () => {
    editor.setValue('# Start coding!\n');
    clearTerminal();
  });
</script>
```

- [ ] **Step 3: Verify basic execution works**

Open in browser. Type in editor:
```python
print("Hello, Code Club!")
print(2 + 2)
```

Click RUN. Expected: Terminal shows:
```
Hello, Code Club!
4
```

- [ ] **Step 4: Verify error handling works**

Type in editor:
```python
print(undefined_variable)
```

Click RUN. Expected: Terminal shows error in red, mentioning `undefined_variable`.

- [ ] **Step 5: Commit**

```bash
git add python-playground/index.html
git commit -m "feat(python-playground): add Skulpt execution with basic output"
```

---

## Task 5: Implement Input Handling

**Files:**
- Modify: `python-playground/index.html`
- Modify: `python-playground/shared.css`

- [ ] **Step 1: Add input state variables and DOM updates**

In the `<script>` section, add after the `interruptExecution` declaration:

```javascript
let inputResolve = null;
let inputBuffer = '';
```

- [ ] **Step 2: Add input cursor and input line styles**

Append to `shared.css`:

```css
/* Terminal input */
.terminal-body.waiting-input {
  cursor: text;
}

.terminal-input-wrapper {
  display: inline;
}

.terminal-input-text {
  color: var(--neon-cyan);
}
```

- [ ] **Step 3: Add input handling functions**

In `index.html`, add after the `appendToTerminal` function:

```javascript
function showInputCursor() {
  const wrapper = document.createElement('span');
  wrapper.className = 'terminal-input-wrapper';
  wrapper.id = 'inputWrapper';

  const textSpan = document.createElement('span');
  textSpan.className = 'terminal-input-text';
  textSpan.id = 'inputText';

  const cursor = document.createElement('span');
  cursor.className = 'terminal-cursor';
  cursor.id = 'inputCursor';

  wrapper.appendChild(textSpan);
  wrapper.appendChild(cursor);
  terminalBody.appendChild(wrapper);
  terminalBody.scrollTop = terminalBody.scrollHeight;
  terminalBody.classList.add('waiting-input');
  terminalBody.focus();
}

function hideInputCursor() {
  const wrapper = document.getElementById('inputWrapper');
  if (wrapper) {
    const finalText = document.getElementById('inputText').textContent;
    wrapper.remove();
    appendToTerminal(finalText + '\n', 'terminal-input-text');
  }
  terminalBody.classList.remove('waiting-input');
}

function handleInputKeydown(e) {
  if (!inputResolve) return;

  if (e.key === 'Enter') {
    e.preventDefault();
    const value = inputBuffer;
    inputBuffer = '';
    hideInputCursor();
    inputResolve(value);
    inputResolve = null;
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    if (inputBuffer.length > 0) {
      inputBuffer = inputBuffer.slice(0, -1);
      document.getElementById('inputText').textContent = inputBuffer;
    }
  } else if (e.key.length === 1) {
    e.preventDefault();
    inputBuffer += e.key;
    document.getElementById('inputText').textContent = inputBuffer;
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }
}
```

- [ ] **Step 4: Update Skulpt config to handle input**

Replace the `Sk.configure` call in `runCode()`:

```javascript
Sk.configure({
  output: (text) => appendToTerminal(text),
  read: builtinRead,
  inputfun: () => {
    return new Promise((resolve) => {
      inputResolve = resolve;
      inputBuffer = '';
      showInputCursor();
    });
  },
  inputfunTakesPrompt: true,
  __future__: Sk.python3,
});
```

- [ ] **Step 5: Add terminal tabindex and keydown listener**

Add `tabindex="0"` to terminal-body element:

```html
<div class="terminal-body" id="terminalBody" tabindex="0"></div>
```

Add event listener after existing listeners:

```javascript
terminalBody.addEventListener('keydown', handleInputKeydown);
```

- [ ] **Step 6: Verify input() works**

Open in browser. Type:
```python
name = input("What is your name? ")
print("Hello, " + name + "!")
```

Click RUN. Expected:
1. Terminal shows "What is your name? " with blinking cursor
2. Type "Alex" and press Enter
3. Terminal shows "Hello, Alex!"

- [ ] **Step 7: Commit**

```bash
git add python-playground/
git commit -m "feat(python-playground): add async input() handling with cursor"
```

---

## Task 6: Create Project Module Structure

**Files:**
- Create: `python-playground/projects/index.js`
- Create: `python-playground/projects/snarky-calculator.js`

- [ ] **Step 1: Create project manifest**

Create `python-playground/projects/index.js`:

```javascript
export default [
  { id: 'snarky-calculator', title: 'Snarky Calculator' },
];
```

- [ ] **Step 2: Create snarky-calculator project**

Create `python-playground/projects/snarky-calculator.js`:

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
    {
      title: 'Getting input',
      content: `a = input("First number: ")
action = input("Operator: ")
b = input("Second number: ")`
    },
    {
      title: 'Doing math',
      content: `if action == "+":
    answer = int(a) + int(b)
elif action == "-":
    answer = int(a) - int(b)`
    },
    {
      title: 'Adding snark',
      content: `if answer < 10:
    print("Too easy, dummy!")
elif answer > 100:
    print("Wow, big number!")`
    },
  ],

  starterCode: `# Snarky Calculator
# The computer is better than you at math, dummy!

`,
};
```

- [ ] **Step 3: Verify files are valid ES modules**

Check syntax by loading in browser console (we'll integrate properly in next task).

- [ ] **Step 4: Commit**

```bash
git add python-playground/projects/
git commit -m "feat(python-playground): add project manifest and snarky calculator"
```

---

## Task 7: Implement Project Loading System

**Files:**
- Modify: `python-playground/index.html`

- [ ] **Step 1: Add project state variables**

Add after existing state variables in `<script>`:

```javascript
let currentProject = null;
let manualStepStates = {};
```

- [ ] **Step 2: Add project loading functions**

Add after input handling functions:

```javascript
// === PROJECTS ===
async function loadProjectManifest() {
  try {
    const manifest = await import('./projects/index.js');
    const selector = document.getElementById('projectSelector');

    manifest.default.forEach(proj => {
      const option = document.createElement('option');
      option.value = proj.id;
      option.textContent = proj.title;
      selector.appendChild(option);
    });

    // Check URL for project param
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('project');
    if (projectId) {
      selector.value = projectId;
      await loadProject(projectId);
    }
  } catch (err) {
    console.error('Failed to load project manifest:', err);
  }
}

async function loadProject(projectId) {
  const titleEl = document.getElementById('projectTitle');
  const descEl = document.getElementById('projectDescription');
  const contentEl = document.getElementById('projectContent');

  if (!projectId) {
    // No project mode
    currentProject = null;
    titleEl.classList.add('hidden');
    descEl.classList.add('hidden');
    contentEl.innerHTML = '';
    editor.setValue('# Start coding!\n');
    loadSavedCode('sandbox');
    return;
  }

  try {
    const module = await import(`./projects/${projectId}.js`);
    currentProject = module.default;

    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('project', projectId);
    window.history.pushState({}, '', url);

    // Show project info
    titleEl.textContent = currentProject.title;
    titleEl.classList.remove('hidden');

    if (currentProject.description) {
      descEl.textContent = currentProject.description;
      descEl.classList.remove('hidden');
    } else {
      descEl.classList.add('hidden');
    }

    // Load saved state
    loadManualStepStates(projectId);
    loadSavedCode(projectId);

    // Render steps and hints
    renderProjectContent();

  } catch (err) {
    console.error('Failed to load project:', err);
    contentEl.innerHTML = `<p class="terminal-error">Project not found: ${projectId}</p>`;
    currentProject = null;
  }
}

function renderProjectContent() {
  const contentEl = document.getElementById('projectContent');
  contentEl.innerHTML = '';

  if (!currentProject) return;

  // Render steps
  if (currentProject.steps && currentProject.steps.length > 0) {
    const stepsSection = document.createElement('div');
    stepsSection.className = 'steps-section';
    stepsSection.innerHTML = '<h3 class="section-title">Steps</h3>';

    const stepsList = document.createElement('ul');
    stepsList.className = 'steps-list';
    stepsList.id = 'stepsList';

    currentProject.steps.forEach((step, index) => {
      const li = document.createElement('li');
      li.className = 'step-item';
      li.dataset.stepId = step.id;

      const checkbox = document.createElement('span');
      checkbox.className = 'step-checkbox';

      const text = document.createElement('span');
      text.className = 'step-text';
      text.textContent = step.text;

      if (step.manual) {
        li.classList.add('manual');
        li.addEventListener('click', () => toggleManualStep(step.id));
      } else {
        const badge = document.createElement('span');
        badge.className = 'step-badge';
        badge.textContent = 'auto';
        li.appendChild(badge);
      }

      li.insertBefore(checkbox, li.firstChild);
      li.appendChild(text);
      stepsList.appendChild(li);
    });

    stepsSection.appendChild(stepsList);
    contentEl.appendChild(stepsSection);
  }

  // Render hints
  if (currentProject.hints && currentProject.hints.length > 0) {
    const hintsSection = document.createElement('div');
    hintsSection.className = 'hints-section';
    hintsSection.innerHTML = '<h3 class="section-title">Hints</h3>';

    currentProject.hints.forEach((hint, index) => {
      const hintEl = document.createElement('details');
      hintEl.className = 'hint-item';

      const summary = document.createElement('summary');
      summary.className = 'hint-title';
      summary.textContent = hint.title;

      const content = document.createElement('pre');
      content.className = 'hint-content';
      content.textContent = hint.content;

      hintEl.appendChild(summary);
      hintEl.appendChild(content);
      hintsSection.appendChild(hintEl);
    });

    contentEl.appendChild(hintsSection);
  }

  // Initial step detection
  detectSteps();
}
```

- [ ] **Step 3: Add project selector event listener**

Add after existing event listeners:

```javascript
document.getElementById('projectSelector').addEventListener('change', (e) => {
  loadProject(e.target.value);
});

// Initialize
loadProjectManifest();
```

- [ ] **Step 4: Add project content styles**

Append to `shared.css`:

```css
/* === STEPS === */
.section-title {
  font-size: 10px;
  color: var(--neon-cyan);
  text-shadow: 0 0 8px var(--neon-cyan);
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.steps-list {
  list-style: none;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: var(--surface2);
  border-radius: 4px;
  border-left: 3px solid var(--border);
  font-size: 13px;
  transition: border-color 0.2s;
}

.step-item.completed {
  border-left-color: var(--neon-green);
}

.step-item.manual {
  cursor: pointer;
}

.step-item.manual:hover {
  background: rgba(191, 0, 255, 0.1);
}

.step-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border);
  border-radius: 3px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  margin-top: 1px;
}

.step-item.completed .step-checkbox {
  border-color: var(--neon-green);
  color: var(--neon-green);
}

.step-item.completed .step-checkbox::after {
  content: '✓';
}

.step-text {
  flex: 1;
  line-height: 1.4;
}

.step-badge {
  font-family: 'Share Tech Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
  background: var(--surface);
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: auto;
}

/* === HINTS === */
.hints-section {
  margin-top: 24px;
}

.hint-item {
  margin-bottom: 8px;
}

.hint-title {
  font-family: 'Fredoka', sans-serif;
  font-size: 13px;
  color: var(--neon-orange);
  cursor: pointer;
  padding: 8px 12px;
  background: var(--surface2);
  border-radius: 4px;
  transition: background 0.15s;
}

.hint-title:hover {
  background: rgba(255, 140, 0, 0.1);
}

.hint-content {
  font-family: 'Share Tech Mono', monospace;
  font-size: 12px;
  color: var(--text);
  background: var(--bg);
  padding: 12px;
  margin-top: 4px;
  border-radius: 4px;
  border-left: 2px solid var(--neon-orange);
  white-space: pre-wrap;
  overflow-x: auto;
}
```

- [ ] **Step 5: Verify project loads from URL**

Open `python-playground/?project=snarky-calculator`. Expected:
- Project selector shows "Snarky Calculator"
- Title and description appear in project panel
- 5 steps listed with checkboxes
- 3 hints collapsible sections
- Editor shows starter code

- [ ] **Step 6: Verify no-project mode**

Open `python-playground/` (no query param). Expected:
- Selector shows "No project"
- No title, description, steps, or hints
- Editor shows "# Start coding!"

- [ ] **Step 7: Commit**

```bash
git add python-playground/
git commit -m "feat(python-playground): add project loading system with URL params"
```

---

## Task 8: Implement Step Detection

**Files:**
- Modify: `python-playground/index.html`

- [ ] **Step 1: Add step detection function**

Add after `renderProjectContent()`:

```javascript
function detectSteps() {
  if (!currentProject || !currentProject.steps) return;

  const code = editor.getValue();
  const stepsList = document.getElementById('stepsList');
  if (!stepsList) return;

  currentProject.steps.forEach(step => {
    const li = stepsList.querySelector(`[data-step-id="${step.id}"]`);
    if (!li) return;

    let isComplete = false;

    if (step.manual) {
      isComplete = manualStepStates[step.id] || false;
    } else if (step.detect) {
      isComplete = step.detect(code);
    }

    if (isComplete) {
      li.classList.add('completed');
    } else {
      li.classList.remove('completed');
    }
  });
}

function toggleManualStep(stepId) {
  manualStepStates[stepId] = !manualStepStates[stepId];
  saveManualStepStates();
  detectSteps();
}
```

- [ ] **Step 2: Add debounced detection on code change**

Add after step detection functions:

```javascript
let detectTimeout = null;

function scheduleDetection() {
  if (detectTimeout) clearTimeout(detectTimeout);
  detectTimeout = setTimeout(detectSteps, 500);
}

editor.on('change', () => {
  scheduleDetection();
  scheduleSaveCode();
});
```

- [ ] **Step 3: Verify auto-detection works**

Open `python-playground/?project=snarky-calculator`. Type in editor:
```python
a = input()
b = input()
c = input()
```

Expected: Step 1 ("Get two numbers and an operator using input()") shows green checkmark after ~500ms.

- [ ] **Step 4: Verify manual steps work**

Click on step 4 ("Add snarky remarks based on the answer"). Expected: Checkbox toggles on click. Click again to uncheck.

- [ ] **Step 5: Commit**

```bash
git add python-playground/index.html
git commit -m "feat(python-playground): add step detection (auto and manual)"
```

---

## Task 9: Add localStorage Persistence

**Files:**
- Modify: `python-playground/index.html`

- [ ] **Step 1: Add save/load code functions**

Add after `scheduleDetection()`:

```javascript
let saveCodeTimeout = null;

function scheduleSaveCode() {
  if (saveCodeTimeout) clearTimeout(saveCodeTimeout);
  saveCodeTimeout = setTimeout(saveCode, 1000);
}

function saveCode() {
  const projectId = currentProject ? currentProject.id : 'sandbox';
  const key = `pp-code-${projectId}`;
  try {
    localStorage.setItem(key, editor.getValue());
  } catch (e) {
    console.warn('Failed to save code:', e);
  }
}

function loadSavedCode(projectId) {
  const key = `pp-code-${projectId}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      editor.setValue(saved);
    } else if (currentProject && currentProject.starterCode) {
      editor.setValue(currentProject.starterCode);
    } else {
      editor.setValue('# Start coding!\n');
    }
  } catch (e) {
    console.warn('Failed to load code:', e);
    if (currentProject && currentProject.starterCode) {
      editor.setValue(currentProject.starterCode);
    }
  }
}

function saveManualStepStates() {
  if (!currentProject) return;
  const key = `pp-steps-${currentProject.id}`;
  try {
    localStorage.setItem(key, JSON.stringify(manualStepStates));
  } catch (e) {
    console.warn('Failed to save step states:', e);
  }
}

function loadManualStepStates(projectId) {
  const key = `pp-steps-${projectId}`;
  try {
    const saved = localStorage.getItem(key);
    manualStepStates = saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.warn('Failed to load step states:', e);
    manualStepStates = {};
  }
}
```

- [ ] **Step 2: Update reset button to clear storage**

Update the reset button handler:

```javascript
resetBtn.addEventListener('click', () => {
  if (currentProject) {
    editor.setValue(currentProject.starterCode || '# Start coding!\n');
    manualStepStates = {};
    saveManualStepStates();
    saveCode();
  } else {
    editor.setValue('# Start coding!\n');
    saveCode();
  }
  clearTerminal();
  detectSteps();
});
```

- [ ] **Step 3: Verify code persists across refresh**

1. Open `python-playground/?project=snarky-calculator`
2. Type some code: `print("test")`
3. Refresh the page
4. Expected: Code still shows `print("test")`

- [ ] **Step 4: Verify manual step states persist**

1. Check off step 4 (manual step)
2. Refresh page
3. Expected: Step 4 still checked

- [ ] **Step 5: Verify reset clears everything**

1. Click RESET
2. Expected: Code returns to starter code, manual steps unchecked

- [ ] **Step 6: Commit**

```bash
git add python-playground/index.html
git commit -m "feat(python-playground): add localStorage persistence for code and steps"
```

---

## Task 10: Add Responsive Layout

**Files:**
- Modify: `python-playground/shared.css`
- Modify: `python-playground/index.html`

- [ ] **Step 1: Add mobile styles to shared.css**

Append to `shared.css`:

```css
/* === RESPONSIVE === */
@media (max-width: 1024px) {
  .app-container {
    flex-direction: column;
    height: auto;
    min-height: 100vh;
  }

  .project-panel {
    width: 100%;
    max-height: 40vh;
    border-right: none;
    border-bottom: 2px solid var(--neon-purple);
  }

  .project-panel.collapsed {
    max-height: 60px;
    overflow: hidden;
  }

  .project-panel.collapsed .project-content {
    display: none;
  }

  .project-header {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .collapse-btn {
    font-family: 'Press Start 2P', monospace;
    font-size: 10px;
    padding: 6px 12px;
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-dim);
    border-radius: 4px;
    cursor: pointer;
  }

  .collapse-btn:hover {
    border-color: var(--neon-purple);
    color: var(--neon-purple);
  }

  .editor-panel {
    min-height: 300px;
    height: 40vh;
  }

  .terminal-panel {
    width: 100%;
    min-height: 200px;
    height: 30vh;
    border-left: none;
    border-top: 1px solid var(--border);
  }
}

@media (max-width: 600px) {
  .project-selector {
    font-size: 12px;
  }

  .project-title {
    font-size: 10px;
  }

  .terminal-btn {
    font-size: 8px;
    padding: 6px 10px;
  }

  .step-item {
    font-size: 12px;
    padding: 8px 10px;
  }
}
```

- [ ] **Step 2: Add collapse button for mobile**

Update the project-header in `index.html`:

```html
<div class="project-header">
  <select class="project-selector" id="projectSelector">
    <option value="">No project</option>
  </select>
  <button class="collapse-btn hidden" id="collapseBtn">▼</button>
  <h2 class="project-title hidden" id="projectTitle"></h2>
  <p class="project-description hidden" id="projectDescription"></p>
</div>
```

- [ ] **Step 3: Add collapse button logic**

Add after project loading functions:

```javascript
// === RESPONSIVE ===
const collapseBtn = document.getElementById('collapseBtn');
const projectPanel = document.querySelector('.project-panel');

function checkMobile() {
  if (window.innerWidth <= 1024) {
    collapseBtn.classList.remove('hidden');
  } else {
    collapseBtn.classList.add('hidden');
    projectPanel.classList.remove('collapsed');
  }
}

collapseBtn.addEventListener('click', () => {
  projectPanel.classList.toggle('collapsed');
  collapseBtn.textContent = projectPanel.classList.contains('collapsed') ? '▶' : '▼';
});

window.addEventListener('resize', checkMobile);
checkMobile();
```

- [ ] **Step 4: Verify mobile layout**

Open browser DevTools, toggle device toolbar, select mobile viewport (e.g., iPhone). Expected:
- Panels stack vertically
- Collapse button appears in project header
- Clicking collapse hides project content

- [ ] **Step 5: Commit**

```bash
git add python-playground/
git commit -m "feat(python-playground): add responsive layout for tablet/mobile"
```

---

## Task 11: Add README

**Files:**
- Create: `python-playground/README.md`

- [ ] **Step 1: Create README**

```markdown
# Python Playground

A browser-based Python editor and runner for Morey Code Club students.

## Usage

Open in browser:
- `python-playground/` — Free-form sandbox mode
- `python-playground/?project=snarky-calculator` — Load a specific project

## Adding New Projects

1. Create a new file in `projects/` (e.g., `projects/my-project.js`)

2. Export a project config:

```javascript
export default {
  id: 'my-project',           // URL-safe identifier
  title: 'My Project',        // Display name
  description: 'Optional tagline',

  steps: [
    {
      id: 'step-1',
      text: 'Do the first thing',
      detect: (code) => /some_pattern/.test(code)  // Auto-detect
    },
    {
      id: 'step-2',
      text: 'Manually check this step',
      manual: true  // Student clicks to complete
    },
  ],

  hints: [
    { title: 'Hint 1', content: 'Code example here' },
  ],

  starterCode: `# My Project\n\n`,
};
```

3. Add to manifest in `projects/index.js`:

```javascript
export default [
  { id: 'snarky-calculator', title: 'Snarky Calculator' },
  { id: 'my-project', title: 'My Project' },  // Add here
];
```

## Tech Stack

- **Skulpt 1.2.0** — Python execution in browser
- **CodeMirror 5.65.16** — Code editor
- **localStorage** — Code and progress persistence
```

- [ ] **Step 2: Commit**

```bash
git add python-playground/README.md
git commit -m "docs(python-playground): add README with project creation guide"
```

---

## Task 12: Final Polish and Hub Integration

**Files:**
- Modify: `python-playground/index.html`
- Modify: `2026/index.html`

- [ ] **Step 1: Add page title update on project load**

In `loadProject()`, after setting `currentProject`, add:

```javascript
document.title = currentProject
  ? `${currentProject.title} — Python Playground`
  : 'Python Playground';
```

- [ ] **Step 2: Add Skulpt interrupt handling for infinite loops**

Update the Skulpt configuration in `runCode()` to add execution limit. Add before the try block:

```javascript
Sk.execLimit = 10000; // 10 second timeout
```

- [ ] **Step 3: Add card to 2026 hub**

Read the current hub structure first, then add a card for Python Playground in the appropriate section.

Add to `2026/index.html` in the projects section:

```html
<a href="../python-playground/" class="project-card">
  <div class="card-icon">🐍</div>
  <h3>Python Playground</h3>
  <p>Write and run Python code in your browser with step-by-step projects</p>
</a>
```

- [ ] **Step 4: End-to-end verification**

1. Open `2026/index.html`, click Python Playground card
2. Select "Snarky Calculator" from dropdown
3. Complete steps by writing code
4. Test input() functionality
5. Verify code persists on refresh
6. Test on mobile viewport

- [ ] **Step 5: Commit**

```bash
git add python-playground/ 2026/index.html
git commit -m "feat(python-playground): add final polish and hub integration"
```

---

## Self-Review Checklist

Before considering this plan complete, verify:

- [ ] **Spec coverage**: All sections of the design spec have corresponding tasks
- [ ] **File paths**: All paths are exact and consistent across tasks
- [ ] **No placeholders**: Every code block is complete and runnable
- [ ] **Type consistency**: Function names, CSS classes, and IDs match across all tasks
- [ ] **Verification steps**: Each task has clear browser verification
