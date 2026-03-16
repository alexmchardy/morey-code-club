# Code Quest II - Implementation Plan

## Context
Code Quest I is complete with 7 lessons (Strings & Numbers, Output, Variables, Assignment, Operators, Comparisons, Conditionals). Students have learned: strings, numbers, `console.log()`, variables (`let`), assignment (`=`), math operators, comparisons, and `if/else`. Quest II continues with 3 new lessons — Arrays, Loops, Functions — accessed via `?v=2` in the same `code-quest.html` file.

---

## Architecture Changes

### Version routing (`code-quest.html`)
- Detect `?v=2` query parameter: `const QUEST_VERSION = new URLSearchParams(window.location.search).get('v') === '2' ? 2 : 1;`
- Rename existing `LESSONS` → `LESSONS_V1`, add new `LESSONS_V2`, then: `const LESSONS = QUEST_VERSION === 2 ? LESSONS_V2 : LESSONS_V1;`
- Separate localStorage: `const STATE_KEY = QUEST_VERSION === 2 ? 'codequest_v2_progress' : 'codequest_progress';`
- All existing functions already reference `LESSONS` — no changes needed for lesson rendering/validation

### Unified sectioned lesson structure (ALL lessons)
**Both** Quest I and Quest II lessons use a `sections` array — one rendering path for everything. This lets Quest II intersperse explanations and examples between challenges, while Quest I lessons simply have one section each.

```javascript
// Every lesson uses this format:
{
  id: 'string',
  title: 'Strings & Numbers',
  icon: '📝',
  sections: [
    {
      explanation: { title, body, realWorld, monoSays },
      example: { code, output, annotations },
      challenges: [{ ... }, { ... }]
    }
  ],
  miniGameAfter: 'variable-match'
}
```

Quest I lessons have **1 section** each (wrapping their existing explanation/example/challenges). Quest II lessons have **2 sections** each to break up separate concepts.

**Step flow:**
```
1 section:  Learn → Example → C1 → C2 → C3
2 sections: Learn → Example → C1 → C2 → Learn → Example → C3 → C4
```

**Rendering changes (refactor existing code):**
- Replace all references to `lesson.explanation`, `lesson.languages[lang].example`, `lesson.languages[lang].challenges` with section-based access
- Flatten sections into a linear step sequence for the step indicator
- Add `currentSection` to appState for tracking which section we're in
- "Next" button after last challenge in a section → next section's explanation (or level complete if last section)
- `showExplanation()`, `goToExample()`, `showCurrentChallenge()` now take section index
- Step indicator shows all steps across all sections

**Quest I data migration:**
Convert each of the 7 existing lessons from flat format to single-section format. This is a mechanical transformation — wrap `explanation`, `example`, and `challenges` in a `sections: [{ ... }]` array. No content changes needed.

Example migration for Strings lesson:
```javascript
// BEFORE (flat):
{ id: 'string', explanation: {...}, languages: { javascript: { example: {...}, challenges: [...] } } }

// AFTER (sectioned):
{ id: 'string', sections: [{ explanation: {...}, example: {...}, challenges: [...] }] }
```

Note: The `languages` wrapper is removed — `example` and `challenges` move directly into each section. Since `CURRENT_LANGUAGE` is always `'javascript'`, we resolve the language at data definition time rather than at render time.

### Quest I → Quest II link
- **Prominent**: After completing Quest I, the quest complete screen shows a large "Continue the quest here!" button linking to `code-quest.html?v=2`
- **Always accessible**: A smaller link to Quest II always appears at the bottom of the Quest I map view (styled subtly, e.g., dim text link), so students can access it even before completing Quest I

### UI Conditionals (in `init()`)
- Welcome screen: Quest II shows "Welcome to Code Quest II!", "You know the basics — now level up with arrays, loops, and functions!", button: "Continue the Quest"
- Map heading: "Quest II Map"
- Quest Complete text: "You've learned arrays, loops, and functions. You're ready to build amazing things!"

### Infinite loop protection
- Student `while` loops can hang the browser
- In `execute()`, inject loop counter: prepend `var __lc=0;` and replace `while(` with `while(__lc++<10000 && (` + closing `)`
- Friendly error: "Your loop ran too many times! Make sure the condition eventually becomes false."
- Apply always (both quests) since it's a safety net with no downside

