# Code Quest

An interactive JavaScript tutorial for elementary/middle school students, featuring a retro gaming aesthetic with "Mono the Code Monkey" as a mascot guide.

## Overview

Code Quest teaches JavaScript fundamentals through a progression-based lesson system. Students complete lessons (explanation → example → coding challenges), earn XP, and unlock mini-games for practice reinforcement.

**Tech Stack:**
- Pure HTML/CSS/JavaScript (single self-contained HTML file)
- CodeMirror 5.65.16 for code editing (with textarea fallback)
- Local storage for progress persistence
- Google Fonts: Press Start 2P, Share Tech Mono, Fredoka

## Structure

```
code-quest/
├── code-quest.html          # Main tutorial hub
└── mini-games/
    ├── speed-type.html      # Typing practice
    ├── bug-squash.html      # Find the bug
    ├── code-scramble.html   # Reorder code lines
    ├── output-guess.html    # Predict code output
    └── variable-match.html  # Memory matching game
```

## Main Tutorial (code-quest.html)

### Views/Screens

1. **Welcome** — Introduction with Mono mascot, "Start Quest" button
2. **Level Map** — Visual node-based progression showing all 7 lessons
3. **Explanation** — Concept introduction with real-world examples
4. **Example** — Annotated code with line-by-line explanations
5. **Challenge** — Interactive coding tasks (editor or multiple choice)
6. **Level Complete** — XP reward + mini-game invitation
7. **Quest Complete** — Final celebration after all levels

### Lessons (7 total)

| # | ID | Title | Key Concepts | Total XP | Mini-Game |
|---|-----|-------|--------------|----------|-----------|
| 1 | `string` | Strings & Numbers | Quotes, text vs numbers, concatenation | 25 | Variable Match |
| 2 | `output` | Output | `console.log()`, printing | 35 | Speed Type |
| 3 | `variable` | Variables | `let`, data types (string/number/boolean) | 45 | Variable Match |
| 4 | `assignment` | Assignment | `=` operator, reassignment | 30 | Bug Squash |
| 5 | `operator` | Operators | `+`, `-`, `*`, `/`, `%` | 60 | Code Scramble |
| 6 | `comparison` | Comparisons | `===`, `!==`, `<`, `>`, `<=`, `>=` | 30 | Output Guess |
| 7 | `conditional` | Decisions | `if`/`else` blocks | 65 | Bug Squash |

**Total XP available:** 290

---

#### Lesson 1: Strings & Numbers (`string`)
**Icon:** 📝 | **XP:** 25 total | **Mini-Game:** Variable Match

**Explanation:**
> A **string** is a piece of text in your code. You wrap text in quotes to tell the computer "this is text, not code." A **number** is just a number with no quotes. The computer treats them very differently!

**Real World:** Strings are like labels — text like your name or a message. Numbers are for math — your age, a score, or a price.

**Mono Says:** "Big difference: '5' is a string (text), but 5 is a number. Quotes change everything!"

**Example Code:**
```javascript
console.log("Hello!");
console.log(42);
console.log("My age is 10");
```
- Line 1: `"Hello!"` is a string — text in quotes
- Line 2: `42` is a number — no quotes needed
- Line 3: You can mix text and numbers inside a string

**Challenges:**

| # | Prompt | Validation | XP |
|---|--------|------------|-----|
| 1 | Type a string with your name (no variable needed) | Contains quoted string | 10 |
| 2 | Quiz: What does `40 + 2` equal? What does `"40" + "2"` equal? | Multiple choice (42, "402") | 15 |

---

#### Lesson 2: Output (`output`)
**Icon:** 📢 | **XP:** 35 total | **Mini-Game:** Speed Type

**Explanation:**
> To make your code **show something on the screen**, you use **console.log()**. Put whatever you want to display inside the parentheses. It can be a string, a number, or even math!

**Real World:** Think of console.log() like a megaphone — it takes whatever you give it and announces it to the world. Without it, your code runs silently!

**Mono Says:** "console.log() is your best friend for seeing what your code is doing. Use it to check your work!"

