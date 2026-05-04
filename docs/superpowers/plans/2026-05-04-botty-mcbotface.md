# Botty McBotface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Botty McBotface" — a bot programming game where students write Python to navigate a grid, collect items, and compete head-to-head with AI commentary.

**Architecture:** Three self-contained HTML pages (student, room, admin) following the Character Clash pattern. A shared game engine (`engine.js`) handles grid logic, energy, collisions, and power-ups. Skulpt runs student Python code, injecting bot API functions that yield actions for the engine to process step-by-step. Supabase provides real-time tournament data. Cerebras LLM + ElevenLabs TTS power sports-style commentary on the room display.

**Tech Stack:** HTML/CSS/JS (no build tools), CodeMirror 5.65.16, Skulpt 1.2.0, Supabase JS v2, Cerebras API, ElevenLabs API, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-05-04-botty-mcbotface-design.md`

---

## File Map

```
botty-mcbotface/
├── student.html      # Name picker, emoji picker, bot naming, CodeMirror editor, test grid, submit
├── room.html         # Full-screen competition grid, scoreboard, AI commentary, TTS
├── admin.html        # Tournament CRUD, approved names, bot list, match queue
├── shared.css        # Shared styles (copy Character Clash pattern, adapt)
├── engine.js         # Grid model, bot state, energy, items, collisions, power-ups, look(), action processing
├── levels.js         # Tutorial level definitions (7 fixed + random generator)
└── sounds/           # Sound effect audio files (footstep, swish, chime, buzz, bonk, jingle, powerup, steal, gameover)
```

Additionally:
- `docs/code_mob_schema.sql` — updated with `bmb_*` table definitions
- `2026/index.html` — new card linking to Botty McBotface

---

## Task 1: Project Directory and Shared CSS

**Files:**
- Create: `botty-mcbotface/shared.css`

This task sets up the project directory and shared styles, copied from Character Clash and adapted for Botty McBotface.

- [ ] **Step 1: Create `botty-mcbotface/shared.css`**

Copy the Character Clash shared.css verbatim as the starting point. The neon retro aesthetic, panel components, button styles, input styles, labels, badges, and CodeMirror overrides all apply directly.

```css
/* botty-mcbotface/shared.css */

@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Share+Tech+Mono&family=Fredoka:wght@400;600&display=swap');

:root {
  --bg: #030310;
  --surface: #0a0a1e;
  --surface2: #12122a;
  --border: #2a2a4a;
  --text: #e8e8f0;
  --text-dim: #8888aa;

  --neon-cyan: #00f5ff;
  --neon-pink: #ff6b9d;
  --neon-yellow: #ffbe0b;
  --neon-green: #39ff14;
  --neon-red: #ff4444;
  --neon-purple: #bf00ff;
  --neon-orange: #ff8c00;
}

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--text);
  font-family: 'Fredoka', sans-serif;
  min-height: 100vh;
}

/* Panel component */
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}

.panel-header {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: var(--neon-purple);
  padding: 12px 16px;
  background: rgba(191, 0, 255, 0.05);
  border-bottom: 1px solid var(--border);
  letter-spacing: 1px;
}

.panel-body {
  padding: 16px;
}

/* Button styles */
.btn {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  padding: 10px 16px;
  border: 2px solid var(--neon-purple);
  background: transparent;
  color: var(--neon-purple);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
  letter-spacing: 1px;
}

.btn:hover {
  background: rgba(191, 0, 255, 0.1);
  box-shadow: 0 0 12px rgba(191, 0, 255, 0.4);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-green {
  border-color: var(--neon-green);
  color: var(--neon-green);
}

.btn-green:hover {
  background: rgba(57, 255, 20, 0.1);
  box-shadow: 0 0 12px rgba(57, 255, 20, 0.4);
}

.btn-pink {
  border-color: var(--neon-pink);
  color: var(--neon-pink);
}

.btn-pink:hover {
  background: rgba(255, 107, 157, 0.1);
  box-shadow: 0 0 12px rgba(255, 107, 157, 0.4);
}

.btn-orange {
  border-color: var(--neon-orange);
  color: var(--neon-orange);
}

.btn-orange:hover {
  background: rgba(255, 140, 0, 0.1);
  box-shadow: 0 0 12px rgba(255, 140, 0, 0.4);
}

/* Input styles */
input, select, textarea {
  font-family: 'Share Tech Mono', monospace;
  font-size: 14px;
  padding: 10px 12px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  outline: none;
}

input:focus, select:focus, textarea:focus {
  border-color: var(--neon-purple);
}

/* Label */
.label {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
  display: block;
}

/* Badge */
.badge {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  padding: 4px 8px;
  border-radius: 3px;
  display: inline-block;
}

.badge-purple {
  background: rgba(191, 0, 255, 0.15);
  color: var(--neon-purple);
  border: 1px solid var(--neon-purple);
}

/* CodeMirror overrides */
.CodeMirror {
  font-family: 'Share Tech Mono', monospace !important;
  font-size: 14px !important;
  height: 300px !important;
  background: var(--surface2) !important;
  border-radius: 0 0 4px 4px;
}
```

- [ ] **Step 2: Commit**

```bash
git add botty-mcbotface/shared.css
git commit -m "feat(botty-mcbotface): add project directory and shared styles"
```

---

## Task 2: Game Engine — Grid Model and Bot State

**Files:**
- Create: `botty-mcbotface/engine.js`

The engine is the core of the game. This task builds the grid model, bot state management, and basic action processing (move, turn, look) without power-ups. Power-ups are added in Task 5.

- [ ] **Step 1: Create `engine.js` with grid and bot model**

```javascript
// botty-mcbotface/engine.js

// Direction vectors: 0=up, 1=right, 2=down, 3=left
const DIR_NAMES = ['up', 'right', 'down', 'left'];
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

const GOOD_ITEMS = ['🍕', '🍩', '💎', '🍪', '🧁', '🍫', '🎁', '🍭'];
const BAD_ITEMS = ['💣', '💀', '🔥', '💩', '🕷️', '👻'];
const POWER_ITEMS = ['⭐', '🍄'];

function itemType(emoji) {
  if (GOOD_ITEMS.includes(emoji)) return 'good';
  if (BAD_ITEMS.includes(emoji)) return 'bad';
  if (emoji === '⭐') return 'star';
  if (emoji === '🍄') return 'mushroom';
  return '';
}

function lookCategory(type) {
  if (type === 'good') return 'good';
  if (type === 'bad') return 'bad';
  if (type === 'star' || type === 'mushroom') return 'power';
  return '';
}

class Grid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    // cells[y][x] = { wall: bool, item: string|null }
    this.cells = [];
    for (let y = 0; y < height; y++) {
      const row = [];
      for (let x = 0; x < width; x++) {
        row.push({ wall: false, item: null });
      }
      this.cells.push(row);
    }
  }

  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  isWall(x, y) {
    if (!this.inBounds(x, y)) return true;
    return this.cells[y][x].wall;
  }

  getItem(x, y) {
    if (!this.inBounds(x, y)) return null;
    return this.cells[y][x].item;
  }

  removeItem(x, y) {
    if (this.inBounds(x, y)) {
      this.cells[y][x].item = null;
    }
  }

  setWall(x, y) {
    if (this.inBounds(x, y)) {
      this.cells[y][x].wall = true;
    }
  }

  placeItem(x, y, emoji) {
    if (this.inBounds(x, y)) {
      this.cells[y][x].item = emoji;
    }
  }

  countGoodItems() {
    let count = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const item = this.cells[y][x].item;
        if (item && itemType(item) === 'good') count++;
      }
    }
    return count;
  }
}

class Bot {
  constructor(id, name, emoji, x, y, dir, startingEnergy) {
    this.id = id;
    this.name = name;
    this.emoji = emoji;
    this.x = x;
    this.y = y;
    this.dir = dir; // 0-3
    this.energy = startingEnergy;
    this.collected = 0;
    this.alive = true;
    this.powerUp = null; // null | 'star' | 'mushroom'
    this.powerUpMoves = 0;
    this.studentName = '';
  }

  facing() {
    return { x: this.x + DX[this.dir], y: this.y + DY[this.dir] };
  }

  leftDir() {
    return (this.dir + 3) % 4;
  }

  rightDir() {
    return (this.dir + 1) % 4;
  }