### New MINI_GAME_NAMES entries
```javascript
'array-builder': '🧱 Array Builder',
'loop-tracer': '🔍 Loop Tracer',
'function-factory': '🏭 Function Factory'
```

---

## Lesson 8: Arrays (id: `array`, icon: 📋)

### Section 1: Creating Arrays and Accessing Items

**Explanation:**
- **Title**: "Lists of Things: Arrays"
- **Body**: An **array** is a list that holds multiple values in one variable. You create an array using **square brackets [ ]** with items separated by commas. Each item has a position called an **index**, starting at **0** (not 1!).
- **Real World**: Think of an array like a row of lockers. Each locker has a number starting at 0. You can open any locker by its number to see what's inside.
- **Mono Says**: "Arrays start counting at 0, not 1! The first item is at index [0]. It's weird at first, but you'll get used to it!"

**Example:**
```javascript
let fruits = ["apple", "banana", "cherry"];

console.log(fruits[0]);
console.log(fruits[1]);
console.log(fruits[2]);
```
Output: `apple / banana / cherry`

Annotations:
- Line 1: Create an array with 3 strings. The square brackets [ ] make it an array.
- Line 3: `fruits[0]` gets the **first** item — "apple". Remember, arrays start at 0!
- Line 4: `fruits[1]` gets the **second** item — "banana"
- Line 5: `fruits[2]` gets the **third** item — "cherry"

**Challenge 1** (`array-1`, 10 XP): Create an array called `colors` with three colors (strings). Then print the **first** color using its index.
- Validate: custom `validateArrayChallenge1` — checks array exists, has 3+ string items, output matches first element
- Starter: `// Create your colors array\n\n// Print the first color\n`
- Hint: `let colors = ["red", "blue", "green"]; console.log(colors[0]);`

**Challenge 2** (`array-2`, 15 XP): Create an array `scores` with the numbers 90, 85, and 100. Print the **last** score using its index.
- Validate: output === `"100"`
- Starter: `// Create scores array\n\n// Print the last score\n`
- Hint: The last item of 3 is at index [2]! `console.log(scores[2]);`

### Section 2: Length and Push

**Explanation:**
- **Title**: "Growing Your Arrays"
- **Body**: You can check how many items are in an array with **.length**. You can add new items to the end of an array with **.push()**. The array grows automatically!
- **Mono Says**: "Arrays aren't stuck at one size. Use .push() to grow them whenever you need to!"

**Example:**
```javascript
let pets = ["dog", "cat"];
console.log(pets.length);

pets.push("fish");
pets.push("bird");
console.log(pets.length);
console.log(pets[3]);
```
Output: `2 / 4 / bird`

Annotations:
- Line 1: Start with 2 pets
- Line 2: `.length` tells you how many items are in the array (2)
- Line 4: `.push("fish")` adds "fish" to the end — now 3 items
- Line 5: `.push("bird")` adds "bird" — now 4 items
- Line 6: Length is now 4 after pushing twice
- Line 7: `pets[3]` is "bird" — the 4th item at index 3

**Challenge 3** (`array-3`, 15 XP): Create an array `friends` with two names. Use `.push()` to add a third friend. Then print the array's `.length`.
- Validate: custom `validateArrayChallenge3` — checks array, `.push()` in code, length is 3, output is "3"
- Starter: `// Create friends with 2 names\n\n// Add a third friend\n\n// Print the length\n`
- Hint: `friends.push("Jordan"); console.log(friends.length);`

**Challenge 4** (`array-mc`, 15 XP): Multiple choice quiz
- Q1: Given `let pets = ["dog", "cat", "fish"]`, what is `pets[1]`? → "cat"
- Q2: Given `let nums = [10, 20, 30]`, what is `nums.length`? → 3
- Q3: What does `.push("x")` do? → Adds "x" to the end

**Total: 55 XP** | **Steps**: Learn → Ex → C1 → C2 → Learn → Ex → C3 → C4(MC) | Mini-game: `array-builder`

---

## Lesson 9: Loops (id: `loop`, icon: 🔁)

### Section 1: for...of — Looping Through Arrays