**Example Code:**
```javascript
console.log("Hello, world!");
console.log(42);
console.log(10 + 5);
```
- Line 1: Prints the string "Hello, world!" to the screen
- Line 2: Prints the number 42
- Line 3: Does the math first (10 + 5 = 15), then prints 15

**Challenges:**

| # | Prompt | Expected Output | XP |
|---|--------|-----------------|-----|
| 1 | Use `console.log()` to print "Hi" | `Hi` | 10 |
| 2 | Use `console.log()` to print 100 | `100` | 10 |
| 3 | Print "Ready?" then print 3 + 2 | `Ready?` `5` | 15 |

---

#### Lesson 3: Variables (`variable`)
**Icon:** 📦 | **XP:** 45 total | **Mini-Game:** Variable Match

**Explanation:**
> A **variable** is like a labeled box that stores a value. You create a variable using the keyword `let`, give it a name, then use `=` to assign a value. The value can be a **string** (text in quotes), a **number**, or a **boolean** (true or false).

**Real World:** Imagine a labeled jar. The label is the variable name. What's inside is the value. You can swap out what's inside anytime!

**Mono Says:** "Variables are how your code remembers things! Without them, your program would forget everything instantly."

**Example Code:**
```javascript
let score = 0;
let playerName = "Alex";
let isPlaying = true;

console.log(playerName);
console.log(score);
```
- Line 1: A number variable — no quotes needed for numbers
- Line 2: A string variable — text goes in quotes
- Line 3: A boolean variable — true or false, no quotes

**Challenges:**

| # | Prompt | Validation | XP |
|---|--------|------------|-----|
| 1 | Create `age` set to your age (number) | `age` is type number | 10 |
| 2 | Create `food` with favorite food, print it | `food` is string + output exists | 15 |
| 3 | Create `game` (string), `lives` (number), `isGameOver` (false) | All 3 variables with correct types | 20 |

---

#### Lesson 4: Assignment (`assignment`)
**Icon:** ⬅️ | **XP:** 30 total | **Mini-Game:** Bug Squash

**Explanation:**
> The **=** sign in code doesn't mean "equals" like in math. It means **"put this value into that variable."** You can change a variable's value anytime by assigning a new one.

**Real World:** Think of your score in a game. It starts at 0, then goes up every time you earn points. The score variable gets updated over and over.

**Mono Says:** "The = sign is the assignment operator. It's like an arrow pointing left — the value on the right goes INTO the variable on the left."

**Example Code:**
```javascript
let score = 0;
console.log(score);

score = 10;
console.log(score);

score = score + 5;
console.log(score);
```
- Line 1: Start with score = 0
- Line 4: Reassign score to 10 (no "let" needed — it already exists)
- Line 7: `score = score + 5` means: take current score (10), add 5, store result (15)

**Challenges:**

| # | Prompt | Expected Final Value | XP |
|---|--------|----------------------|-----|
| 1 | Create `count` = 1, change to 5, print | `count` = 5, output "5" | 10 |
| 2 | Create `health` = 100, subtract 25, subtract 10, print | `health` = 65, output "65" | 20 |

---

#### Lesson 5: Operators (`operator`)
**Icon:** ➕ | **XP:** 60 total | **Mini-Game:** Code Scramble

