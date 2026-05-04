// botty-mcbotface/engine.js
// Game engine for Botty McBotface — loaded via <script src="engine.js">
// All exports are globals (no ES modules).

const DIR_NAMES = ['up', 'right', 'down', 'left'];
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];

const GOOD_ITEMS = ['🍕', '🍩', '💎', '🍪', '🧁', '🍫', '🎁', '🍭'];
const BAD_ITEMS = ['💣', '💀', '🔥', '💩', '🕷️', '👻'];

/**
 * Returns the type of an item emoji.
 * @param {string} emoji
 * @returns {'good'|'bad'|'star'|'mushroom'|''}
 */
function itemType(emoji) {
  if (emoji === '⭐') return 'star';
  if (emoji === '🍄') return 'mushroom';
  if (GOOD_ITEMS.includes(emoji)) return 'good';
  if (BAD_ITEMS.includes(emoji)) return 'bad';
  return '';
}

/**
 * Returns the look category for a given item type.
 * @param {string} type
 * @returns {'good'|'bad'|'power'|''}
 */
function lookCategory(type) {
  if (type === 'good') return 'good';
  if (type === 'bad') return 'bad';
  if (type === 'star' || type === 'mushroom') return 'power';
  return '';
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

class Grid {
  /**
   * @param {number} width
   * @param {number} height
   */
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.cells = [];
    for (let y = 0; y < height; y++) {
      this.cells[y] = [];
      for (let x = 0; x < width; x++) {
        this.cells[y][x] = { wall: false, item: null };
      }
    }
  }

  /** @returns {boolean} */
  inBounds(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /** Returns true if out of bounds OR the tile is a wall. */
  isWall(x, y) {
    if (!this.inBounds(x, y)) return true;
    return this.cells[y][x].wall;
  }

  /** @returns {string|null} */
  getItem(x, y) {
    if (!this.inBounds(x, y)) return null;
    return this.cells[y][x].item;
  }

  removeItem(x, y) {
    if (this.inBounds(x, y)) this.cells[y][x].item = null;
  }

  setWall(x, y) {
    if (this.inBounds(x, y)) this.cells[y][x].wall = true;
  }

  placeItem(x, y, emoji) {
    if (this.inBounds(x, y)) this.cells[y][x].item = emoji;
  }

  /** Counts remaining good items on the grid. */
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

// ---------------------------------------------------------------------------
// Bot
// ---------------------------------------------------------------------------

class Bot {
  /**
   * @param {string} id
   * @param {string} name
   * @param {string} emoji
   * @param {number} x
   * @param {number} y
   * @param {number} dir  0=up 1=right 2=down 3=left
   * @param {number} startingEnergy
   */
  constructor(id, name, emoji, x, y, dir, startingEnergy) {
    this.id = id;
    this.name = name;
    this.emoji = emoji;
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.energy = startingEnergy;
    this.collected = 0;
    this.alive = true;
    this.powerUp = null;       // null | 'star' | 'mushroom'
    this.powerUpMoves = 0;
    this.studentName = '';
  }

  /** @returns {{ x: number, y: number }} tile directly in front of the bot */
  facing() {
    return {
      x: this.x + DX[this.dir],
      y: this.y + DY[this.dir],
    };
  }

  /** Direction index turned 90° left */
  leftDir() {
    return (this.dir + 3) % 4;
  }

  /** Direction index turned 90° right */
  rightDir() {
    return (this.dir + 1) % 4;
  }

  /**
   * Returns the tile position in the given relative direction.
   * @param {'forward'|'left'|'right'} relDir
   * @returns {{ x: number, y: number }}
   */
  lookDir(relDir) {
    let d;
    if (relDir === 'left') {
      d = this.leftDir();
    } else if (relDir === 'right') {
      d = this.rightDir();
    } else {
      d = this.dir; // forward
    }
    return {
      x: this.x + DX[d],
      y: this.y + DY[d],
    };
  }
}

// ---------------------------------------------------------------------------
// GameEngine
// ---------------------------------------------------------------------------

class GameEngine {
  /**
   * @param {Grid} grid
   * @param {Bot[]} bots
   * @param {{ maxTurns?: number }} opts
   */
  constructor(grid, bots, opts = {}) {
    this.grid = grid;
    this.bots = bots;
    this.maxTurns = opts.maxTurns || 200;
    this.turnCount = 0;
    this.events = [];
  }

  /**
   * Returns the alive bot at (x, y), optionally excluding a bot by id.
   * @param {number} x
   * @param {number} y
   * @param {string} [excludeId]
   * @returns {Bot|null}
   */
  getBotAt(x, y, excludeId) {
    for (const bot of this.bots) {
      if (!bot.alive) continue;
      if (excludeId && bot.id === excludeId) continue;
      if (bot.x === x && bot.y === y) return bot;
    }
    return null;
  }

  /**
   * Returns what the bot sees in the given relative direction at n steps away.
   * @param {Bot} bot
   * @param {'forward'|'left'|'right'} relDir
   * @param {number} [n=1]
   * @returns {''|'wall'|'good'|'bad'|'power'}
   */
  lookResult(bot, relDir, n = 1) {
    let d;
    if (relDir === 'left') d = bot.leftDir();
    else if (relDir === 'right') d = bot.rightDir();
    else d = bot.dir;
    const x = bot.x + DX[d] * n;
    const y = bot.y + DY[d] * n;

    const starPowered = bot.powerUp === 'star';
    const mushroomPowered = bot.powerUp === 'mushroom';

    // Out of bounds — always impassable, even with star power
    if (!this.grid.inBounds(x, y)) {
      return 'wall';
    }
    // Interior wall tile — star power can pass through
    if (this.grid.isWall(x, y)) {
      return starPowered ? '' : 'wall';
    }

    // Another bot
    const other = this.getBotAt(x, y, bot.id);
    if (other) {
      if (starPowered) return '';
      if (mushroomPowered && !other.powerUp) return '';
      return 'wall';
    }

    // Item on tile
    const item = this.grid.getItem(x, y);
    if (item) return lookCategory(itemType(item));

    return '';
  }

  /**
   * Handles a bot moving forward one tile.
   * @param {Bot} bot
   * @returns {object} the event pushed
   */
  processMove(bot) {
    bot.energy -= 1;

    const target = bot.facing();
    const tx = target.x;
    const ty = target.y;

    const isOutOfBounds = !this.grid.inBounds(tx, ty);
    const isWallTile = !isOutOfBounds && this.grid.isWall(tx, ty);
    const starPowered = bot.powerUp === 'star';
    const mushroomPowered = bot.powerUp === 'mushroom';

    // Helper to push and return an event
    const pushEvent = (evt) => {
      this.events.push(evt);
      return evt;
    };

    // ---- Hitting a solid wall (out of bounds or wall tile) ----
    if (isOutOfBounds || isWallTile) {
      // Out-of-bounds is always impassable — even star-powered bots cannot leave the grid.
      // Star power only passes through interior wall tiles (isWallTile && !isOutOfBounds).
      if (isOutOfBounds || !starPowered) {
        // Stays put
        const evt = pushEvent({
          botId: bot.id,
          botName: bot.name,
          botEmoji: bot.emoji,
          type: 'hit_wall',
        });
        this.checkEnergy(bot);
        return evt;
      }
      // Star-powered interior wall: pass through
      bot.x = tx;
      bot.y = ty;
      this.decrementPowerUp(bot);
      this.checkEnergy(bot);
      return pushEvent({ botId: bot.id, botName: bot.name, botEmoji: bot.emoji, type: 'move' });
    }

    // ---- Check for another bot at target ----
    const other = this.getBotAt(tx, ty, bot.id);
    if (other) {
      if (starPowered) {
        // Star: move through, steal 5 energy
        const stolen = Math.min(5, other.energy);
        other.energy -= stolen;
        bot.energy += stolen;
        let removedMushroom = false;
        if (other.powerUp === 'mushroom') {
          other.powerUp = null;
          other.powerUpMoves = 0;
          removedMushroom = true;
        }
        bot.x = tx;
        bot.y = ty;
        this.decrementPowerUp(bot);
        pushEvent({
          botId: bot.id,
          botName: bot.name,
          botEmoji: bot.emoji,
          type: 'star_steal',
          detail: { targetBot: other, stolen, removedMushroom },
        });
        this.checkEnergy(bot);
        this.checkEnergy(other);
        // Fall through to collect item check
      } else if (mushroomPowered && !other.powerUp) {
        // Mushroom: move through non-powered bot, steal 5 energy
        const stolen = Math.min(5, other.energy);
        other.energy -= stolen;
        bot.energy += stolen;
        bot.x = tx;
        bot.y = ty;
        this.decrementPowerUp(bot);
        pushEvent({
          botId: bot.id,
          botName: bot.name,
          botEmoji: bot.emoji,
          type: 'mushroom_steal',
          detail: { targetBot: other, stolen },
        });
        this.checkEnergy(bot);
        this.checkEnergy(other);
        // Fall through to collect item check
      } else {
        // Can't pass through: stays put
        const evt = pushEvent({
          botId: bot.id,
          botName: bot.name,
          botEmoji: bot.emoji,
          type: 'hit_wall',
        });
        this.checkEnergy(bot);
        return evt;
      }
    } else {
      // Normal move to empty tile
      bot.x = tx;
      bot.y = ty;
      this.decrementPowerUp(bot);
      pushEvent({ botId: bot.id, botName: bot.name, botEmoji: bot.emoji, type: 'move' });
    }

    // ---- Collect item if present ----
    const item = this.grid.getItem(bot.x, bot.y);
    if (item) {
      const type = itemType(item);
      this.grid.removeItem(bot.x, bot.y);
      if (type === 'good') {
        bot.energy += 10;
        bot.collected += 1;
        pushEvent({
          botId: bot.id, botName: bot.name, botEmoji: bot.emoji,
          type: 'collect_good', detail: { item },
        });
      } else if (type === 'bad') {
        bot.energy -= 10;
        pushEvent({
          botId: bot.id, botName: bot.name, botEmoji: bot.emoji,
          type: 'collect_bad', detail: { item },
        });
      } else if (type === 'star') {
        bot.powerUp = 'star';
        bot.powerUpMoves = 10;
        pushEvent({
          botId: bot.id, botName: bot.name, botEmoji: bot.emoji,
          type: 'collect_star', detail: { item },
        });
      } else if (type === 'mushroom') {
        bot.powerUp = 'mushroom';
        bot.powerUpMoves = 10;
        pushEvent({
          botId: bot.id, botName: bot.name, botEmoji: bot.emoji,
          type: 'collect_mushroom', detail: { item },
        });
      }
    }

    this.checkEnergy(bot);

    const lastEvt = this.events[this.events.length - 1];
    return lastEvt;
  }

  /**
   * Turns the bot n times (1–4) in 'left' or 'right'.
   * @param {Bot} bot
   * @param {number} n
   * @param {'left'|'right'} direction
   */
  processTurn(bot, n, direction) {
    const turns = Math.max(1, Math.min(4, n));
    for (let i = 0; i < turns; i++) {
      if (direction === 'left') {
        bot.dir = bot.leftDir();
      } else {
        bot.dir = bot.rightDir();
      }
    }
    const evt = {
      botId: bot.id,
      botName: bot.name,
      botEmoji: bot.emoji,
      type: 'turn',
      detail: { direction, turns },
    };
    this.events.push(evt);
    return evt;
  }

  /**
   * Decrements the bot's power-up move counter, clearing it at 0.
   * @param {Bot} bot
   */
  decrementPowerUp(bot) {
    if (bot.powerUp) {
      bot.powerUpMoves -= 1;
      if (bot.powerUpMoves <= 0) {
        bot.powerUp = null;
        bot.powerUpMoves = 0;
      }
    }
  }

  /**
   * Kills the bot if energy <= 0.
   * @param {Bot} bot
   */
  checkEnergy(bot) {
    if (bot.energy <= 0) {
      bot.alive = false;
    }
  }

  /**
   * Returns true when the game is over.
   */
  isFinished() {
    const allDead = this.bots.every(b => !b.alive);
    if (allDead) return true;
    if (this.grid.countGoodItems() === 0) return true;
    if (this.turnCount >= this.maxTurns) return true;
    return false;
  }

  /**
   * Returns the current scoreboard.
   * @returns {Array}
   */
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

  /**
   * Returns the bot with the most collected items (energy as tiebreaker).
   * @returns {Bot}
   */
  getWinner() {
    return this.bots.reduce((best, bot) => {
      if (!best) return bot;
      if (bot.collected > best.collected) return bot;
      if (bot.collected === best.collected && bot.energy > best.energy) return bot;
      return best;
    }, null);
  }
}

// ---------------------------------------------------------------------------
// createSounds
// ---------------------------------------------------------------------------

function createSounds() {
  let ctx;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function playTone(freq, duration, type = 'square', volume = 0.15) {
    try {
      const ac = getCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      gain.gain.setValueAtTime(volume, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + duration);
    } catch (e) {
      // Silently ignore audio errors
    }
  }

  function playNotes(notes, type = 'square', volume = 0.15) {
    try {
      const ac = getCtx();
      let time = ac.currentTime;
      for (const [freq, dur] of notes) {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(time);
        osc.stop(time + dur);
        time += dur;
      }
    } catch (e) {
      // Silently ignore audio errors
    }
  }

  function noise(duration, volume = 0.1) {
    try {
      const ac = getCtx();
      const bufferSize = Math.floor(ac.sampleRate * duration);
      const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * volume;
      }
      const source = ac.createBufferSource();
      source.buffer = buffer;
      const gain = ac.createGain();
      gain.gain.setValueAtTime(volume, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      source.connect(gain);
      gain.connect(ac.destination);
      source.start(ac.currentTime);
    } catch (e) {
      // Silently ignore audio errors
    }
  }

  return {
    move()          { playTone(200, 0.08, 'square', 0.08); },
    turn()          { playTone(400, 0.06, 'sine', 0.08); },
    collectGood()   { playNotes([[523, 0.08], [659, 0.08], [784, 0.12]], 'square', 0.12); },
    collectBad()    { playNotes([[300, 0.1], [200, 0.15]], 'sawtooth', 0.12); },
    hitWall()       { noise(0.12, 0.15); },
    starPower()     { playNotes([[523, 0.06], [659, 0.06], [784, 0.06], [1047, 0.12]], 'square', 0.15); },
    mushroomPower() { playNotes([[262, 0.08], [330, 0.08], [392, 0.12]], 'triangle', 0.12); },
    steal()         { playNotes([[800, 0.06], [600, 0.06], [400, 0.08]], 'sawtooth', 0.1); },
    gameOver()      { playNotes([[400, 0.15], [350, 0.15], [300, 0.15], [200, 0.3]], 'square', 0.15); },
  };
}