**Explanation:**
- **Title**: "Looping Through a List"
- **Body**: A **loop** runs a block of code multiple times. The **for...of** loop goes through each item in an array, one at a time. You write `for (let item of array)` and the code inside the curly braces runs once for each item.
- **Real World**: Think of a loop like dealing cards — you repeat the same action for each player. Instead of writing "deal to player 1, deal to player 2..." you just say "deal to each player."
- **Mono Says**: "Without loops, printing 100 things would take 100 lines of code. With a loop? Just 3 lines!"

**Example:**
```javascript
let snacks = ["chips", "cookies", "fruit"];

for (let snack of snacks) {
  console.log(snack);
}
```
Output: `chips / cookies / fruit`

Annotations:
- Line 1: An array of snacks to loop through
- Line 3: **for...of** — "for each snack in snacks, do this..." The variable `snack` holds each item, one at a time
- Line 4: This line runs 3 times — once for "chips", once for "cookies", once for "fruit"

**Challenge 1** (`loop-1`, 10 XP): Given the array `animals`, use a **for...of** loop to print each animal.
- Validate: output === `"cat\ndog\nfish"`
- Starter: `let animals = ["cat", "dog", "fish"];\n\n// Loop through and print each animal\n`
- Hint: `for (let animal of animals) { console.log(animal); }`

**Challenge 2** (`loop-2`, 15 XP): Given `prices = [10, 20, 30]` and `total = 0`, use a for...of loop to add up all the prices into `total`. Print the total after the loop.
- Validate: multi — value check `total === 60` + output === `"60"`
- Starter: `let prices = [10, 20, 30];\nlet total = 0;\n\n// Loop through prices and add each to total\n\n// Print the total\n`
- Hint: `for (let price of prices) { total = total + price; } console.log(total);`

### Section 2: while — Looping Until Done

**Explanation:**
- **Title**: "Keep Going Until..."
- **Body**: A **while** loop keeps running as long as its condition is true. You check the condition before each loop. **Important:** you must change something inside the loop so the condition eventually becomes false — otherwise the loop runs forever!
- **Mono Says**: "A while loop is like asking 'Are we there yet?' over and over. It keeps going until the answer is finally YES!"

**Example:**
```javascript
let countdown = 5;

while (countdown > 0) {
  console.log(countdown);
  countdown = countdown - 1;
}

console.log("Blast off!");
```
Output: `5 / 4 / 3 / 2 / 1 / Blast off!`

Annotations:
- Line 1: Start countdown at 5
- Line 3: **while** — keep looping as long as countdown is greater than 0
- Line 4: Print the current countdown value
- Line 5: **Subtract 1 each time** — this is crucial! Without it, the loop would never stop
- Line 8: This runs after the loop finishes (when countdown reaches 0)

**Challenge 3** (`loop-3`, 20 XP): Create a variable `countdown` set to 3. Use a **while** loop to print the countdown, subtracting 1 each time. After the loop, print "Go!"
- Validate: output === `"3\n2\n1\nGo!"`
- Starter: `let countdown = 3;\n\n// While countdown is greater than 0, print it and subtract 1\n\n// Print "Go!" after the loop\n`
- Hint: `while (countdown > 0) { console.log(countdown); countdown = countdown - 1; } console.log("Go!");`

**Challenge 4** (`loop-mc`, 15 XP): Multiple choice quiz
- Q1: How many times does this run? `let x = 10; while (x > 7) { x = x - 1; }` → 3 times
- Q2: What does `for (let item of array)` do? → Runs code once for each item in the array
- Q3: What happens if you forget to change the variable in a while loop? → The loop runs forever

**Total: 60 XP** | **Steps**: Learn → Ex → C1 → C2 → Learn → Ex → C3 → C4(MC) | Mini-game: `loop-tracer`

---

## Lesson 10: Functions (id: `function`, icon: ⚙️)

### Section 1: Defining and Calling Functions

**Explanation:**
- **Title**: "Reusable Code: Functions"
- **Body**: A **function** is a named block of code that you can run whenever you want. You **define** it with the `function` keyword, then **call** it by writing its name with **parentheses ()**. The parentheses are what make it run!
- **Real World**: Think of a function like a recipe card. You write it once and file it away. Whenever you want to make that dish, you pull out the card and follow it. You can use it as many times as you want!
- **Mono Says**: "Functions are like superpowers — write the code once, then use it a million times just by calling its name!"

**Example:**
```javascript
function sayGoodMorning() {
  console.log("Good morning!");
  console.log("Time to code!");
}

sayGoodMorning();
sayGoodMorning();
```
Output: `Good morning! / Time to code! / Good morning! / Time to code!`

