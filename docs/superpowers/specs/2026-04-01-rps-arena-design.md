# RPS Arena Design Spec

A competitive coding game where students write JavaScript or Python functions that battle each other in rock-paper-scissors. Part of Morey Code Club.

## Overview

Students write a `throwRPS(round, myThrows, theirThrows)` function that returns "rock", "paper", or "scissors". The teacher queues up matches between student functions, and the arena screen displays animated battles. Supports team mode and a creative "nolimits" mode where an LLM judges arbitrary throws.

## Architecture

- **3 static HTML files**: `student.html`, `admin.html`, `room.html` (follows Pixel Poke pattern)
- **Supabase backend**: Reuses existing `code_mob` schema with `rps_` prefixed tables
- **Realtime**: Supabase subscriptions push updates to room.html
- **Battle execution**: Client-side in room.html; only outcomes persisted to DB
- **Admin actions**: Edge Function (`rps-arena-admin`)

## Data Model

All tables in `code_mob` schema.

### rps_tournaments


| Column           | Type        | Notes                   |
| ---------------- | ----------- | ----------------------- |
| id               | UUID        | PK                      |
| name             | text        | Tournament display name |
| mode             | text        | 'strict' or 'nolimits'  |
| team_mode        | boolean     |                         |
| team_a_name      | text        | nullable                |
| team_b_name      | text        | nullable                |
| rounds_per_match | int         | default 10              |
| round_delay_ms   | int         | default 2000            |
| match_delay_ms   | int         | default 5000            |
| continuous       | boolean     | default false           |
| paused           | boolean     | default false           |
| is_active        | boolean     | default true            |
| created_at       | timestamptz |                         |


### rps_students


| Column        | Type        | Notes             |
| ------------- | ----------- | ----------------- |
| tournament_id | UUID        | PK (composite)    |
| name          | text        | PK (composite)    |
| team          | text        | 'a', 'b', or null |
| created_at    | timestamptz |                   |


### rps_functions


| Column        | Type        | Notes                              |
| ------------- | ----------- | ---------------------------------- |
| id            | UUID        | PK                                 |
| tournament_id | UUID        | FK                                 |
| student_name  | text        |                                    |
| function_name | text        | e.g., "ChaosBot"                   |
| version       | int         | auto-incremented per function_name |
| code          | text        | stored in original language        |
| language      | text        | 'js' or 'python'                   |
| is_archived   | boolean     | default false                      |
| match_wins    | int         |                                    |
| match_losses  | int         |                                    |
| round_wins    | int         |                                    |
| submitted_at  | timestamptz |                                    |


### rps_match_queue


| Column             | Type        | Notes                             |
| ------------------ | ----------- | --------------------------------- |
| id                 | UUID        | PK                                |
| tournament_id      | UUID        | FK                                |
| function_a_id      | UUID        | FK                                |
| function_b_id      | UUID        | FK                                |
| position           | int         | queue order                       |
| status             | text        | 'pending', 'playing', 'completed' |
| winner_function_id | UUID        | FK, nullable                      |
| created_at         | timestamptz |                                   |


### rps_approved_names


| Column        | Type        | Notes          |
| ------------- | ----------- | -------------- |
| tournament_id | UUID        | PK (composite) |
| name          | text        | PK (composite) |
| created_at    | timestamptz |                |


## Student UI (student.html)

### Flow

1. Student selects name from dropdown (populated from `rps_approved_names`)
2. Coding interface appears:
  - CodeMirror editor with JS/Python toggle
  - Code persisted to `localStorage` per student
  - Read-only function signature: `function throwRPS(round, myThrows, theirThrows)`
  - "Function Name" text input
  - Hints panel with code snippets
3. **Test** button runs function with sample inputs, validates return value
4. **Submit** button saves to `rps_functions`
  - Auto-increments version if function_name exists
5. **My Submissions** panel shows unarchived versions with archive button

### Function Signature

