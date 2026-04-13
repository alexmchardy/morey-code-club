# Morey Code Club

A coding education portal for a school code club, hosted on GitHub Pages at **mcc.alexmchardy.net**.

## Project Overview

Central hub that links to interactive games and coding projects for club members. Projects are organized by year (2025, 2026). The site has a retro/gaming aesthetic.

- `index.html` redirects to the current year (`2026/`)
- Each year has its own `index.html` hub with project cards
- `tinylink.html` and TinyURL `https://tinyurl.com/m-codeclub` are used for easy student access

## Tech Stack

- Pure HTML/CSS/JavaScript — no build tools, no bundler, no package manager
- **CodeMirror 5.65.16** — embedded code editor (used in Kookie Klicker and M-Dash)
- **Google Fonts** — Press Start 2P, Share Tech Mono, Fredoka (retro gaming aesthetic)
- **GitHub Pages** — static hosting, deploy by pushing to `main`

## Structure

```
/
├── index.html              # Redirects to 2026/
├── 2026/index.html         # Current year hub (project cards, QR code)
├── 2025/index.html         # Previous year archive
├── kookie-klicker/         # Cookie clicker game
├── m-dash/                 # Typing/coding game with CodeMirror editor
├── taco-cat-goat-cheese-pizza/  # 4-level progression game (Code.org AppLab)
├── code-quest/             # Interactive coding tutorial with mini-games
│   ├── code-quest.html     # Main tutorial hub
│   ├── code-quest.md       # Project documentation (lessons, mini-games, design)
│   └── mini-games/         # Bug squash, code scramble, output guess, speed type, variable match
├── rps-arena/              # Rock-Paper-Scissors Arena (see below)
│   ├── student.html        # Student interface — write and submit RPS functions
│   ├── room.html           # Battle arena display — shows matches in progress
│   ├── admin.html          # Admin interface — tournament management
│   └── shared.css          # Shared styles for all RPS Arena pages
├── character-clash/        # Character Clash (see below)
│   ├── student.html        # Student interface — write character-creation code
│   ├── room.html           # Battle arena display — animated encounter narration
│   ├── admin.html          # Admin interface — tournament and encounter management
│   └── shared.css          # Shared styles for all Character Clash pages
├── assets/
│   ├── css/style.css       # Main shared styles
│   ├── css/cards.css       # Card component styles
│   └── images/             # GIFs, QR codes, icons
├── docs/
│   └── code_mob_schema.sql # Supabase schema for code-mob games (authoritative)
└── CNAME                   # mcc.alexmchardy.net
```

## RPS Arena

A competitive programming game where students write Rock-Paper-Scissors strategy functions that battle each other in real-time tournaments.

### How It Works

1. **Students** write a `throwRPS(round, myThrows, theirThrows)` function (JS or Python)
2. **Functions** are submitted to the current tournament via Supabase
3. **Admin** queues matches between functions
4. **Room display** executes functions client-side and animates the battle

### Game Modes

- **Strict** — Functions must return "rock", "paper", or "scissors"
- **No Limits** — Functions can return any string; Cerebras LLM judges the winner with creative reasoning; ElevenLabs TTS narrates the judgment

### Tech Stack

- **Supabase** — Real-time database, edge functions for admin actions, `code_mob` schema
- **Skulpt** — Python execution in the browser
- **Cerebras API** — LLM judgments for nolimits mode
- **ElevenLabs API** — TTS narration for LLM judgments
- **CodeMirror 5.65.16** — Code editor in student.html

### Database Schema

See `docs/code_mob_schema.sql` for the current schema. Key tables:

- `rps_tournaments` — Tournament config (mode, team names, timing settings)
- `rps_functions` — Student-submitted code with versioning
- `rps_match_queue` — Pending/playing/completed matches
- `rps_students` — Team assignments (a/b)
- `rps_approved_names` — Whitelist of student names per tournament

## Character Clash

A creative coding game where students write code that defines a character — name, mood, description, backstory, and items — adapted to different locations. Characters then face off in AI-narrated encounters shown on the room display.

### How It Works

1. **Students** write code (JS or Python) that calls setter functions (`setFullName`, `setMood`, `setDescription`, `setBackstory`, `setItems`) to define a character, receiving a `location` variable to adapt the character per setting
2. **Code is tested** against several locations (e.g. bathroom, cafeteria, cliff, city, airplane) before submission
3. **Characters** are submitted to the current tournament via Supabase
4. **Admin** queues encounters between characters
5. **Room display** executes both character functions client-side, sends the character data to an LLM for creative battle narration, and animates the result with TTS audio

### Tech Stack

- **Supabase** — Real-time database, `code_mob` schema
- **Skulpt** — Python execution in the browser
- **Cerebras API** — LLM narration of character encounters
- **ElevenLabs API** — TTS narration
- **CodeMirror 5.65.16** — Code editor in student.html

### Database Schema

Key tables in the `code_mob` schema:

- `cc_tournaments` — Tournament config (locations, timing settings)
- `cc_characters` — Student-submitted character code with versioning
- `cc_encounter_queue` — Pending/playing/completed encounters
- `cc_approved_names` — Whitelist of student names per tournament

## Conventions

- Self-contained HTML files — styles and scripts are often inline or in the same directory
- Card-based UI for project listings (see `assets/css/cards.css`)
- New projects get their own subdirectory with a self-contained HTML file
- When adding a project to the hub, add a card in `2026/index.html`
- Games use a retro pixel font aesthetic — keep new additions consistent

## Deployment

Push to `main` branch — GitHub Pages deploys automatically. No build step required.

## Audience

Elementary/middle school students. Keep code approachable, avoid unnecessary complexity.