Annotations:
- Line 1: `function sayGoodMorning()` — defines a function with this name. The code inside doesn't run yet!
- Line 2-3: These lines are stored inside the function, waiting to be called
- Line 6: `sayGoodMorning()` **calls** the function — NOW the code inside runs
- Line 7: Calling it again runs the same code a second time. Two calls, four lines of output!

**Challenge 1** (`function-1`, 10 XP): Create a function called `sayHello` that prints "Hello, world!" inside it. Then **call** your function.
- Validate: custom `validateFunction1` — checks function definition exists, function is called, output is "Hello, world!"
- Starter: `// Define the function\n\n\n// Call the function\n`
- Hint: `function sayHello() { console.log("Hello, world!"); } sayHello();`

### Section 2: Parameters and Return Values

**Explanation:**
- **Title**: "Inputs and Outputs"
- **Body**: Functions can take **parameters** — values you pass in when you call them. They can also **return** a value back to you. Think of parameters as the input and `return` as the output. `return` is different from `console.log()` — return sends the value back silently, while console.log() prints to the screen.
- **Mono Says**: "Parameters go IN, return values come OUT. A function is like a machine — put something in, get something out!"

**Example:**
```javascript
function double(num) {
  return num * 2;
}

console.log(double(5));
console.log(double(12));

let result = double(7);
console.log(result);
```
Output: `10 / 24 / 14`

Annotations:
- Line 1: `double(num)` — "num" is a **parameter**. It's a placeholder for whatever value you pass in.
- Line 2: `return` sends the answer back to where the function was called. It does NOT print!
- Line 5: `double(5)` — calls the function with 5. `num` becomes 5, returns 10. `console.log` prints it.
- Line 6: Same function, different input — `num` becomes 12, returns 24
- Line 8: You can store the return value in a variable too

**Challenge 2** (`function-2`, 15 XP): Create a function called `double` that takes a number as a parameter and **returns** that number multiplied by 2. Then print the result of calling `double(5)`.
- Validate: custom `validateFunction2` — checks function exists, has return, re-executes to verify `double(5) === 10`, output is "10"
- Starter: `// Define the double function\n\n\n// Print double(5)\n`
- Hint: `function double(num) { return num * 2; } console.log(double(5));`

**Challenge 3** (`function-3`, 20 XP): Create a function called `isEven` that takes a number and returns `true` if it's even, or `false` if it's odd. (Hint: use `% 2`). Print the result of `isEven(4)` and `isEven(7)`.
- Validate: custom `validateFunction3` — re-executes with test args, checks `isEven(4) === true`, `isEven(7) === false`, output is "true\nfalse"
- Starter: `// Define isEven\n\n\n// Test it\n`
- Hint: `function isEven(num) { if (num % 2 === 0) { return true; } else { return false; } }`
- Combines: functions + parameters + return + if/else + % operator (all prior concepts!)

**Challenge 4** (`function-mc`, 20 XP): Multiple choice quiz
- Q1: What does `return` do inside a function? → Sends a value back to where the function was called
- Q2: Given `function add(a, b) { return a + b; }`, what is `add(3, 4)`? → 7
- Q3: What happens if you write `greet` without `()`? → Nothing — the function does not run

**Total: 65 XP** | **Steps**: Learn → Ex → C1 → Learn → Ex → C2 → C3 → C4(MC) | Mini-game: `function-factory`

---

## Quest II XP Grand Total: 180 XP

---

## New Custom Validators

Add to `CUSTOM_VALIDATORS` object:

- **`validateArrayChallenge1`**: Checks `colors` is an array of 3+ strings, output matches `colors[0]`
- **`validateArrayChallenge3`**: Checks `friends` is array, code uses `.push(`, length is 3, output is "3"
- **`validateFunction1`**: Regex checks `function sayHello` defined AND called (not just defined), output is "Hello, world!"
- **`validateFunction2`**: Checks `function double` exists, has `return`, re-executes `double(5)` in sandbox to verify returns 10, output is "10"
- **`validateFunction3`**: Checks `function isEven` exists, re-executes with args 4 and 7 to verify boolean returns, output is "true\nfalse"

Function validators re-execute by appending `return fnName(args)` to student code and running through `new Function()`.