```javascript
function throwRPS(round, myThrows, theirThrows) {
  // round: number (0-indexed round number)
  // myThrows: string[] (your previous throws, most recent first)
  // theirThrows: string[] (opponent's previous throws, most recent first)
  // return: "rock" | "paper" | "scissors"
}
```

### Hints Panel

Code snippets for common strategies:

- Always Rock: `return "rock";`
- Random: `const choices = ["rock", "paper", "scissors"]; return choices[Math.floor(Math.random() * 3)];`
- Copy Opponent: `if (theirThrows.length > 0) return theirThrows[0]; return "rock";`
- Counter Opponent: `if (theirThrows[0] === "rock") return "paper"; ...`
- Pattern: `const pattern = ["rock", "paper", "scissors"]; return pattern[round % 3];`

## Admin UI (admin.html)

### Panels

1. **Tournament Setup**
  - Create tournament (name, mode, team_mode)
  - Enter approved names (textarea, one per line)
  - Team mode: enter team names, drag students to teams, "Randomize" button
2. **Match Controls**
  - View submitted functions (all unarchived versions)
  - Archive button per function
  - Drag functions to queue matchups
  - Reorderable match queue
  - "Next Match" button
  - "Continuous" toggle
  - Pause/Resume
3. **Settings**
  - Rounds per match (3-20)
  - Round delay (500ms-3000ms)
  - Match delay (1000ms-5000ms)
4. **Stats**
  - Leaderboard preview
  - Functions submitted count
  - Matches played

## Arena UI (room.html)

### Layout

- **Header**: "RPS ARENA" + tournament name
- **Center stage**: Battle arena with two function cards
- **Left sidebar**: Team A score and functions (team mode) or submitted functions
- **Right sidebar**: Team B score and functions (team mode) or leaderboard
- **Bottom left**: Match queue

### Battle Animation

**Round flow:**

1. Countdown: 3... 2... 1... THROW!
2. Execute both functions
3. Reveal throws with "punch in" animation
4. Round winner: throw glows briefly, score updates
5. Pause (round_delay_ms), next round

**Match end:**

- Winner: grows ~20%, wobbles side-to-side, glow effect
- Loser: tilts backward, shrinks slightly, fades to grayscale
- Update stats in DB
- Pause (match_delay_ms)
- If continuous: auto-next; else wait for admin

**Tie handling:** Both players get a win.

## Python Execution

Use **Skulpt** library for in-browser Python execution.

- Student code stored as Python in DB
- At runtime, wrap code and execute via Skulpt
- Full Python syntax support
- Proper error messages/tracebacks for students

## Nolimits Mode

Functions can return any string. Arena calls Cerebras API (llama3.1-8b) to judge:

```
Prompt: "In creative rock-paper-scissors, Player A threw '{throwA}'
and Player B threw '{throwB}'. Pick a winner and explain why in
under 20 words. Be creative and unpredictable.
Respond as JSON: {winner: 'A'|'B'|'tie', reason: '...'}"
```

LLM's reason displayed below the throws. API key embedded in room.html (teacher-controlled).

## Team Mode

- Tournament has two named teams
- Students assigned to teams via admin drag-drop or randomize
- Arena shows teams on opposite sides
- Team scores increment for cross-team match wins
- Individual and team leaderboards

## File Structure

```
rps-arena/
├── student.html
├── admin.html
├── room.html
└── shared.css

supabase/
├── migrations/YYYYMMDD_rps_arena.sql
└── functions/rps-arena-admin/index.ts
```

## Security

- RLS: anon can SELECT all tables
- Writes via `submit_function()` SECURITY DEFINER RPC (validates tournament, approved name)
- Admin actions via Edge Function with ADMIN_TOKEN
- Cerebras API key only in room.html (not exposed to students)

## Dependencies

- Supabase JS SDK (CDN)
- CodeMirror 5.65.16 (CDN)
- Skulpt (CDN) for Python execution
- Cerebras API for nolimits mode
- Google Fonts: Press Start 2P, Share Tech Mono (existing)

