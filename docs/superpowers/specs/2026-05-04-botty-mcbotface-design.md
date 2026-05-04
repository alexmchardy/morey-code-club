# Botty McBotface — Design Spec

Students write Python code to control a bot that navigates a grid, collecting good items for energy and avoiding bad items. Bots compete head-to-head on a projected room display with AI-generated sports commentary.

Follows the student/room/admin pattern established by RPS Arena and Character Clash.

## Audience

Elementary/middle school students at Morey Code Club. Code should be approachable. The project teaches loops and conditionals through gameplay.

## Bot API

| Function | Description |
|---|---|
| `move()` | Move one tile forward. Costs 1 energy. |
| `turn_left(n=1)` | Rotate n x 90 degrees left. Free. |
| `turn_right(n=1)` | Rotate n x 90 degrees right. Free. |
| `look()` | What's in front of the bot. |
| `look("left")` | What's to the left of the bot. |
| `look("right")` | What's to the right of the bot. |

### look() Return Values

| Situation | Returns | Truthy/Falsey |
|---|---|---|
| Nothing ahead | `""` | Falsey |
| Wall or bot | `"wall"` | Truthy |
| Good item | `"good"` | Truthy |
| Bad item | `"bad"` | Truthy |
| Power-up item | `"power"` | Truthy |

During star power-up: walls and bots return `""` (passable). During mushroom power-up: non-powered bots return `""` (passable), walls still return `"wall"`.

## Energy System

- Starting energy: 50
- `move()` costs 1 energy (including moves into walls — the bot stays put but still loses energy)
- Good item collected: +10 energy
- Bad item collected: -10 energy
- Bot stops when energy reaches 0 or all good items are collected

## Items

| Type | Emoji Examples | Effect |
|---|---|---|
| Good | pizza, donut, gem, cookie, etc. | +10 energy |
| Bad | bomb, skull, fire, poop, etc. | -10 energy |
| Power-up: Star | star | Invincible + glowing for 10 moves |
| Power-up: Mushroom | mushroom | Bigger for 10 moves |

Items are rendered as emoji on the grid. The bot automatically collects any item it lands on.

## Power-Up Mechanics

### Star (Invincible)

- Bot glows visually for 10 moves
- Can pass through interior walls and other bots
- `look()` does not register walls or bots (returns `""`)
- Going through another bot: steal 5 energy from them
- Star vs mushroom bot: steal 5 energy AND remove their mushroom power-up
- Only appears in later tutorial levels and room matches with power-ups enabled

### Mushroom (Super)

- Bot appears slightly bigger for 10 moves
- Can pass through non-powered-up bots (but not walls)
- Going through a non-powered-up bot: steal 5 energy from them
- Loses mushroom power if hit by a star-powered bot
- Only appears in later tutorial levels and room matches with power-ups enabled

## Sound Effects

- `move()` — footstep sound
- `turn_left()` / `turn_right()` — swish sound
- Collect good item — positive chime
- Collect bad item — negative buzz
- Hit wall — bonk/thud
- Star power-up — invincibility jingle
- Mushroom power-up — power-up sound
- Going through a bot (energy steal) — steal sound
- Energy depleted — game over sound

## Pages

### student.html

- **Name picker** — student selects their name from the approved names list (same pattern as Character Clash)
- **Bot name** — text input to name their bot (e.g., "Turbo Taco")
- **Emoji picker** — select their bot emoji
- **CodeMirror editor** — reused from Python Playground with all improvements (syntax highlighting, localStorage persistence, error display)
- **Test area** — visual grid for running the bot
  - Level selector: tutorial levels + random mode
  - Play/reset controls
  - Energy display, items collected count
  - Speed control (slow for debugging, fast for testing)
- **Submit button** — sends bot name, emoji, and code to current tournament via Supabase
- Sound effects play during test runs

### room.html

- **Full-screen grid** — designed for projector display
- Multiple bots competing with round-robin turns, animated step by step
- **Scoreboard** — each bot's emoji, bot name, student name, energy, items collected
- **AI Commentary** via Cerebras LLM + ElevenLabs TTS (see Commentary section)
- Sound effects for the audience
- Visual effects: bot glow during star power, size increase during mushroom, flash on bad item
- Connects to Supabase for real-time match data

### admin.html

- Create/manage tournaments
- Manage approved names list
- Configure grid size, item density, obstacle density, power-ups on/off
- See submitted bots, select which ones compete
- Queue matches (pick 2+ bots, generate a random grid, start)
- View results

## Grid Design

- Top-down view, square tiles, emoji rendered in each cell
- Bot shows its chosen emoji with a directional indicator (arrow or eyes showing facing direction)
- Default grid size: 10x10 (admin-configurable)
- Outer walls always present (border of the grid) — `look()` returns `"wall"` for grid edges
- Interior walls are individual tiles placed within the grid

## Tutorial Levels