---

## New Mini-Games (3 new HTML files)

### 🧱 Array Builder (`mini-games/array-builder.html`)
- **Mechanic**: Given a target array, drag value tiles into the correct order to build it. Empty array slots numbered [0], [1], [2]... to reinforce indexing. Distractor tiles included.
- **Two phases**: "Build" rounds (drag tiles into array slots) and "Index" rounds (given an array, click the value at index N)
- **5 rounds**, 12-second timer each. 100pts per round, -20 per wrong placement.
- **`?level=`**: Controls value types (array → all types, string → string values only)

### 🔍 Loop Tracer (`mini-games/loop-tracer.html`)
- **Mechanic**: See a loop code snippet, predict the complete output by selecting/ordering output lines from options. After submission, animated step-through shows each iteration with variable values highlighted.
- **Example**: `for (let n of [2, 4, 6]) { sum = sum + n; console.log(sum); }` — select `2`, `6`, `12`
- **5 rounds**, 15-second timer each. Mix of for...of and while loops (no counting for).
- **`?level=`**: Controls loop types (loop → all types, array → for...of only)

### 🏭 Function Factory (`mini-games/function-factory.html`)
- **Mechanic**: Factory metaphor — function "machine" on screen, input values slide in on conveyor, player picks correct return value from 4 options.
- **Example**: `function double(n) { return n * 2; }` — input: 7 — options: [7, 14, 9, 72]
- **5 rounds**, 12-second timer each. Functions use concepts from both Quests.
- **`?level=`**: Controls complexity (function → dedicated, operator → math functions, comparison → boolean returns)

---

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `code-quest/code-quest.html` | Modify | Version routing, sectioned lesson rendering, LESSONS_V2, custom validators, UI conditionals, loop protection, MINI_GAME_NAMES, Quest I→II link |
| `code-quest/mini-games/array-builder.html` | Create | Array Builder mini-game |
| `code-quest/mini-games/loop-tracer.html` | Create | Loop Tracer mini-game |
| `code-quest/mini-games/function-factory.html` | Create | Function Factory mini-game |

## Implementation Order

1. **Migrate Quest I to sections format** — Convert all 7 existing lessons from flat format to `sections: [{ explanation, example, challenges }]`. Remove the `languages` wrapper (resolve to javascript at definition time). This is a mechanical data transformation only — no content changes.
2. **Refactor rendering for sections** — Update `showExplanation()`, `goToExample()`, `showCurrentChallenge()`, `updateStepIndicator()`, `navigateToStep()`, and `completeLevel()` to iterate sections. Add `currentSection` to appState. Flatten sections into linear step list for the step indicator.
3. **Verify Quest I still works** with the new sections-based rendering (all 7 lessons, all challenges, all mini-games).
4. **Add version detection + state separation** (`QUEST_VERSION`, `STATE_KEY`, `LESSONS_V1`/`LESSONS_V2`).
5. **Add `LESSONS_V2` array** with all 3 multi-section lessons (Arrays, Loops, Functions).
6. **Add 5 custom validators** for array/function challenges.
7. **Add infinite loop protection** in `execute()`.
8. **Update UI conditionals** (welcome, map title, quest complete text).
9. **Add Quest I → II link** (prominent on quest complete, subtle on map).
10. **Update `MINI_GAME_NAMES` registry** with 3 new entries.
11. **Create `array-builder.html`** mini-game.
12. **Create `loop-tracer.html`** mini-game.
13. **Create `function-factory.html`** mini-game.

## Verification
- Open `code-quest.html` — confirm Quest I still works after sections migration (all 7 lessons, challenges, step indicator, navigation, mini-games)
- Confirm subtle Quest II link visible on Quest I map
- Complete Quest I, confirm prominent "Continue the quest here!" appears
- Open `code-quest.html?v=2` — confirm Quest II welcome, map with 3 levels
- Complete all 3 Quest II levels, verifying multi-section flow (Learn → Ex → C1 → C2 → Learn → Ex → C3 → C4)
- Verify step indicator shows all steps across sections with correct clickable navigation
- Test while loop with intentional infinite loop — verify protection
- Test function challenges — verify sandbox re-execution validates return values
- Test each mini-game standalone and via level-complete link
- Test localStorage isolation — progress in one quest doesn't affect the other
- Test on Chromebook viewport (1366x768)
