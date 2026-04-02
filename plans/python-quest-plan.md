# Plan: Python Edition of Code Quest

## Decisions
- **Python engine:** Skulpt (synchronous, ~400KB, no pipeline refactoring needed)
- **Lesson scope:** All 10 lessons — Quest I (7) + Quest II (3)

---

## File to Modify

**`code-quest/code-quest.html`** (~3349 lines, single-page app)

---


### Step 1 — Add CDN scripts in <head> (after line 11)
html<!-- CodeMirror Python syntax mode -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js"></script>
<!-- Skulpt: Python-in-browser (synchronous, ~400KB) -->
<script src="https://skulpt.org/js/skulpt.min.js" type="text/javascript"></script>
<script src="https://skulpt.org/js/skulpt-stdlib.js" type="text/javascript"></script>

### Step 2 — Language detection (replace line 1210)
```javascript
const CURRENT_LANGUAGE = new URLSearchParams(window.location.search).get('lang') === 'python' ? 'python' : 'javascript';
```

### Step 3 — Extend LANGUAGE_CONFIG (lines 1212–1218)
Add a python entry:
```javascript
python: {
  name: 'Python',
  codemirrorMode: 'python',
  printFunction: 'print'
}
```

### Step 4 — Make HINT_WORDS language-aware (line 2101)
```javascript
var HINT_WORDS = CURRENT_LANGUAGE === 'python'
  ? {
      'create': 'In Python, just assign directly: <code>name = "value"</code>',
      'print':  'Use <code>print()</code> to print. Example: <code>print("Hello")</code>'
    }
  : {
      'create': 'Use <code>let</code> to create a variable. Example: <code>let name = "value";</code>',
      'print':  'Use <code>console.log()</code> to print. Example: <code>console.log("Hello");</code>'
    };
```

### Step 5 — Add VALIDATORS.python (after line 2368)
Skulpt is synchronous so the existing validation pipeline requires no refactoring.
```javascript
python: {
  execute(code) {
    const capturedOutput = [];
    let capturedVars = {};
    try {
      Sk.configure({
        output: function(text) {
          var line = text.replace(/\n$/, '');
          if (line !== '') capturedOutput.push(line);
        },
        read: function(x) {
          if (Sk.builtinFiles && Sk.builtinFiles.files[x]) return Sk.builtinFiles.files[x];
          throw "File not found: '" + x + "'";
        }
      });
      Sk.importMainWithBody('<stdin>', false, code, true);
      var globals = Sk.globals || {};
      Object.keys(globals).forEach(function(k) {
        if (k.startsWith('__')) return;
        try { capturedVars[k] = Sk.ffi.remapToJs(globals[k]); } catch(e) {}
      });
      return { success: true, vars: capturedVars, output: capturedOutput, error: null };
    } catch(e) {
      var msg = (e.args ? e.args.v[0].v : String(e));
      return { success: false, vars: {}, output: capturedOutput, error: msg };
    }
  },
  checkOutput(result, expectedOutput) { /* ... say 'print()' not 'console.log()' */ },
  checkOutputNotEmpty(result) { /* ... */ },
  checkVariable(result, varName, varType) { /* ... say 'Did you create it?' not 'Did you use let?' */ },
  checkValue(result, varName, expectedValue) { /* ... */ }
}
```

### Step 6 — Insert Python lesson data

Insert `LESSONS_PY_V1` and `LESSONS_PY_V2` before `// Route to the correct lesson set` (currently ~line 2101).

All lessons: `miniGameAfter: null` (mini-games are JS-specific). Validation uses `type: 'output'` or `type: 'outputNotEmpty'`.

**Quest I — 7 lessons (`LESSONS_PY_V1`)**

| # | id | Title | Key Concepts |
|---|----|-------|--------------|
| 1 | `py-output` | Output | `print()`, strings, numbers |
| 2 | `py-string` | Strings | quotes, `+` concatenation, `str()` |
| 3 | `py-variable` | Variables | `name = value` (no `let`), reassignment |
| 4 | `py-operator` | Operators | `+` `-` `*` `/` `//` `%` `**` |
| 5 | `py-comparison` | Comparisons | `==` `!=` `<` `>` `<=` `>=` → prints `True`/`False` |
| 6 | `py-conditional` | Decisions | `if`/`elif`/`else`, colon, indentation |
| 7 | `py-loop` | Loops | `for i in range(n):`, `while` |