  lookDir(relDir) {
    let d;
    if (relDir === 'left') d = this.leftDir();
    else if (relDir === 'right') d = this.rightDir();
    else d = this.dir; // forward
    return { x: this.x + DX[d], y: this.y + DY[d] };
  }
}

class GameEngine {
  constructor(grid, bots, opts = {}) {
    this.grid = grid;
    this.bots = bots; // array of Bot
    this.maxTurns = opts.maxTurns || 200;
    this.turnCount = 0;
    this.events = []; // { botId, type, detail }
    this.finished = false;
  }

  getBotAt(x, y, excludeId) {
    return this.bots.find(b => b.alive && b.id !== excludeId && b.x === x && b.y === y) || null;
  }

  lookResult(bot, relDir) {
    const target = bot.lookDir(relDir);

    // Out of bounds = wall
    if (!this.grid.inBounds(target.x, target.y)) {
      if (bot.powerUp === 'star') return '';
      return 'wall';
    }

    // Check for wall
    if (this.grid.isWall(target.x, target.y)) {
      if (bot.powerUp === 'star') return '';
      return 'wall';
    }

    // Check for other bot
    const otherBot = this.getBotAt(target.x, target.y, bot.id);
    if (otherBot) {
      if (bot.powerUp === 'star') return '';
      if (bot.powerUp === 'mushroom' && !otherBot.powerUp) return '';
      return 'wall';
    }

    // Check for item
    const item = this.grid.getItem(target.x, target.y);
    if (item) {
      const type = itemType(item);
      return lookCategory(type);
    }

    return '';
  }

  processMove(bot) {
    if (!bot.alive) return null;

    bot.energy -= 1;
    const event = { botId: bot.id, botName: bot.name, botEmoji: bot.emoji, type: 'move' };

    const target = bot.facing();

    // Out of bounds
    if (!this.grid.inBounds(target.x, target.y)) {
      if (bot.powerUp !== 'star') {
        event.type = 'hit_wall';
        this.checkEnergy(bot);
        this.events.push(event);
        return event;
      }
    }

    // Wall collision
    if (this.grid.inBounds(target.x, target.y) && this.grid.isWall(target.x, target.y)) {
      if (bot.powerUp === 'star') {
        // Pass through wall
        bot.x = target.x;
        bot.y = target.y;
        this.decrementPowerUp(bot);
      } else {
        event.type = 'hit_wall';
        this.checkEnergy(bot);
        this.events.push(event);
        return event;
      }
    }

    // Bot collision
    const otherBot = this.getBotAt(target.x, target.y, bot.id);
    if (otherBot) {
      if (bot.powerUp === 'star') {
        // Star passes through, steals energy
        bot.x = target.x;
        bot.y = target.y;
        const stolen = Math.min(5, otherBot.energy);
        otherBot.energy -= stolen;
        bot.energy += stolen;
        event.type = 'star_steal';
        event.detail = { targetBot: otherBot.name, stolen };
        if (otherBot.powerUp === 'mushroom') {
          otherBot.powerUp = null;
          otherBot.powerUpMoves = 0;
          event.detail.removedMushroom = true;
        }
        this.checkEnergy(otherBot);
        this.decrementPowerUp(bot);
      } else if (bot.powerUp === 'mushroom' && !otherBot.powerUp) {
        // Mushroom passes through non-powered bot
        bot.x = target.x;
        bot.y = target.y;
        const stolen = Math.min(5, otherBot.energy);
        otherBot.energy -= stolen;
        bot.energy += stolen;
        event.type = 'mushroom_steal';
        event.detail = { targetBot: otherBot.name, stolen };
        this.checkEnergy(otherBot);
        this.decrementPowerUp(bot);
      } else {
        // Blocked by bot
        event.type = 'hit_wall';
        this.checkEnergy(bot);
        this.events.push(event);
        return event;
      }
    } else {
      // Normal move — no wall, no bot
      bot.x = target.x;
      bot.y = target.y;
      this.decrementPowerUp(bot);
    }

    // Collect item at new position
    const item = this.grid.getItem(bot.x, bot.y);
    if (item) {
      const type = itemType(item);
      this.grid.removeItem(bot.x, bot.y);

      if (type === 'good') {
        bot.energy += 10;
        bot.collected++;
        event.type = 'collect_good';
        event.detail = { item };
      } else if (type === 'bad') {
        bot.energy -= 10;
        event.type = 'collect_bad';
        event.detail = { item };
      } else if (type === 'star') {
        bot.powerUp = 'star';
        bot.powerUpMoves = 10;
        event.type = 'collect_star';
        event.detail = { item };
      } else if (type === 'mushroom') {
        bot.powerUp = 'mushroom';
        bot.powerUpMoves = 10;
        event.type = 'collect_mushroom';
        event.detail = { item };
      }
    }

    this.checkEnergy(bot);
    this.events.push(event);
    return event;
  }

  processTurn(bot, n, direction) {
    if (!bot.alive) return null;
    const turns = Math.max(1, Math.min(n || 1, 4));
    for (let i = 0; i < turns; i++) {
      if (direction === 'left') {
        bot.dir = (bot.dir + 3) % 4;
      } else {
        bot.dir = (bot.dir + 1) % 4;
      }
    }
    const event = { botId: bot.id, botName: bot.name, botEmoji: bot.emoji, type: 'turn', detail: { direction, turns } };
    this.events.push(event);
    return event;
  }

  decrementPowerUp(bot) {
    if (bot.powerUp) {
      bot.powerUpMoves--;
      if (bot.powerUpMoves <= 0) {
        bot.powerUp = null;
        bot.powerUpMoves = 0;
      }
    }
  }

  checkEnergy(bot) {
    if (bot.energy <= 0) {
      bot.energy = 0;
      bot.alive = false;
    }
  }

  isFinished() {
    if (this.finished) return true;
    // All bots dead
    if (this.bots.every(b => !b.alive)) {
      this.finished = true;
      return true;
    }
    // All good items collected
    if (this.grid.countGoodItems() === 0) {
      this.finished = true;
      return true;
    }
    // Max turns
    if (this.turnCount >= this.maxTurns) {
      this.finished = true;
      return true;
    }
    return false;
  }

  getScoreboard() {
    return this.bots.map(b => ({
      id: b.id,
      name: b.name,
      emoji: b.emoji,
      studentName: b.studentName,
      energy: b.energy,
      collected: b.collected,
      alive: b.alive,
      powerUp: b.powerUp,
      powerUpMoves: b.powerUpMoves,
    }));
  }

  getWinner() {
    const sorted = [...this.bots].sort((a, b) => {
      if (a.collected !== b.collected) return b.collected - a.collected;
      return b.energy - a.energy;
    });
    return sorted[0] || null;
  }
}
```

- [ ] **Step 2: Verify the file was created**

```bash
ls -la botty-mcbotface/engine.js
```

Expected: file exists.

- [ ] **Step 3: Commit**

```bash
git add botty-mcbotface/engine.js
git commit -m "feat(botty-mcbotface): add game engine with grid, bot, and action processing"
```

---

## Task 3: Level Definitions

**Files:**
- Create: `botty-mcbotface/levels.js`

Define the 7 tutorial levels and the random grid generator.

- [ ] **Step 1: Create `levels.js`**

```javascript
// botty-mcbotface/levels.js

