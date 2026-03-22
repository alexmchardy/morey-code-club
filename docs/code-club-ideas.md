# Code Mob — Activity Ideas

**Concept:** Students write JavaScript code on an HTML page that sends `fetch()` requests to a server, causing real-time changes on a room screen shown on the projector. Students interact with each other through the shared screen.

This reinforces Code Quest concepts: variables, functions, loops, conditionals, arrays.

---

## Activity Ideas

### 1. Pixel Poke ✓ *(chosen for first session)*
Students send pixel coordinates and colors to paint squares on a shared 40×40 grid. The whole class collaboratively (or competitively) fills the canvas.

- **Core concept:** `drawPixel(x, y, color)` — wraps a fetch POST
- **Challenge 1:** Draw one pixel at a coordinate
- **Challenge 2:** Use a loop to draw a line
- **Challenge 3:** Write a function to draw a shape

---

### 2. Monster Lab
Each student codes a creature with attributes (name, color, power level, type). Their creature appears in a gallery on the room screen — a parade of unique student-created monsters.

- **Core concept:** `createMonster({ name, color, power, type })` — sends an object
- **Challenge 1:** Create a monster with your name and a color
- **Challenge 2:** Add a power level using a number variable
- **Challenge 3:** Write a function that builds and sends a monster

---

### 3. Space Fleet
Students name a spaceship, set coordinates, and pick a color. All ships appear on an animated starfield on the room screen.

- **Core concept:** `launchShip({ name, x, y, color })` — sends position data
- **Challenge 1:** Launch one ship at any position
- **Challenge 2:** Use a loop to launch a fleet of ships
- **Challenge 3:** Write a function that puts ships in a formation

---

### 4. City Builder
Students submit a building with a name, height (number), and color. The room screen shows a growing city skyline — tallest buildings stand out.

- **Core concept:** `buildBuilding({ name, height, color })` — sends structured data
- **Challenge 1:** Build one structure
- **Challenge 2:** Use a loop to build a row of buildings
- **Challenge 3:** Use a conditional to give taller buildings a different color

---

### 5. Tug of War
Two teams write code to "pull" a shared rope. The room screen shows a live tug-of-war bar shifting toward the winning team. Loops send more pulls per run.

- **Core concept:** `pull("blue")` or `pull("red")` — team-based action
- **Challenge 1:** Call `pull()` with your team color
- **Challenge 2:** Use a loop to pull multiple times
- **Challenge 3:** Write a function that pulls `n` times based on a parameter

---

### 6. Code Concert
Students pick an instrument and send beats. The room screen shows an animated band — each student's character plays their part, and visualizations layer together.

- **Core concept:** `playNote({ instrument, beats: [1, 0, 1, 0] })` — sends an array
- **Challenge 1:** Play a simple beat pattern
- **Challenge 2:** Use an array to define a custom rhythm
- **Challenge 3:** Write a function that generates a beat pattern

---

### 7. Garden Planting
Students plant a flower by defining properties — type, color, height. The room screen shows a growing animated garden as each flower appears.

- **Core concept:** `plantFlower({ type, color, height })` — sends an object
- **Challenge 1:** Plant one flower
- **Challenge 2:** Use a loop to plant a row of flowers
- **Challenge 3:** Use a conditional to vary flower color by height