**Explanation:**
> Operators let you do math and combine values. The basic operators are **+** (add), **-** (subtract), **\*** (multiply), **/** (divide), and **%** (remainder).

**Real World:** Operators are just like the math you already know, except the computer does the calculating. The % (modulo) operator is new — it gives the remainder after division.

**Mono Says:** "Fun fact: + works on strings too! 'Hello' + ' ' + 'World' gives you 'Hello World'."

**Example Code:**
```javascript
let a = 10;
let b = 3;

console.log(a + b);
console.log(a - b);
console.log(a * b);
console.log(a % b);
```
- Line 4: 10 + 3 = 13
- Line 5: 10 - 3 = 7
- Line 6: 10 * 3 = 30 (asterisk means multiply)
- Line 7: 10 % 3 = 1 (remainder: 10 ÷ 3 = 3 remainder 1)

**Challenges:**

| # | Prompt | Expected Value | XP |
|---|--------|----------------|-----|
| 1 | Create `width`=8, `height`=5, calculate `area`, print | `area` = 40 | 15 |
| 2 | Create `total`=100, `discount`=20, calculate `finalPrice`, print | `finalPrice` = 80 | 15 |
| 3 | Given 17 candies and 5 bags, use % to find `leftover` | `leftover` = 2 | 15 |
| 4 | Quiz: What does `*` do? What does `%` do? What is `10 % 3`? | Multiple choice | 15 |

---

#### Lesson 6: Comparisons (`comparison`)
**Icon:** ⚖️ | **XP:** 30 total | **Mini-Game:** Output Guess

**Explanation:**
> Comparison operators ask a yes-or-no question about two values. The answer is always **true** or **false**. Use **===** (equal?), **!==** (not equal?), **<**, **>**, **<=**, and **>=**.

**Real World:** Comparisons are like asking questions: "Is my score higher than the high score?" The computer answers true or false.

**Mono Says:** "Important! Use === (three equals) to compare, not = (one equals). One = means assign, three === means compare!"

**Example Code:**
```javascript
let score = 85;
let passingScore = 70;

console.log(score > passingScore);
console.log(score === 100);
console.log(score >= passingScore);
```
- Line 4: Is 85 greater than 70? true!
- Line 5: Is 85 exactly equal to 100? false
- Line 6: Is 85 greater than or equal to 70? true!

**Challenges:**

| # | Prompt | Validation | XP |
|---|--------|------------|-----|
| 1 | Create `myAge`, check if `canDrive` (myAge >= 16), print | `canDrive` is boolean + output | 15 |
| 2 | Create `a`=10, `b`=10, print `a === b` then `a > b` | Output: `true` `false` | 15 |

---

#### Lesson 7: Decisions (`conditional`)
**Icon:** 🚦 | **XP:** 65 total | **Mini-Game:** Bug Squash

**Explanation:**
> An **if** statement lets your code make decisions. If a condition is true, one block of code runs. If it's false, the **else** block runs instead.

**Real World:** Think of a traffic light. IF the light is green, you go. ELSE (if it's not green), you stop. Your code makes decisions like this constantly.

**Mono Says:** "Conditionals are the brain of your program! Without them, code would just do the same thing every time, no matter what."

**Example Code:**
```javascript
let temperature = 95;

if (temperature > 90) {
  console.log("It's hot outside!");
} else {
  console.log("Not too hot.");
}
```
- Line 1: Set temperature to 95
- Line 3: Check: is temperature > 90? **The check must be inside parentheses ( )**
- Line 4: Since the condition is true, this line runs. The curly braces { } define the block
- Line 5: The else block is skipped because the if was true

**Challenges:**

| # | Prompt | Expected Output | XP |
|---|--------|-----------------|-----|
| 1 | `score`=85, if score >= 70 print "You passed!" else "Try again" | `You passed!` | 20 |
| 2 | `hour`=14, if hour < 12 print "Good morning!" else "Good afternoon!" | `Good afternoon!` | 20 |
| 3 | `lives`=0, if lives === 0 print "Game Over" else "Keep playing!" | `Game Over` | 25 |

---

### Challenge Types

- **Code editor** — Write/modify JavaScript code, auto-validated
- **Multiple choice** — Select correct answers from options

### Validation System

Challenges are validated via `VALIDATORS.javascript`:
- `variable` — Check variable exists with correct type
- `value` — Check variable has specific value
- `output` — Compare `console.log()` output
- `outputNotEmpty` — Ensure something was printed
- `multi` — Combine multiple validations
- `custom` — Custom validator functions
- `multipleChoice` — Quiz-style questions

### Interactive Hint System

Challenge prompts contain clickable "hint words" that show tooltips:
- **"create"** → "Use `let` to create a variable. Example: `let name = 'value';`"
- **"print"** → "Use `console.log()` to print. Example: `console.log('Hello');`"

Students can also click the "Hint" button for challenge-specific guidance with example code.

### XP & Progress

- XP awarded per challenge (10–25 points)
- Progress saved to localStorage (`codequest_progress`)
- Step indicator allows revisiting completed steps within a level

## Mini-Games

All mini-games accept a `?level=<lesson-id>` URL parameter to use content from a specific lesson.

---

### Speed Type (`speed-type.html`)

**Type:** Typing practice

**Gameplay:**
- Type 3 code snippets as fast as possible
- Real-time WPM and error tracking
- Visual cursor shows current position
- Backspace support for corrections

**Metrics:**
- Words per minute (WPM)
- Total errors
- Accuracy percentage
- Total time

**Content:** Level-specific code snippets (6 per level, grouped by difficulty)

---

### Bug Squash (`bug-squash.html`)

**Type:** Find the bug / debugging

**Gameplay:**
- 6 rounds, 3 lives
- Each round shows 4 lines of code with one bug
- Click the buggy line to "squash" it
- Wrong guesses lose a life; correct answers show explanation

**Bug Types:**
- Misspelled keywords (`consloe`, `cosole`)
- Wrong variable names (`colour` vs `color`)
- Wrong operators (`=` vs `===`, `==` vs `=`)
- Missing syntax (`{}`, `()`)

**Scoring:** Count of bugs successfully squashed (out of 6)

---

### Code Scramble (`code-scramble.html`)

**Type:** Code ordering puzzle

**Gameplay:**
- 5 rounds per game
- Phase 1: **Memorize** (3 seconds) — See code in correct order
- Phase 2: **Arrange** — Drag lines into correct order
- Scoring: 100 points max per round, -20 per extra attempt (min 20)

**Interaction:**
- Drag & drop (HTML5 API)
- Touch support for mobile/Chromebook
- Visual feedback for correct/incorrect lines

**Final Score:** Star rating (1–3 stars) based on performance

---

### Output Guess (`output-guess.html`)

**Type:** Multiple choice quiz

**Gameplay:**
- 8 questions per game
- 15-second timer per question
- Read code snippet → predict console output
- 4 answer choices, shuffled each time

**Timer:**
- Visual bar + text countdown
- Color changes: cyan → yellow (9s) → red (5s)

**Scoring:** Correct answers out of 8

---

### Variable Match (`variable-match.html`)

**Type:** Memory matching

**Gameplay:**
- 12 cards (6 pairs) in a 4×3 grid
- Match code expressions with their values
- Card types: "code" (cyan border) and "value" (pink border)
- Timer starts on first flip

**Examples:**
- `let score = 0` ↔ `score is 0`
- `10 + 3` ↔ `13`
- `5 === 5` ↔ `true`

**Metrics:**
- Flip count
- Time elapsed
- Star rating (3 stars ≤14 flips, 2 stars ≤20 flips, 1 star otherwise)

---

## URL Parameters

All mini-games support the `level` parameter:

```
mini-games/speed-type.html?level=variable
mini-games/bug-squash.html?level=conditional
mini-games/code-scramble.html?level=operator
mini-games/output-guess.html?level=comparison
mini-games/variable-match.html?level=string
```

Valid level IDs: `string`, `output`, `variable`, `assignment`, `operator`, `comparison`, `conditional`

## Design System

### Colors (CSS Variables)
- `--bg`: #030310 (dark background)
- `--surface`: #0d0d2b (panels)
- `--neon-cyan`: #00f5ff (primary accent, buttons)
- `--neon-pink`: #ff6b9d (secondary accent)
- `--neon-yellow`: #ffbe0b (XP, scores)
- `--neon-green`: #39ff14 (success, correct)
- `--neon-red`: #ff4444 (errors, wrong)

### Typography
- **Headers:** Press Start 2P (pixel font)
- **Code:** Share Tech Mono
- **Body:** Fredoka

### Visual Effects
- CRT scanline overlay
- Neon glow text shadows
- Pixel art mascot (CSS box-shadow rendering)
- Confetti celebration particles