### Level 1 — "First Steps"
- 6x6 grid, no walls, no bad items
- A few good items in a straight line
- Teaches: `move()`, basic `for` loops

### Level 2 — "Turn Around"
- Small grid, no walls, items around a corner path
- Teaches: `turn_left()`, `turn_right()`, sequencing

### Level 3 — "Look Before You Leap"
- Items scattered randomly, no obstacles
- Teaches: `look()`, `if` statements

### Level 4 — "Walls!"
- Interior walls introduced, items behind walls
- Teaches: `while` loops, `look() == "wall"` checks

### Level 5 — "Watch Your Step"
- Good and bad items mixed, no walls
- Teaches: `look() == "good"` vs `look() == "bad"` conditionals

### Level 6 — "The Gauntlet"
- Walls + good items + bad items combined
- Requires loops, conditionals, and all movement functions

### Level 7 — "Power Up!"
- Introduces star and mushroom power-ups
- Teaches: `look() == "power"` and strategic decisions
- Only available when power-ups are enabled

### Random Mode
- Configurable difficulty (easy/medium/hard) affecting obstacle density and bad item ratio
- New layout each run — forces adaptive code

### Step-by-Step Guidance
Each tutorial level has:
- Short intro explaining the goal
- Steps panel with auto-detection (detects `for`, `while`, `if`, `look()`, etc.)
- Expandable hints with code snippets

## Room Match Flow

### Match Setup
1. Admin selects 2+ bots from submitted list
2. Admin picks grid settings or uses a preset
3. Admin queues the match — room.html picks it up via Supabase real-time subscription

### Match Execution
1. Grid generated, bots placed at random starting positions facing random directions
2. Intro screen: each bot's emoji, name, and student name shown
3. AI commentator introduces the matchup via Cerebras + ElevenLabs
4. Round-robin turns begin:
   - Each bot executes one action per turn
   - Grid animates the action, sound effect plays
   - Notable events added to event log
5. Commentary plays during the match (non-blocking, see pacing below)
6. Match ends when: all good items collected, all bots at 0 energy, or max turn limit reached (200 turns)
7. Final commentary and winner announcement

### Collision Rules
- First bot to reach an item collects it (item removed from grid)
- Bots are obstacles to each other — cannot walk through (treated as walls)
- Exception: star-powered bots pass through everything; mushroom-powered bots pass through non-powered bots

### Commentary Pacing
- Commentary does NOT pause the match — the game runs while commentary plays
- After a commentary line finishes being spoken, a 5-second cooldown starts
- During cooldown, notable events accumulate but do not trigger commentary
- After cooldown, the next notable event triggers new commentary from accumulated events
- End of match bypasses cooldown — final commentary triggers immediately

### Commentary Prompt Style
- Sports announcer / game show host tone
- Short punchy lines (1-2 sentences)
- Reacts to drama: close scores, comebacks, unlucky bomb hits, power-up steals
- Uses bot names and emoji
- Receives: event log, current scores/energy for each bot, bot descriptions (name + emoji)

## Code Execution

- Skulpt runs student Python in the browser (same as Python Playground, RPS Arena, Character Clash)
- Bot API functions injected into Skulpt as Python builtins
- Each function call yielded as an action — game engine processes them one at a time for animation
- Execution sandboxed: infinite loops caught by energy system, hard timeout for truly stuck code

### Starter Code
```python
# Move your bot and collect items!
# Use: move(), turn_left(), turn_right(), look()

for i in range(10):
    move()
```

## Code Reuse

### From Python Playground
- CodeMirror setup and configuration
- Skulpt initialization and execution harness
- localStorage persistence pattern
- Error display (syntax errors, runtime errors shown below editor)
- Retro styling / Press Start 2P font aesthetic

### From Character Clash
- Name picker from approved list
- Supabase submission pattern
- Student/room/admin page structure

## Tech Stack

- Pure HTML/CSS/JavaScript — no build tools
- CodeMirror 5.65.16 — code editor
- Skulpt — Python execution in browser
- Supabase — real-time database, `code_mob` schema
- Cerebras API — LLM commentary in room.html
- ElevenLabs API — TTS narration in room.html
- GitHub Pages — deploy by pushing to main

## Database (code_mob schema)

New tables:
- `bmb_tournaments` — tournament config (grid size, item counts, power-ups enabled, energy settings)
- `bmb_bots` — student name, bot name, bot emoji, code, versioning
- `bmb_match_queue` — pending/playing/completed matches
- `bmb_approved_names` — name whitelist per tournament

## File Structure

```
botty-mcbotface/
├── student.html      # Editor + test grid
├── room.html         # Competition display
├── admin.html        # Tournament management
├── shared.css        # Shared styles
├── engine.js         # Grid logic, energy, collisions, power-ups
├── levels.js         # Tutorial level definitions
└── sounds/           # Sound effect files
```