const GOOD_ITEMS = ['🍕', '🍩', '💎', '🍪', '🧁', '🍫', '🎁', '🍭'];
const BAD_ITEMS = ['💣', '💀', '🔥', '💩', '🕷️', '👻'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const LEVELS = [
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Move forward and collect items in a line!',
    width: 6, height: 6,
    intro: 'Use <code>move()</code> to walk forward. Use a <code>for</code> loop to move multiple times!',
    steps: [
      { id: 'use-move', text: 'Use move() to move your bot', detect: (code) => /move\s*\(/.test(code) },
      { id: 'use-for', text: 'Use a for loop to move multiple times', detect: (code) => /for\s+\w+\s+in\s+range/.test(code) },
    ],
    hints: [
      { title: 'Moving once', content: 'move()' },
      { title: 'Moving 5 times', content: 'for i in range(5):\n    move()' },
    ],
    generate(grid, bot) {
      bot.x = 0; bot.y = 2; bot.dir = 1; // facing right
      grid.placeItem(1, 2, pick(GOOD_ITEMS));
      grid.placeItem(2, 2, pick(GOOD_ITEMS));
      grid.placeItem(3, 2, pick(GOOD_ITEMS));
      grid.placeItem(4, 2, pick(GOOD_ITEMS));
      grid.placeItem(5, 2, pick(GOOD_ITEMS));
    },
  },
  {
    id: 'turn-around',
    name: 'Turn Around',
    description: 'Learn to turn and navigate corners!',
    width: 6, height: 6,
    intro: 'Use <code>turn_left()</code> and <code>turn_right()</code> to change direction. Combine with <code>move()</code> to navigate an L-shaped path.',
    steps: [
      { id: 'use-turn', text: 'Use turn_left() or turn_right()', detect: (code) => /turn_(left|right)\s*\(/.test(code) },
      { id: 'collect-all', text: 'Collect all the items', manual: true },
    ],
    hints: [
      { title: 'Turning', content: 'turn_right()\nmove()' },
      { title: 'L-shaped path', content: 'for i in range(3):\n    move()\nturn_right()\nfor i in range(3):\n    move()' },
    ],
    generate(grid, bot) {
      bot.x = 0; bot.y = 0; bot.dir = 1; // facing right
      grid.placeItem(1, 0, pick(GOOD_ITEMS));
      grid.placeItem(2, 0, pick(GOOD_ITEMS));
      grid.placeItem(3, 0, pick(GOOD_ITEMS));
      // Turn down
      grid.placeItem(3, 1, pick(GOOD_ITEMS));
      grid.placeItem(3, 2, pick(GOOD_ITEMS));
      grid.placeItem(3, 3, pick(GOOD_ITEMS));
    },
  },
  {
    id: 'look-before-you-leap',
    name: 'Look Before You Leap',
    description: 'Use look() to see what\'s ahead!',
    width: 8, height: 8,
    intro: 'Use <code>look()</code> to check what\'s in front of you. It returns <code>"good"</code> for items, or an empty string for nothing. Use <code>if</code> statements to make decisions!',
    steps: [
      { id: 'use-look', text: 'Use look() to check ahead', detect: (code) => /look\s*\(/.test(code) },
      { id: 'use-if', text: 'Use an if statement', detect: (code) => /\bif\b/.test(code) },
    ],
    hints: [
      { title: 'Checking ahead', content: 'if look() == "good":\n    move()' },
      { title: 'Searching pattern', content: 'for i in range(20):\n    if look() == "good":\n        move()\n    else:\n        turn_right()\n        move()' },
    ],
    generate(grid, bot) {
      bot.x = 0; bot.y = 0; bot.dir = 1;
      const positions = [];
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          if (x === 0 && y === 0) continue;
          positions.push({ x, y });
        }
      }
      // Scatter 8 good items randomly
      for (let i = 0; i < 8; i++) {
        const idx = Math.floor(Math.random() * positions.length);
        const pos = positions.splice(idx, 1)[0];
        grid.placeItem(pos.x, pos.y, pick(GOOD_ITEMS));
      }
    },
  },
  {
    id: 'walls',
    name: 'Walls!',
    description: 'Navigate around walls to reach items.',
    width: 8, height: 8,
    intro: 'Walls block your path! Use <code>look()</code> to detect them — it returns <code>"wall"</code>. Use a <code>while</code> loop to keep going until you run out of energy.',
    steps: [
      { id: 'use-while', text: 'Use a while loop', detect: (code) => /while\s+/.test(code) },
      { id: 'check-wall', text: 'Check for walls with look()', detect: (code) => /look\s*\(.*\)\s*==\s*["']wall["']/.test(code) },
    ],
    hints: [
      { title: 'Wall avoidance', content: 'while True:\n    if look() == "wall":\n        turn_right()\n    else:\n        move()' },
    ],
    generate(grid, bot) {
      bot.x = 0; bot.y = 3; bot.dir = 1;
      // Vertical wall in the middle with a gap
      for (let y = 0; y < 8; y++) {
        if (y !== 1 && y !== 6) grid.setWall(4, y);
      }
      // Items on the far side
      grid.placeItem(6, 1, pick(GOOD_ITEMS));
      grid.placeItem(6, 3, pick(GOOD_ITEMS));
      grid.placeItem(6, 5, pick(GOOD_ITEMS));
      grid.placeItem(5, 6, pick(GOOD_ITEMS));
      // Items on near side too
      grid.placeItem(1, 1, pick(GOOD_ITEMS));
      grid.placeItem(2, 5, pick(GOOD_ITEMS));
    },
  },
  {
    id: 'watch-your-step',
    name: 'Watch Your Step',
    description: 'Avoid bad items while collecting good ones!',
    width: 8, height: 8,
    intro: 'Bad items drain your energy! Use <code>look()</code> to tell them apart — <code>"good"</code> vs <code>"bad"</code>. Only move toward good items!',
    steps: [
      { id: 'check-bad', text: 'Check for bad items with look()', detect: (code) => /look\s*\(.*\)\s*==\s*["']bad["']/.test(code) },
      { id: 'avoid-bad', text: 'Avoid bad items by turning', manual: true },
    ],
    hints: [
      { title: 'Avoiding bad items', content: 'if look() == "bad":\n    turn_right()\nelif look() == "good":\n    move()\nelse:\n    move()' },
      { title: 'Directional look', content: 'if look() == "bad":\n    if look("left") != "bad":\n        turn_left()\n        move()\n    else:\n        turn_right()\n        move()' },
    ],
    generate(grid, bot) {
      bot.x = 0; bot.y = 0; bot.dir = 1;
      const positions = [];
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          if (x === 0 && y === 0) continue;
          positions.push({ x, y });
        }
      }
      // Shuffle and place items
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      for (let i = 0; i < 8; i++) {
        grid.placeItem(positions[i].x, positions[i].y, pick(GOOD_ITEMS));
      }
      for (let i = 8; i < 14; i++) {
        grid.placeItem(positions[i].x, positions[i].y, pick(BAD_ITEMS));
      }
    },
  },
  {
    id: 'the-gauntlet',
    name: 'The Gauntlet',
    description: 'Walls + good items + bad items. The real test!',
    width: 10, height: 10,
    intro: 'Everything you\'ve learned comes together. Navigate walls, collect good items, avoid bad ones. Good luck!',
    steps: [
      { id: 'use-all', text: 'Use move(), turn, look(), if, and a loop', detect: (code) => /move\s*\(/.test(code) && /turn_(left|right)\s*\(/.test(code) && /look\s*\(/.test(code) && /\bif\b/.test(code) && /(for|while)\s+/.test(code) },
      { id: 'survive', text: 'Collect items without running out of energy', manual: true },
    ],
    hints: [
      { title: 'Full strategy', content: 'while True:\n    if look() == "wall" or look() == "bad":\n        if look("right") != "wall" and look("right") != "bad":\n            turn_right()\n        else:\n            turn_left()\n    else:\n        move()' },
    ],
    generate(grid, bot) {
      bot.x = 0; bot.y = 0; bot.dir = 1;
      // Random walls
      const wallCount = 12;
      const positions = [];
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          if (x === 0 && y === 0) continue;
          positions.push({ x, y });
        }
      }
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      let idx = 0;
      for (let i = 0; i < wallCount && idx < positions.length; i++, idx++) {
        grid.setWall(positions[idx].x, positions[idx].y);
      }
      for (let i = 0; i < 10 && idx < positions.length; i++, idx++) {
        grid.placeItem(positions[idx].x, positions[idx].y, pick(GOOD_ITEMS));
      }
      for (let i = 0; i < 6 && idx < positions.length; i++, idx++) {
        grid.placeItem(positions[idx].x, positions[idx].y, pick(BAD_ITEMS));
      }
    },
  },
  {
    id: 'power-up',
    name: 'Power Up!',
    description: 'Grab power-ups to gain special abilities!',
    width: 10, height: 10,
    intro: 'Star ⭐ makes you invincible — pass through walls and bots! Mushroom 🍄 lets you pass through other bots. Use <code>look()</code> — power-ups show as <code>"power"</code>.',
    steps: [
      { id: 'check-power', text: 'Check for power-ups with look()', detect: (code) => /look\s*\(.*\)\s*==\s*["']power["']/.test(code) },
      { id: 'grab-power', text: 'Collect a power-up', manual: true },
    ],
    hints: [
      { title: 'Prioritize power-ups', content: 'if look() == "power":\n    move()  # grab it!\nelif look() == "good":\n    move()\nelif look() == "wall" or look() == "bad":\n    turn_right()' },
    ],
    generate(grid, bot) {
      bot.x = 0; bot.y = 0; bot.dir = 1;
      const positions = [];
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          if (x === 0 && y === 0) continue;
          positions.push({ x, y });
        }
      }
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      let idx = 0;
      // Walls
      for (let i = 0; i < 10 && idx < positions.length; i++, idx++) {
        grid.setWall(positions[idx].x, positions[idx].y);
      }
      // Good items
      for (let i = 0; i < 8 && idx < positions.length; i++, idx++) {
        grid.placeItem(positions[idx].x, positions[idx].y, pick(GOOD_ITEMS));
      }
      // Bad items
      for (let i = 0; i < 5 && idx < positions.length; i++, idx++) {
        grid.placeItem(positions[idx].x, positions[idx].y, pick(BAD_ITEMS));
      }
      // Power-ups
      if (idx < positions.length) {
        grid.placeItem(positions[idx].x, positions[idx].y, '⭐');
        idx++;
      }
      if (idx < positions.length) {
        grid.placeItem(positions[idx].x, positions[idx].y, '🍄');
        idx++;
      }
    },
  },
];

function generateRandomGrid(difficulty, width, height) {
  const grid = new Grid(width, height);

  const settings = {
    easy: { walls: 5, good: 12, bad: 3, powers: 0 },
    medium: { walls: 12, good: 10, bad: 6, powers: 1 },
    hard: { walls: 18, good: 8, bad: 8, powers: 2 },
  };
  const s = settings[difficulty] || settings.medium;

  const positions = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      positions.push({ x, y });
    }
  }
  // Shuffle
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Reserve first few positions for bot start (skip them)
  let idx = 4;

  for (let i = 0; i < s.walls && idx < positions.length; i++, idx++) {
    grid.setWall(positions[idx].x, positions[idx].y);
  }
  for (let i = 0; i < s.good && idx < positions.length; i++, idx++) {
    grid.placeItem(positions[idx].x, positions[idx].y, pick(GOOD_ITEMS));
  }
  for (let i = 0; i < s.bad && idx < positions.length; i++, idx++) {
    grid.placeItem(positions[idx].x, positions[idx].y, pick(BAD_ITEMS));
  }
  for (let i = 0; i < s.powers && idx < positions.length; i++, idx++) {
    grid.placeItem(positions[idx].x, positions[idx].y, i === 0 ? '⭐' : '🍄');
  }

  return grid;
}
```

- [ ] **Step 2: Commit**

```bash
git add botty-mcbotface/levels.js
git commit -m "feat(botty-mcbotface): add tutorial levels and random grid generator"
```

---

## Task 4: Sound Effects

**Files:**
- Create: `botty-mcbotface/sounds/` directory

Sound effects will be generated programmatically using the Web Audio API rather than shipping audio files. This keeps deployment simple (no assets to host) and matches the retro aesthetic.

- [ ] **Step 1: Add a `createSounds()` function to `engine.js`**

Append this to the bottom of `engine.js`:

```javascript
// Sound effects via Web Audio API
function createSounds() {
  let ctx;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function playTone(freq, duration, type = 'square', volume = 0.15) {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  }

  function playNotes(notes, type = 'square', volume = 0.15) {
    const c = getCtx();
    let t = c.currentTime;
    for (const [freq, dur] of notes) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = volume;
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    }
  }

  function noise(duration, volume = 0.1) {
    const c = getCtx();
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    const source = c.createBufferSource();
    source.buffer = buffer;
    const gain = c.createGain();
    gain.gain.value = 1;
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    source.connect(gain);
    gain.connect(c.destination);
    source.start();
  }

  return {
    move() { playTone(200, 0.08, 'square', 0.08); },
    turn() { playTone(400, 0.06, 'sine', 0.08); },
    collectGood() { playNotes([[523, 0.08], [659, 0.08], [784, 0.12]], 'square', 0.12); },
    collectBad() { playNotes([[300, 0.1], [200, 0.15]], 'sawtooth', 0.12); },
    hitWall() { noise(0.12, 0.15); },
    starPower() { playNotes([[523, 0.06], [659, 0.06], [784, 0.06], [1047, 0.12]], 'square', 0.15); },
    mushroomPower() { playNotes([[262, 0.08], [330, 0.08], [392, 0.12]], 'triangle', 0.12); },
    steal() { playNotes([[800, 0.06], [600, 0.06], [400, 0.08]], 'sawtooth', 0.1); },
    gameOver() { playNotes([[400, 0.15], [350, 0.15], [300, 0.15], [200, 0.3]], 'square', 0.15); },
  };
}
```

- [ ] **Step 2: Remove the empty `sounds/` directory from the file map**

Since we're using Web Audio API, we don't need the `sounds/` directory. Remove it if it was created.

- [ ] **Step 3: Commit**

```bash
git add botty-mcbotface/engine.js
git commit -m "feat(botty-mcbotface): add retro sound effects via Web Audio API"
```

---

## Task 5: Database Schema

**Files:**
- Modify: `docs/code_mob_schema.sql`

Add the `bmb_*` tables for Botty McBotface tournaments, bots, match queue, and approved names, following the existing RPS Arena / Character Clash patterns.

- [ ] **Step 1: Append BMB tables to the schema file**

Add to the end of `docs/code_mob_schema.sql`:

```sql
CREATE TABLE code_mob.bmb_tournaments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grid_width integer NOT NULL DEFAULT 10,
  grid_height integer NOT NULL DEFAULT 10,
  good_item_count integer NOT NULL DEFAULT 10,
  bad_item_count integer NOT NULL DEFAULT 5,
  wall_count integer NOT NULL DEFAULT 10,
  starting_energy integer NOT NULL DEFAULT 50,
  power_ups_enabled boolean NOT NULL DEFAULT false,
  max_turns integer NOT NULL DEFAULT 200,
  max_bots_per_student integer NOT NULL DEFAULT 3,
  paused boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bmb_tournaments_pkey PRIMARY KEY (id)
);

