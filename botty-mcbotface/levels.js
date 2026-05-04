// botty-mcbotface/levels.js
// Level definitions and random grid generator for Botty McBotface.
// Loaded via <script src="levels.js"> after engine.js.
// Grid class is defined in engine.js.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------------------------------------------------------------------------
// LEVELS
// ---------------------------------------------------------------------------

const LEVELS = [
  // -------------------------------------------------------------------------
  // Level 1 — First Steps
  // -------------------------------------------------------------------------
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Learn how to move your bot forward.',
    width: 6,
    height: 6,
    intro: `
      <p>Welcome to Botty McBotface! 🤖</p>
      <p>Your bot can move forward one tile at a time using <code>move()</code>.</p>
      <p>There are 5 tasty items in a row in front of you — write a loop to collect them all!</p>
    `,
    steps: [
      {
        id: 'use-move',
        text: 'Call <code>move()</code> at least once',
        detect(code) { return /move\s*\(/.test(code); },
      },
      {
        id: 'use-loop',
        text: 'Use a <code>for</code> loop with <code>range()</code>',
        detect(code) { return /for\s+\w+\s+in\s+range/.test(code); },
      },
    ],
    hints: [
      {
        title: 'Moving once',
        content: 'move()',
      },
      {
        title: 'Moving 5 times',
        content: 'for i in range(5):\n    move()',
      },
    ],
    generate(grid, bot) {
      bot.x = 0;
      bot.y = 2;
      bot.dir = 1; // right
      // 5 good items in a line from (1,2) to (5,2)
      for (let x = 1; x <= 5; x++) {
        grid.placeItem(x, 2, '🍕');
      }
    },
  },

  // -------------------------------------------------------------------------
  // Level 2 — Turn Around
  // -------------------------------------------------------------------------
  {
    id: 'turn-around',
    name: 'Turn Around',
    description: 'Learn how to turn your bot left and right.',
    width: 6,
    height: 6,
    intro: `
      <p>Your bot can turn using <code>turn_left()</code> and <code>turn_right()</code>.</p>
      <p>The items make an L-shape — you'll need to turn a corner to collect them all!</p>
    `,
    steps: [
      {
        id: 'use-turn',
        text: 'Call <code>turn_left()</code> or <code>turn_right()</code>',
        detect(code) { return /turn_(left|right)\s*\(/.test(code); },
      },
      {
        id: 'collect-all',
        text: 'Collect all the items',
        manual: true,
      },
    ],
    hints: [
      {
        title: 'Turning right',
        content: 'turn_right()',
      },
      {
        title: 'Moving along an L-shape',
        content: 'for i in range(3):\n    move()\nturn_right()\nfor i in range(3):\n    move()',
      },
    ],
    generate(grid, bot) {
      bot.x = 0;
      bot.y = 0;
      bot.dir = 1; // right
      // Horizontal row: (1,0),(2,0),(3,0)
      grid.placeItem(1, 0, '🍩');
      grid.placeItem(2, 0, '🍩');
      grid.placeItem(3, 0, '🍩');
      // Vertical drop: (3,1),(3,2),(3,3)
      grid.placeItem(3, 1, '🍩');
      grid.placeItem(3, 2, '🍩');
      grid.placeItem(3, 3, '🍩');
    },
  },

  // -------------------------------------------------------------------------
  // Level 3 — Look Before You Leap
  // -------------------------------------------------------------------------
  {
    id: 'look-before-you-leap',
    name: 'Look Before You Leap',
    description: 'Use look() to check what\'s ahead before moving.',
    width: 8,
    height: 8,
    intro: `
      <p>Your bot can see what's in front of it using <code>look()</code>.</p>
      <p>It returns <code>'good'</code>, <code>'bad'</code>, <code>'wall'</code>, or <code>''</code> (empty).</p>
      <p>Items are scattered across the grid — use <code>look()</code> and <code>if</code> to find them!</p>
    `,
    steps: [
      {
        id: 'use-look',
        text: 'Call <code>look()</code>',
        detect(code) { return /look\s*\(/.test(code); },
      },
      {
        id: 'use-if',
        text: 'Use an <code>if</code> statement',
        detect(code) { return /\bif\b/.test(code); },
      },
    ],
    hints: [
      {
        title: 'Checking what\'s ahead',
        content: "if look() == 'good':\n    move()",
      },
      {
        title: 'Moving until a wall',
        content: "while look() != 'wall':\n    move()",
      },
    ],
    generate(grid, bot) {
      bot.x = 0;
      bot.y = 0;
      bot.dir = 1; // right

      // Place 8 random good items (not on (0,0))
      const placed = new Set(['0,0']);
      const items = ['🍕', '🍩', '💎', '🍪', '🧁', '🍫', '🎁', '🍭'];
      let attempts = 0;
      for (let i = 0; i < items.length && attempts < 200; ) {
        const x = Math.floor(Math.random() * 8);
        const y = Math.floor(Math.random() * 8);
        const key = `${x},${y}`;
        attempts++;
        if (!placed.has(key)) {
          placed.add(key);
          grid.placeItem(x, y, items[i]);
          i++;
        }
      }
    },
  },

  // -------------------------------------------------------------------------
  // Level 4 — Walls!
  // -------------------------------------------------------------------------
  {
    id: 'walls',
    name: 'Walls!',
    description: 'Navigate around walls to find the items.',
    width: 8,
    height: 8,
    intro: `
      <p>Watch out — there's a wall blocking your path!</p>
      <p>Use <code>look()</code> to detect walls and <code>while</code> loops to navigate around them.</p>
    `,
    steps: [
      {
        id: 'use-while',
        text: 'Use a <code>while</code> loop',
        detect(code) { return /while\s+/.test(code); },
      },
      {
        id: 'check-wall',
        text: 'Check for <code>\'wall\'</code> with <code>look()</code>',
        detect(code) { return /look\s*\(.*\)\s*==\s*["']wall["']/.test(code); },
      },
    ],
    hints: [
      {
        title: 'Moving until a wall',
        content: "while look() != 'wall':\n    move()",
      },
      {
        title: 'Turning when blocked',
        content: "if look() == 'wall':\n    turn_right()",
      },
    ],
    generate(grid, bot) {
      bot.x = 0;
      bot.y = 3;
      bot.dir = 1; // right

      // Vertical wall at x=4, except y=1 and y=6
      for (let y = 0; y < 8; y++) {
        if (y !== 1 && y !== 6) {
          grid.setWall(4, y);
        }
      }

      // Good items
      grid.placeItem(6, 1, '💎');
      grid.placeItem(6, 3, '🍕');
      grid.placeItem(6, 5, '🍩');
      grid.placeItem(5, 6, '🍪');
      grid.placeItem(1, 1, '🧁');
      grid.placeItem(2, 5, '🍫');
    },
  },

  // -------------------------------------------------------------------------
  // Level 5 — Watch Your Step
  // -------------------------------------------------------------------------
  {
    id: 'watch-your-step',
    name: 'Watch Your Step',
    description: 'Avoid bad items — they cost you energy!',
    width: 8,
    height: 8,
    intro: `
      <p>Some items are dangerous — picking them up costs you energy!</p>
      <p>Use <code>look()</code> to check if something is <code>'bad'</code> before moving onto it.</p>
    `,
    steps: [
      {
        id: 'check-bad',
        text: 'Check for <code>\'bad\'</code> items with <code>look()</code>',
        detect(code) { return /look\s*\(.*\)\s*==\s*["']bad["']/.test(code); },
      },
      {
        id: 'avoid-bad',
        text: 'Successfully avoid a bad item',
        manual: true,
      },
    ],
    hints: [
      {
        title: 'Avoiding bad items',
        content: "if look() == 'bad':\n    turn_right()\nelse:\n    move()",
      },
      {
        title: 'Only move onto good tiles',
        content: "if look() == 'good':\n    move()",
      },
    ],
    generate(grid, bot) {
      bot.x = 0;
      bot.y = 0;
      bot.dir = 1; // right

      // Shuffle all positions except (0,0)
      const positions = [];
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          if (x === 0 && y === 0) continue;
          positions.push([x, y]);
        }
      }
      // Fisher-Yates shuffle
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }

      const goodItems = ['🍕', '🍩', '💎', '🍪', '🧁', '🍫', '🎁', '🍭'];
      const badItems = ['💣', '💀', '🔥', '💩', '🕷️', '👻'];

      let idx = 0;
      for (let i = 0; i < 8; i++) {
        const [x, y] = positions[idx++];
        grid.placeItem(x, y, goodItems[i % goodItems.length]);
      }
      for (let i = 0; i < 6; i++) {
        const [x, y] = positions[idx++];
        grid.placeItem(x, y, badItems[i % badItems.length]);
      }
    },
  },

  // -------------------------------------------------------------------------
  // Level 6 — The Gauntlet
  // -------------------------------------------------------------------------
  {
    id: 'the-gauntlet',
    name: 'The Gauntlet',
    description: 'A complex grid with walls, good items, and bad items.',
    width: 10,
    height: 10,
    intro: `
      <p>The Gauntlet — a fully random grid with walls, treats, and traps!</p>
      <p>You'll need to use everything you've learned: <code>move()</code>, <code>turn_left()</code>/<code>turn_right()</code>,
      <code>look()</code>, <code>if</code>, and loops.</p>
      <p>Write the smartest bot you can!</p>
    `,
    steps: [
      {
        id: 'use-all',
        text: 'Use move, turn, look, if, and a loop together',
        detect(code) {
          return (
            /move\s*\(/.test(code) &&
            /turn_(left|right)\s*\(/.test(code) &&
            /look\s*\(/.test(code) &&
            /\bif\b/.test(code) &&
            /(for\s+\w+\s+in\s+range|while\s+)/.test(code)
          );
        },
      },
    ],
    hints: [
      {
        title: 'Basic wandering bot',
        content:
          "while True:\n" +
          "    if look() == 'wall':\n" +
          "        turn_right()\n" +
          "    elif look() == 'bad':\n" +
          "        turn_left()\n" +
          "    else:\n" +
          "        move()",
      },
    ],
    generate(grid, bot) {
      bot.x = 0;
      bot.y = 0;
      bot.dir = 1; // right

      const positions = [];
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          if (x === 0 && y === 0) continue;
          positions.push([x, y]);
        }
      }
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }

      let idx = 0;
      // 12 walls
      for (let i = 0; i < 12; i++) {
        const [x, y] = positions[idx++];
        grid.setWall(x, y);
      }
      const goodItems = ['🍕', '🍩', '💎', '🍪', '🧁', '🍫', '🎁', '🍭'];
      const badItems = ['💣', '💀', '🔥', '💩', '🕷️', '👻'];
      // 10 good items
      for (let i = 0; i < 10; i++) {
        const [x, y] = positions[idx++];
        grid.placeItem(x, y, goodItems[i % goodItems.length]);
      }
      // 6 bad items
      for (let i = 0; i < 6; i++) {
        const [x, y] = positions[idx++];
        grid.placeItem(x, y, badItems[i % badItems.length]);
      }
    },
  },

  // -------------------------------------------------------------------------
  // Level 7 — Power Up!
  // -------------------------------------------------------------------------
  {
    id: 'power-up',
    name: 'Power Up!',
    description: 'Collect stars and mushrooms for special abilities.',
    width: 10,
    height: 10,
    intro: `
      <p>Some tiles have power-ups!</p>
      <ul>
        <li>⭐ <strong>Star</strong> — lets you pass through walls and bots, and steals their energy</li>
        <li>🍄 <strong>Mushroom</strong> — lets you pass through other bots and steal their energy</li>
      </ul>
      <p><code>look()</code> returns <code>'power'</code> when a power-up is ahead. Go grab them!</p>
    `,
    steps: [
      {
        id: 'check-power',
        text: 'Check for <code>\'power\'</code> items with <code>look()</code>',
        detect(code) { return /look\s*\(.*\)\s*==\s*["']power["']/.test(code); },
      },
      {
        id: 'collect-powerup',
        text: 'Collect a power-up',
        manual: true,
      },
    ],
    hints: [
      {
        title: 'Seeking power-ups',
        content: "if look() == 'power':\n    move()",
      },
      {
        title: 'Wandering and grabbing power',
        content:
          "while True:\n" +
          "    if look() == 'wall':\n" +
          "        turn_right()\n" +
          "    elif look() == 'bad':\n" +
          "        turn_left()\n" +
          "    else:\n" +
          "        move()",
      },
    ],
    generate(grid, bot) {
      bot.x = 0;
      bot.y = 0;
      bot.dir = 1; // right

      const positions = [];
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          if (x === 0 && y === 0) continue;
          positions.push([x, y]);
        }
      }
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }

      let idx = 0;
      // 10 walls
      for (let i = 0; i < 10; i++) {
        const [x, y] = positions[idx++];
        grid.setWall(x, y);
      }
      const goodItems = ['🍕', '🍩', '💎', '🍪', '🧁', '🍫', '🎁', '🍭'];
      const badItems = ['💣', '💀', '🔥', '💩', '🕷️', '👻'];
      // 8 good items
      for (let i = 0; i < 8; i++) {
        const [x, y] = positions[idx++];
        grid.placeItem(x, y, goodItems[i % goodItems.length]);
      }
      // 5 bad items
      for (let i = 0; i < 5; i++) {
        const [x, y] = positions[idx++];
        grid.placeItem(x, y, badItems[i % badItems.length]);
      }
      // 1 star
      {
        const [x, y] = positions[idx++];
        grid.placeItem(x, y, '⭐');
      }
      // 1 mushroom
      {
        const [x, y] = positions[idx++];
        grid.placeItem(x, y, '🍄');
      }
    },
  },
];

// ---------------------------------------------------------------------------
// generateRandomGrid
// ---------------------------------------------------------------------------

/**
 * Generates a random grid based on difficulty.
 * @param {'easy'|'medium'|'hard'} difficulty
 * @param {number} width
 * @param {number} height
 * @returns {Grid}
 */
function generateRandomGrid(difficulty, width, height) {
  const grid = new Grid(width, height);

  const configs = {
    easy:   { walls: 5,  good: 12, bad: 3, powers: [] },
    medium: { walls: 12, good: 10, bad: 6, powers: ['⭐'] },
    hard:   { walls: 18, good: 8,  bad: 8, powers: ['⭐', '🍄'] },
  };

  const cfg = configs[difficulty] || configs.medium;

  // Build shuffled position list
  const positions = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      positions.push([x, y]);
    }
  }
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  // Skip first 4 positions (reserved for bot start area)
  let idx = 4;

  // Walls
  for (let i = 0; i < cfg.walls && idx < positions.length; i++, idx++) {
    const [x, y] = positions[idx];
    grid.setWall(x, y);
  }

  const goodItems = ['🍕', '🍩', '💎', '🍪', '🧁', '🍫', '🎁', '🍭'];
  const badItems = ['💣', '💀', '🔥', '💩', '🕷️', '👻'];

  // Good items
  for (let i = 0; i < cfg.good && idx < positions.length; i++, idx++) {
    const [x, y] = positions[idx];
    grid.placeItem(x, y, goodItems[i % goodItems.length]);
  }

  // Bad items
  for (let i = 0; i < cfg.bad && idx < positions.length; i++, idx++) {
    const [x, y] = positions[idx];
    grid.placeItem(x, y, badItems[i % badItems.length]);
  }

  // Power-ups
  for (const powerEmoji of cfg.powers) {
    if (idx < positions.length) {
      const [x, y] = positions[idx++];
      grid.placeItem(x, y, powerEmoji);
    }
  }

  return grid;
}