**Quest II — 3 lessons (`LESSONS_PY_V2`)**

| # | id | Title | Key Concepts |
|---|----|-------|--------------|
| 1 | `py-list` | Lists | `[1,2,3]`, indexing, `.append()`, `len()` |
| 2 | `py-loop2` | Loop Patterns | `for x in list:`, `enumerate()` |
| 3 | `py-function` | Functions | `def name():`, `return`, parameters |

---

### Step 7 — Update `LESSONS` routing

Replace:
```js
const LESSONS = QUEST_VERSION === 2 ? LESSONS_V2 : LESSONS_V1;
```
With:
```js
const LESSONS =
  CURRENT_LANGUAGE === 'python'
    ? (QUEST_VERSION === 2 ? LESSONS_PY_V2 : LESSONS_PY_V1)
    : (QUEST_VERSION === 2 ? LESSONS_V2    : LESSONS_V1);
```

---

### Step 8 — Update `STATE_KEY`

Replace:
```js
const STATE_KEY = QUEST_VERSION === 2 ? 'codequest_v2_progress' : 'codequest_progress';
```
With:
```js
const STATE_KEY = `codequest_${CURRENT_LANGUAGE}_v${QUEST_VERSION}_progress`;
```

---

### Step 9 — Add language switcher to map view HTML

After the `questIMapLink` div (line ~1097), add:
```html
<div id="langSwitchLink" style="text-align:center; margin-top: 8px;"></div>
```

---

### Step 10 — Update init function

In the existing `if (QUEST_VERSION === 2)` / `if (QUEST_VERSION === 1)` block (~line 3299), add Python-aware logic:

```js
// Set edition subtitle dynamically
var editionLabel = CURRENT_LANGUAGE === 'python'
  ? (QUEST_VERSION === 2 ? 'Python Edition Part II' : 'Python edition')
  : (QUEST_VERSION === 2 ? 'Javascript Edition Part II' : 'Javascript edition');
document.querySelector('#appHeader h1').innerHTML =
  'Code Club Quest <span class="edition-subtitle">' + editionLabel + '</span>';

// Welcome text for Python
if (CURRENT_LANGUAGE === 'python') {
  if (QUEST_VERSION === 2) {
    document.getElementById('welcomeTitle').textContent = 'Welcome to Python Quest II!';
    document.getElementById('welcomeSubtitle').textContent = 'Ready to go deeper — lists, loops, and functions!';
    document.getElementById('mapTitle').textContent = 'Python Quest II Map';
  } else {
    document.getElementById('welcomeTitle').textContent = 'Welcome to Python Quest!';
    document.getElementById('welcomeSubtitle').textContent = 'Learn Python step by step with Mono the Code Monkey!';
    document.getElementById('mapTitle').textContent = 'Python Quest Map';
  }
}

// Quest I/II nav links — preserve ?lang=python
var langParam = CURRENT_LANGUAGE === 'python' ? '&lang=python' : '';
document.querySelector('#questIIMapLink a').href = 'code-quest.html?v=2' + langParam;
document.querySelector('#questIMapLink a').href  = 'code-quest.html?v=1' + langParam;

// Language switcher link
var switchHref = CURRENT_LANGUAGE === 'python'
  ? 'code-quest.html' + (QUEST_VERSION === 2 ? '?v=2' : '')
  : 'code-quest.html?' + (QUEST_VERSION === 2 ? 'v=2&' : '') + 'lang=python';
var switchLabel = CURRENT_LANGUAGE === 'python'
  ? '← Switch to JavaScript Edition'
  : 'Switch to Python Edition →';
document.getElementById('langSwitchLink').innerHTML =
  '<a href="' + switchHref + '" style="color:var(--text-dim);font-size:0.8rem;text-decoration:none;">' + switchLabel + '</a>';
document.getElementById('langSwitchLink').style.display = 'block';
```

---

### Step 11 — Guard `setupAutocomplete` for Python

Change line ~2554:
```js
setupAutocomplete(challengeEditorInstance);
```
To:
```js
if (CURRENT_LANGUAGE !== 'python') setupAutocomplete(challengeEditorInstance);
```


---

## URLs After Implementation

| URL | Result |
|-----|--------|
| `code-quest.html` | JS Quest I (unchanged) |
| `code-quest.html?v=2` | JS Quest II (unchanged) |
| `code-quest.html?lang=python` | Python Quest I |
| `code-quest.html?lang=python&v=2` | Python Quest II |