CREATE TABLE code_mob.bmb_approved_names (
  tournament_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bmb_approved_names_pkey PRIMARY KEY (tournament_id, name),
  CONSTRAINT bmb_approved_names_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES code_mob.bmb_tournaments(id)
);

CREATE TABLE code_mob.bmb_bots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  student_name text NOT NULL,
  bot_name text NOT NULL,
  bot_emoji text NOT NULL DEFAULT '🤖',
  version integer NOT NULL DEFAULT 1,
  code text NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  match_wins integer NOT NULL DEFAULT 0,
  match_losses integer NOT NULL DEFAULT 0,
  total_collected integer NOT NULL DEFAULT 0,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bmb_bots_pkey PRIMARY KEY (id),
  CONSTRAINT bmb_bots_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES code_mob.bmb_tournaments(id)
);

CREATE TABLE code_mob.bmb_match_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL,
  bot_ids uuid[] NOT NULL,
  grid_seed text,
  position integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'playing', 'completed'])),
  winner_bot_id uuid,
  results jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bmb_match_queue_pkey PRIMARY KEY (id),
  CONSTRAINT bmb_match_queue_tournament_id_fkey FOREIGN KEY (tournament_id) REFERENCES code_mob.bmb_tournaments(id)
);
```

- [ ] **Step 2: Create these tables in Supabase**

Run the SQL above in the Supabase SQL editor at `https://supabase.com/dashboard`. This step is manual — cannot be automated from the CLI without the Supabase management API.

- [ ] **Step 3: Commit**

```bash
git add docs/code_mob_schema.sql
git commit -m "feat(botty-mcbotface): add bmb_* database schema"
```

---

## Task 6: Student Page — HTML Structure and Name/Emoji Picker

**Files:**
- Create: `botty-mcbotface/student.html`

This is the largest file. This task creates the full HTML structure, CSS, and the name picker / emoji picker / bot naming UI. The CodeMirror editor, Skulpt execution, grid rendering, and Supabase submission are added in subsequent tasks.

- [ ] **Step 1: Create `student.html` with HTML structure, inline CSS, and name picker**

The file follows the Character Clash student.html pattern: name overlay modal, sidebar, main panel with editor and grid.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Botty McBotface — Student</title>
  <link rel="stylesheet" href="shared.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/material-darker.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/python/python.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/skulpt@1.2.0/dist/skulpt-stdlib.js"></script>

  <style>
    body { min-height: 100vh; padding: 0; overflow-x: hidden; }

    .page-wrapper {
      display: flex;
      flex-direction: row;
      min-height: 100vh;
      gap: 0;
    }

    /* Name selection overlay (same as Character Clash) */
    .name-overlay {
      position: fixed; inset: 0;
      background: rgba(3, 3, 16, 0.95);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
    }
    .name-overlay.hidden { display: none; }

    .name-modal {
      background: var(--surface);
      border: 2px solid var(--neon-purple);
      border-radius: 8px;
      padding: 32px 40px;
      text-align: center;
      box-shadow: 0 0 40px rgba(191, 0, 255, 0.3);
    }

    .name-modal-title {
      font-family: 'Press Start 2P', monospace;
      font-size: 16px;
      color: var(--neon-purple);
      text-shadow: 0 0 16px var(--neon-purple);
      margin-bottom: 24px;
    }

    .name-modal-subtitle {
      font-family: 'Fredoka', sans-serif;
      font-size: 14px;
      color: var(--text-dim);
      margin-bottom: 20px;
    }

    .name-select {
      width: 100%;
      font-family: 'Share Tech Mono', monospace;
      font-size: 16px;
      padding: 12px 16px;
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--text);
      margin-bottom: 20px;
    }

    .name-submit-btn {
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      padding: 14px 32px;
      background: rgba(191, 0, 255, 0.1);
      border: 2px solid var(--neon-purple);
      color: var(--neon-purple);
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;
    }
    .name-submit-btn:hover { background: rgba(191, 0, 255, 0.2); box-shadow: 0 0 20px rgba(191, 0, 255, 0.5); }
    .name-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Sidebar */
    .sidebar {
      width: 300px; min-width: 260px; max-width: 340px;
      background: var(--surface);
      border-right: 1px solid var(--border);
      padding: 24px 20px;
      display: flex; flex-direction: column; gap: 16px;
      overflow-y: auto;
    }

    .sidebar-title {
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      color: var(--neon-purple);
      text-shadow: 0 0 16px var(--neon-purple);
      line-height: 1.6;
    }

    .sidebar-subtitle {
      font-family: 'Fredoka', sans-serif;
      font-size: 14px;
      color: var(--text-dim);
      margin-top: 4px;
    }

    .name-badge {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-left: 3px solid var(--neon-yellow);
      border-radius: 4px;
      padding: 10px 14px;
      display: flex; align-items: center; gap: 10px;
    }

    .name-badge-label {
      font-family: 'Press Start 2P', monospace;
      font-size: 7px;
      color: var(--neon-yellow);
      text-transform: uppercase;
    }

    .name-badge-value {
      font-family: 'Share Tech Mono', monospace;
      font-size: 15px;
      color: var(--neon-yellow);
    }

    .section-label {
      font-family: 'Press Start 2P', monospace;
      font-size: 8px;
      color: var(--neon-purple);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--border);
    }

    /* API Reference */
    .api-ref {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 12px;
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      line-height: 1.8;
      color: var(--text);
    }
    .api-ref .fn { color: #82aaff; }
    .api-ref .ret { color: #c3e88d; }
    .api-ref .comment { color: #546e7a; }

    /* Emoji picker */
    .emoji-picker {
      display: flex; flex-wrap: wrap; gap: 6px;
    }

    .emoji-btn {
      font-size: 24px;
      width: 40px; height: 40px;
      border: 2px solid var(--border);
      border-radius: 6px;
      background: var(--surface2);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.15s, transform 0.1s;
    }
    .emoji-btn:hover { border-color: var(--neon-cyan); transform: scale(1.1); }
    .emoji-btn.selected { border-color: var(--neon-green); box-shadow: 0 0 10px rgba(57, 255, 20, 0.4); background: rgba(57, 255, 20, 0.08); }

    /* Steps panel (tutorial) */
    .steps-panel {
      background: var(--surface2);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 12px;
    }

    .step-item {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 0;
      font-family: 'Share Tech Mono', monospace;
      font-size: 12px;
      color: var(--text-dim);
    }
    .step-item.done { color: var(--neon-green); }
    .step-check { font-size: 14px; }

    /* Hints */
    .hint-toggle {
      font-family: 'Press Start 2P', monospace;
      font-size: 7px;
      color: var(--neon-cyan);
      background: transparent;
      border: 1px solid var(--neon-cyan);
      border-radius: 3px;
      padding: 4px 8px;
      cursor: pointer;
      margin-top: 8px;
    }
    .hint-content {
      display: none;
      margin-top: 8px;
      background: var(--bg);
      padding: 8px 10px;
      border-radius: 3px;
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      white-space: pre-wrap;
      color: var(--text);
    }
    .hint-content.visible { display: block; }

    /* Main panel */
    .main-panel {
      flex: 1;
      min-width: 0;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      overflow-y: auto;
    }

    /* Bot name + level selector row */
    .controls-row {
      display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;
    }

    .bot-name-input {
      width: 200px;
    }

    .level-select {
      width: 200px;
    }

    .speed-select {
      width: 120px;
    }

    /* Editor */
    .editor-wrap {
      background: var(--surface);
      border: 1px solid var(--border);
      border-top: 3px solid var(--neon-purple);
      border-radius: 4px;
      overflow: hidden;
    }

    .editor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: rgba(191, 0, 255, 0.06);
      border-bottom: 1px solid var(--border);
      gap: 12px;
    }

    .editor-hint {
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      color: var(--text-dim);
    }

    .CodeMirror {
      min-height: 200px;
    }

    /* Button row */
    .btn-row {
      display: flex; gap: 12px;
    }

    .run-btn, .submit-btn {
      flex: 1;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      padding: 14px 24px;
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      border: 2px solid;
      border-radius: 4px;
      cursor: pointer;
      letter-spacing: 1px;
      text-transform: uppercase;
      transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
    }

    .run-btn {
      color: var(--neon-yellow);
      border-color: var(--neon-yellow);
      background: rgba(255, 190, 11, 0.07);
    }
    .run-btn:hover { background: rgba(255, 190, 11, 0.15); box-shadow: 0 0 18px rgba(255, 190, 11, 0.5); }

    .stop-btn {
      color: var(--neon-red);
      border-color: var(--neon-red);
      background: rgba(255, 68, 68, 0.07);
    }

    .reset-btn {
      color: var(--neon-orange);
      border-color: var(--neon-orange);
      background: rgba(255, 140, 0, 0.07);
    }

    .submit-btn {
      color: var(--neon-green);
      border-color: var(--neon-green);
      background: rgba(57, 255, 20, 0.07);
    }
    .submit-btn:hover:not(:disabled) { background: rgba(57, 255, 20, 0.15); box-shadow: 0 0 18px rgba(57, 255, 20, 0.5); }

    .run-btn:disabled, .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .run-btn:active, .submit-btn:active { transform: translateY(1px); }

    /* Grid area */
    .grid-container {
      display: flex; gap: 16px; align-items: flex-start;
    }

    .grid-wrap {
      border: 2px solid var(--border);
      border-radius: 4px;
      background: var(--surface);
      padding: 4px;
      display: inline-block;
    }

    .grid {
      display: grid;
      gap: 1px;
      background: var(--border);
    }

    .cell {
      width: 40px; height: 40px;
      background: var(--surface2);
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
      position: relative;
    }
    .cell.wall { background: #1a1a3a; }
    .cell .dir-indicator {
      position: absolute;
      font-size: 10px;
      color: var(--neon-green);
      pointer-events: none;
    }

    /* Bot glow for star power */
    .cell .bot-star {
      animation: starGlow 0.4s ease-in-out infinite alternate;
    }
    @keyframes starGlow {
      from { filter: drop-shadow(0 0 6px gold); }
      to { filter: drop-shadow(0 0 14px gold) brightness(1.3); }
    }

    /* Bot mushroom size */
    .cell .bot-mushroom {
      font-size: 28px;
    }

    /* Stats panel */
    .stats-panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 16px;
      min-width: 180px;
    }

    .stat-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 0;
      font-family: 'Share Tech Mono', monospace;
      font-size: 13px;
      border-bottom: 1px solid var(--border);
    }
    .stat-row:last-child { border-bottom: none; }
    .stat-label { color: var(--text-dim); }
    .stat-value { color: var(--neon-green); font-family: 'Press Start 2P', monospace; font-size: 12px; }
    .stat-value.danger { color: var(--neon-red); }

    /* Error display */
    .error-area {
      min-height: 32px;
      background: #050516;
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 10px 14px;
      font-family: 'Share Tech Mono', monospace;
      font-size: 13px;
      color: var(--neon-red);
      display: none;
    }
    .error-area.visible { display: block; }

    /* Mobile */
    @media (max-width: 768px) {
      .page-wrapper { flex-direction: column; }
      .sidebar { width: 100%; max-width: 100%; border-right: none; border-bottom: 1px solid var(--border); }
      .main-panel { padding: 16px; }
      .btn-row { flex-direction: column; }
      .grid-container { flex-direction: column; }
    }
  </style>
</head>
<body>

<!-- Name selection overlay -->
<div class="name-overlay" id="name-overlay">
  <div class="name-modal">
    <div class="name-modal-title">BOTTY MCBOTFACE</div>
    <div class="name-modal-subtitle">Select your name to start coding</div>
    <select class="name-select" id="name-select">
      <option value="">Loading names...</option>
    </select>
    <button class="name-submit-btn" id="name-submit-btn" disabled>LET'S GO!</button>
  </div>
</div>

<div class="page-wrapper">

  <!-- Sidebar -->
  <aside class="sidebar">
    <div>
      <div class="sidebar-title">BOTTY MCBOTFACE</div>
      <div class="sidebar-subtitle">Code a bot to collect items!</div>
    </div>

    <div class="name-badge">
      <span class="name-badge-label">Coder</span>
      <span class="name-badge-value" id="display-name">...</span>
    </div>

    <!-- Bot emoji picker -->
    <div>
      <div class="section-label">Your Bot</div>
      <div class="emoji-picker" id="emoji-picker"></div>
    </div>

    <!-- API Reference -->
    <div>
      <div class="section-label">Bot Functions</div>
      <div class="api-ref">
        <span class="fn">move()</span> <span class="comment">— move forward (1 energy)</span><br>
        <span class="fn">turn_left()</span> <span class="comment">— turn left (free)</span><br>
        <span class="fn">turn_right()</span> <span class="comment">— turn right (free)</span><br>
        <span class="fn">look()</span> <span class="comment">— what's ahead?</span><br>
        <span class="fn">look("left")</span> <span class="comment">— what's left?</span><br>
        <span class="fn">look("right")</span> <span class="comment">— what's right?</span><br>
        <br>
        <span class="comment">look() returns:</span><br>
        <span class="ret">""</span> <span class="comment">— empty (falsey)</span><br>
        <span class="ret">"wall"</span> <span class="comment">— wall or bot</span><br>
        <span class="ret">"good"</span> <span class="comment">— good item (+10 ⚡)</span><br>
        <span class="ret">"bad"</span> <span class="comment">— bad item (-10 ⚡)</span><br>
        <span class="ret">"power"</span> <span class="comment">— power-up!</span>
      </div>
    </div>

    <!-- Tutorial steps (populated by JS) -->
    <div id="steps-section" style="display:none;">
      <div class="section-label">Steps</div>
      <div class="steps-panel" id="steps-panel"></div>
      <div id="hints-container"></div>
    </div>
  </aside>

  <!-- Main panel -->
  <main class="main-panel">

    <!-- Controls row -->
    <div class="controls-row">
      <div>
        <label class="label">Bot Name</label>
        <input type="text" class="bot-name-input" id="bot-name" placeholder="e.g. Turbo Taco" maxlength="20">
      </div>
      <div>
        <label class="label">Level</label>
        <select class="level-select" id="level-select">
          <option value="first-steps">1. First Steps</option>
          <option value="turn-around">2. Turn Around</option>
          <option value="look-before-you-leap">3. Look Before You Leap</option>
          <option value="walls">4. Walls!</option>
          <option value="watch-your-step">5. Watch Your Step</option>
          <option value="the-gauntlet">6. The Gauntlet</option>
          <option value="power-up">7. Power Up!</option>
          <option value="random-easy">Random (Easy)</option>
          <option value="random-medium">Random (Medium)</option>
          <option value="random-hard">Random (Hard)</option>
        </select>
      </div>
      <div>
        <label class="label">Speed</label>
        <select class="speed-select" id="speed-select">
          <option value="300">Slow</option>
          <option value="150" selected>Normal</option>
          <option value="50">Fast</option>
          <option value="10">Turbo</option>
        </select>
      </div>
    </div>

    <!-- Editor -->
    <div class="editor-wrap">
      <div class="editor-header">
        <span class="editor-hint">Write your bot's code</span>
        <span class="editor-hint">Ctrl+Enter to run</span>
      </div>
      <textarea id="code-editor"></textarea>
    </div>

    <!-- Buttons -->
    <div class="btn-row">
      <button class="run-btn" id="run-btn">
        <span>&#9654;</span> RUN
      </button>
      <button class="run-btn stop-btn" id="stop-btn" style="display:none;">
        <span>&#9632;</span> STOP
      </button>
      <button class="run-btn reset-btn" id="reset-btn">
        <span>&#8634;</span> RESET
      </button>
      <button class="submit-btn" id="submit-btn" disabled>
        <span>&#10003;</span> SUBMIT
      </button>
    </div>

    <!-- Error area -->
    <div class="error-area" id="error-area"></div>

    <!-- Grid + stats -->
    <div class="grid-container">
      <div class="grid-wrap">
        <div class="grid" id="game-grid"></div>
      </div>
      <div class="stats-panel" id="stats-panel">
        <div class="stat-row"><span class="stat-label">Energy</span><span class="stat-value" id="stat-energy">50</span></div>
        <div class="stat-row"><span class="stat-label">Collected</span><span class="stat-value" id="stat-collected">0</span></div>
        <div class="stat-row"><span class="stat-label">Moves</span><span class="stat-value" id="stat-moves">0</span></div>
        <div class="stat-row"><span class="stat-label">Status</span><span class="stat-value" id="stat-status">Ready</span></div>
      </div>
    </div>

  </main>

</div>

<script type="module">
  // Scripts will be added in subsequent tasks
</script>

</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add botty-mcbotface/student.html
git commit -m "feat(botty-mcbotface): add student.html with structure, name picker, emoji picker, grid UI"
```

---

## Task 7: Student Page — CodeMirror Editor, Skulpt Execution, and Grid Rendering

**Files:**
- Modify: `botty-mcbotface/student.html` (add the `<script>` block)

This task fills in the script block with: CodeMirror editor setup (copied from Python Playground with improvements), Skulpt execution with bot API injection, grid rendering, level loading, and localStorage persistence.

- [ ] **Step 1: Replace the empty `<script type="module">` block with the full script**

Replace `// Scripts will be added in subsequent tasks` with the complete game logic. This is a large block — it includes:

1. Supabase client setup (same URL/key as Character Clash)
2. Name picker logic (fetch approved names, localStorage remember last name)
3. Emoji picker (grid of bot emoji options)
4. CodeMirror editor with Python Playground improvements (Tab as spaces, dedent Backspace, Ctrl+Enter to run)
5. localStorage code persistence (keyed by student name + tournament)
6. Level loading from `levels.js`
7. Grid rendering (render the Grid model to the `#game-grid` div)
8. Skulpt execution with bot API injection (move, turn_left, turn_right, look as Skulpt builtins that yield actions)
9. Action-by-action playback with animation and sound
10. Stats panel updates
11. Tutorial step auto-detection
12. Submit to Supabase

This step requires writing the full inline script. The code is too long to include verbatim in the plan. The implementing agent should:

- Copy the CodeMirror setup from `python-playground/index.html` lines 216-266 (insertSpacesTab, dedentWhitespaceBeforeCursor, editor init)
- Copy the name picker pattern from `character-clash/student.html` lines 724-862 (Supabase client, name overlay logic, localStorage)
- Adapt the Skulpt execution from `character-clash/student.html` test code, but instead of running character functions, inject bot API functions that collect actions into an array
- Import `engine.js` and `levels.js` as modules for the grid/level logic
- Render the grid as a CSS grid of `.cell` divs, each containing emoji for items/walls/bots
- Play back collected actions one at a time using `setTimeout` with configurable speed

Key Skulpt integration pattern — inject bot API as Python builtins that push to an actions array:

```javascript
const actions = [];
let lookFn;

Sk.builtins.move = new Sk.builtin.func(() => {
  actions.push({ type: 'move' });
  return Sk.builtin.none.none$;
});

Sk.builtins.turn_left = new Sk.builtin.func((n) => {
  const turns = n ? Sk.ffi.remapToJs(n) : 1;
  actions.push({ type: 'turn', direction: 'left', turns });
  return Sk.builtin.none.none$;
});

Sk.builtins.turn_right = new Sk.builtin.func((n) => {
  const turns = n ? Sk.ffi.remapToJs(n) : 1;
  actions.push({ type: 'turn', direction: 'right', turns });
  return Sk.builtin.none.none$;
});

Sk.builtins.look = new Sk.builtin.func((dir) => {
  const d = dir ? Sk.ffi.remapToJs(dir) : 'forward';
  const result = lookFn(d);
  return new Sk.builtin.str(result);
});
```

The challenge: `look()` needs to return the current game state, but all actions are collected first and played back later. Solution: use Skulpt's suspension mechanism to run Python code step-by-step, processing one action at a time. Each `move()` / `turn()` call suspends execution, the engine processes the action and updates state, then resumes. This way `look()` always sees the current state.

Alternatively, the simpler approach (used in this project): run the Python code to completion but make `look()` simulate against a shadow copy of the game state that advances as actions are pushed. This means actions array also tracks state changes.

The implementing agent should use the suspension approach for correctness — here is the pattern:

```javascript
Sk.builtins.move = new Sk.builtin.func(() => {
  return new Sk.misceval.promiseToSuspension(
    new Promise((resolve) => {
      actions.push({ type: 'move', resolve });
    })
  );
});
```

Then the playback loop processes one action, calls `resolve()` to resume Python execution, and waits for the next action to appear.

- [ ] **Step 2: Test locally**

Open `botty-mcbotface/student.html` in a browser. Verify:
- Name picker appears (will show "Loading names..." without Supabase connection — that's OK for now)
- Bypass name picker by setting `STUDENT_NAME` in console
- CodeMirror editor loads with starter code
- Emoji picker renders a grid of emoji
- Level selector shows all 7 levels + random modes
- Grid renders for the selected level
- Running starter code moves the bot across the grid
- Sound effects play on actions

- [ ] **Step 3: Commit**

```bash
git add botty-mcbotface/student.html
git commit -m "feat(botty-mcbotface): add editor, Skulpt execution, grid rendering, and game logic to student page"
```

---

## Task 8: Admin Page

**Files:**
- Create: `botty-mcbotface/admin.html`

Follow the Character Clash admin.html pattern. Tournament CRUD, approved names management, bot list, and match queue.

- [ ] **Step 1: Create `admin.html`**

Follow the exact pattern from `character-clash/admin.html` — same Supabase client setup, same connection indicator, same panel-based layout. Adapt the UI for Botty McBotface:

- **Tournament section:** Create tournament with name, grid size (width/height), item counts, wall count, starting energy, power-ups toggle, max turns, max bots per student
- **Approved names section:** Add/remove names, same as Character Clash
- **Bots section:** List submitted bots showing student name, bot name, bot emoji, version, collected stats. Archive button.
- **Match queue section:** Select 2+ bots via checkboxes, queue match button. Show pending/playing/completed matches. Each match shows bot emoji + names.

The implementing agent should reference `character-clash/admin.html` (1265 lines) for the full pattern and adapt it — the Supabase table names change from `cc_*` to `bmb_*`, tournament config fields change, and "characters" become "bots" with different fields.

- [ ] **Step 2: Test locally**

Open `botty-mcbotface/admin.html` in a browser. Verify:
- Connection indicator shows
- Tournament creation form renders with all config fields
- Approved names panel works (add/remove)
- Bots list renders submitted bots
- Match queue section allows selecting bots and queuing matches

- [ ] **Step 3: Commit**

```bash
git add botty-mcbotface/admin.html
git commit -m "feat(botty-mcbotface): add admin page for tournament management"
```

---

## Task 9: Room Page — Grid Display and Round-Robin Match Execution

**Files:**
- Create: `botty-mcbotface/room.html`

The room page displays matches on a projector. This task builds the full-screen grid, scoreboard, and round-robin match execution. AI commentary is added in Task 10.

- [ ] **Step 1: Create `room.html`**

Follow the Character Clash room.html pattern for the outer structure: full-screen layout, header with title and audio toggle, Supabase real-time subscription for match queue, auto-play next match.

The room page layout:
- **Header:** "BOTTY MCBOTFACE" title, tournament name badge, audio toggle
- **Center:** Large grid (cells sized to fill available space)
- **Right sidebar:** Scoreboard showing each bot's emoji, name, student name, energy bar, items collected
- **Bottom:** Commentary text area (subtitles)

Match execution flow:
1. Subscribe to `bmb_match_queue` for `status = 'pending'` rows
2. When a match arrives, update status to `'playing'`
3. Fetch the bot records by ID from `bmb_bots`
4. Generate grid using tournament config (grid size, items, walls, power-ups)
5. Place bots at random positions
6. Run each bot's Python code via Skulpt with the suspension pattern (same as student page)
7. Round-robin: for each turn, advance each bot one action, animate, play sound
8. Update scoreboard after each turn
9. When match ends, update status to `'completed'`, store results as JSON

The grid should use CSS grid with cell size calculated to fill the available viewport:
```javascript
const cellSize = Math.floor(Math.min(
  (window.innerHeight - 200) / grid.height,
  (window.innerWidth - 400) / grid.width
));
```

For multi-bot Skulpt execution, run each bot's code independently using separate Skulpt contexts. Each bot produces actions via the suspension mechanism. The room game loop:
```
1. For each alive bot in round-robin order:
   a. Resume that bot's Skulpt execution until next action
   b. Process the action in the engine
   c. Animate the grid change
   d. Play sound
   e. Check if game is over
2. Increment turn count
3. Repeat until game ends
```

- [ ] **Step 2: Test locally**

This requires a running Supabase instance with the BMB tables and at least one queued match. Test by:
1. Creating a tournament and approved names via admin.html
2. Submitting bots via student.html
3. Queuing a match via admin.html
4. Opening room.html to watch the match play

Verify:
- Grid renders at correct size
- Bots appear and move with animation
- Sound effects play
- Scoreboard updates in real-time
- Match ends correctly (all items collected / energy depleted / max turns)

- [ ] **Step 3: Commit**

```bash
git add botty-mcbotface/room.html
git commit -m "feat(botty-mcbotface): add room page with grid display and round-robin match execution"
```

---

## Task 10: Room Page — AI Commentary with Cerebras + ElevenLabs

**Files:**
- Modify: `botty-mcbotface/room.html`

Add AI commentary to the room page following the Character Clash room pattern for Cerebras API calls and ElevenLabs TTS.

- [ ] **Step 1: Add commentary system to room.html**

Add these components:

**API key management** (same as Character Clash — URL params stored to localStorage):
```javascript
function getCerebrasKey() {
  const params = new URLSearchParams(window.location.search);
  const paramKey = params.get('cerebras');
  if (paramKey) { localStorage.setItem('bmb_cerebras_key', paramKey); return paramKey; }
  return localStorage.getItem('bmb_cerebras_key') || '';
}
const CEREBRAS_API_KEY = getCerebrasKey();

function getElevenLabsKey() {
  const params = new URLSearchParams(window.location.search);
  const paramKey = params.get('elevenlabs');
  if (paramKey) { localStorage.setItem('bmb_elevenlabs_key', paramKey); return paramKey; }
  return localStorage.getItem('bmb_elevenlabs_key') || '';
}
const ELEVENLABS_API_KEY = getElevenLabsKey();
```

**Event log accumulator:**
```javascript
let eventLog = [];
let commentaryCooldown = false;
let commentarySpeaking = false;

function logEvent(event) {
  const descriptions = {
    move: `${event.botName} ${event.botEmoji} moved forward`,
    hit_wall: `${event.botName} ${event.botEmoji} ran into a wall!`,
    collect_good: `${event.botName} ${event.botEmoji} found a ${event.detail?.item}!`,
    collect_bad: `${event.botName} ${event.botEmoji} stepped on a ${event.detail?.item}!`,
    collect_star: `${event.botName} ${event.botEmoji} grabbed a ⭐ and is INVINCIBLE!`,
    collect_mushroom: `${event.botName} ${event.botEmoji} grabbed a 🍄 and POWERED UP!`,
    star_steal: `${event.botName} ${event.botEmoji} charged through ${event.detail?.targetBot} and stole ${event.detail?.stolen} energy!`,
    mushroom_steal: `${event.botName} ${event.botEmoji} barreled through ${event.detail?.targetBot} and stole ${event.detail?.stolen} energy!`,
  };

  const notable = ['hit_wall', 'collect_good', 'collect_bad', 'collect_star', 'collect_mushroom', 'star_steal', 'mushroom_steal'];
  if (!notable.includes(event.type)) return;

  eventLog.push(descriptions[event.type] || `${event.botName} did something`);
  maybeTriggerCommentary(false);
}
```

**Commentary trigger with cooldown pacing:**
```javascript
async function maybeTriggerCommentary(isEndOfMatch) {
  if (!CEREBRAS_API_KEY) return;
  if (commentarySpeaking && !isEndOfMatch) return;
  if (commentaryCooldown && !isEndOfMatch) return;
  if (eventLog.length === 0 && !isEndOfMatch) return;

  const events = eventLog.splice(0);
  if (events.length === 0 && !isEndOfMatch) return;

  commentarySpeaking = true;
  const commentary = await generateCommentary(events, isEndOfMatch);
  if (commentary) {
    showSubtitle(commentary);
    await speakCommentary(commentary);
  }
  commentarySpeaking = false;

  if (!isEndOfMatch) {
    commentaryCooldown = true;
    setTimeout(() => { commentaryCooldown = false; }, 5000);
  }
}
```

**Cerebras LLM call:**
```javascript
async function generateCommentary(events, isEndOfMatch) {
  const scoreboard = engine.getScoreboard();
  const botsDesc = scoreboard.map(b => `${b.name} (${b.emoji}) by ${b.studentName}: ${b.energy} energy, ${b.collected} items`).join('\n');

  const prompt = isEndOfMatch
    ? `The match just ENDED! Here's what happened recently:\n${events.join('\n')}\n\nFinal scores:\n${botsDesc}\n\nGive an exciting final wrap-up in 1-2 sentences. Announce the winner!`
    : `Recent events in the bot battle:\n${events.join('\n')}\n\nCurrent scores:\n${botsDesc}\n\nGive a short, punchy sports commentary line (1-2 sentences). Be funny and dramatic!`;

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CEREBRAS_API_KEY}` },
    body: JSON.stringify({
      model: 'llama3.1-8b',
      messages: [
        { role: 'system', content: 'You are an over-the-top sports commentator for a kids bot programming competition. Be funny, dramatic, and kid-friendly. Keep commentary to 1-2 sentences. Use the bot names and emoji.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}
```

**ElevenLabs TTS** (same pattern as Character Clash — use Xavier/Announcer voice):
```javascript
async function speakCommentary(text) {
  if (!ELEVENLABS_API_KEY || !audioUnlocked) return;
  const voiceId = 'YOq2y2Up4RgXP2HyXjE5'; // Xavier announcer

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_API_KEY },
    body: JSON.stringify({
      text,
      model_id: 'eleven_flash_v2_5',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: 1.0 },
    }),
  });

  if (!response.ok) return;
  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);

  await new Promise((resolve) => {
    audio.onended = () => { URL.revokeObjectURL(audioUrl); resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(audioUrl); resolve(); };
    audio.play().catch(() => resolve());
  });
}
```

**Subtitle display:**
```javascript
function showSubtitle(text) {
  const el = document.getElementById('commentary-text');
  el.textContent = text;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 8000);
}
```

**Match intro commentary** — when a match starts, generate an introduction before the first turn:
```javascript
async function announceMatchIntro(bots) {
  const desc = bots.map(b => `${b.name} ${b.emoji} (by ${b.studentName})`).join(' vs ');
  const events = [`Match starting! Competitors: ${desc}`];
  await maybeTriggerCommentary(false);
}
```

- [ ] **Step 2: Add commentary CSS**

Add to the room.html styles:
```css
#commentary-area {
  position: fixed;
  bottom: 0;
  left: 0; right: 0;
  padding: 16px 24px;
  background: rgba(3, 3, 16, 0.85);
  border-top: 2px solid var(--neon-purple);
  text-align: center;
  pointer-events: none;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}
#commentary-area.visible { transform: translateY(0); }

#commentary-text {
  font-family: 'Fredoka', sans-serif;
  font-size: 18px;
  color: var(--neon-yellow);
  text-shadow: 0 0 12px rgba(255, 190, 11, 0.5);
  line-height: 1.4;
}
```

- [ ] **Step 3: Wire commentary into the game loop**

In the room's main game loop, after each action is processed, call `logEvent(event)`. At match end, call `maybeTriggerCommentary(true)`.

- [ ] **Step 4: Test locally**

Queue a match with 2+ bots via admin. Open room.html with Cerebras/ElevenLabs keys in URL params. Verify:
- Commentary text appears as subtitle during match
- Audio plays through speakers (with audio toggle enabled)
- 5-second cooldown between commentary lines
- Final wrap-up commentary plays immediately at match end
- Commentary mentions bot names and describes events accurately

- [ ] **Step 5: Commit**

```bash
git add botty-mcbotface/room.html
git commit -m "feat(botty-mcbotface): add AI commentary with Cerebras LLM and ElevenLabs TTS"
```

---

## Task 11: Hub Integration

**Files:**
- Modify: `2026/index.html`

Add a Botty McBotface card to the hub page.

- [ ] **Step 1: Add card to `2026/index.html`**

Add a new card in the `card-grid-full` section alongside the existing project cards. Follow the same pattern:

```html
<div class="card">
  <div class="content">
    <div class="front">
      <img src="../assets/images/botty-mcbotface.jpg" width="170" />
      <div style="text-align:justify">
        <p>
          Code a bot to navigate a grid, dodge bombs, and collect items in
          <a href="../botty-mcbotface/student.html">Botty McBotface</a>.
        </p>
      </div>
    </div>
  </div>
</div>
```

Note: The image `assets/images/botty-mcbotface.jpg` will need to be created or a placeholder used. The implementing agent should create a simple placeholder or use an emoji-based image.

- [ ] **Step 2: Commit**

```bash
git add 2026/index.html
git commit -m "feat(botty-mcbotface): add project card to hub page"
```

---

## Task 12: End-to-End Testing and Polish

**Files:**
- All files in `botty-mcbotface/`

This is the final integration test and polish pass.

- [ ] **Step 1: Test the full student flow**

1. Open `student.html` in browser
2. Select name from approved list
3. Pick a bot emoji
4. Name the bot
5. Select Level 1, write `for i in range(5): move()`, click RUN
6. Watch the bot move across the grid, collecting items
7. Verify energy decreases, collected count increases, sounds play
8. Test each subsequent level (2-7) with appropriate code
9. Test random modes (easy/medium/hard)
10. Verify code persists in localStorage across page reloads
11. Submit a bot and verify it appears in admin

- [ ] **Step 2: Test the full admin flow**

1. Create a tournament with specific settings
2. Add approved names
3. See submitted bots
4. Queue a match with 2+ bots
5. Verify match appears in room.html

- [ ] **Step 3: Test the full room flow**

1. Open room.html with API keys
2. Watch a queued match play out
3. Verify round-robin turns, animations, sounds
4. Verify commentary triggers, speaks, and cools down
5. Verify match end detection and final commentary
6. Verify scoreboard accuracy

- [ ] **Step 4: Test power-ups**

1. Create a match with power-ups enabled
2. Verify star makes bot glow, pass through walls/bots
3. Verify mushroom makes bot bigger, pass through non-powered bots
4. Verify energy stealing works correctly
5. Verify star vs mushroom interaction (star wins)
6. Verify look() returns correctly during power-ups

- [ ] **Step 5: Fix any issues found**

Address any bugs, visual glitches, or UX issues discovered during testing.

- [ ] **Step 6: Final commit**

```bash
git add -A botty-mcbotface/
git commit -m "fix(botty-mcbotface): end-to-end testing fixes and polish"
```
