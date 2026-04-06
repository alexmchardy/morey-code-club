We are going to build a Code Club project "Rock-Paper-Scissors Arena" (aka "RPS Arena") similar in structure to code-mob.
It will be based on static html frontends with a Supabase-only backend like the static
version of code-mob/pixel-poke. Students will be prompted to write a function that outputs
("throws") "rock", "paper", or "scissors" in the student UI. They will submit their function to the
"arena". The teacher will use the admin UI to choose two students' functions to battle.
The functions will be shown "battling" on the arena screen at the front of the room.
The project will be called "rps-arena".

Use the static version of code-mob/pixel-poke as a guide for implementation. Help brainstorm
requirements and enhancements to the game. Here are some of the requirements:

- Student UI requirements
  - Student must choose their name from a list of preapproved names (entered in admin UI by teacher)
  - Student must give their function a name
  - Students can write their function in Javascript or Python
  - Input arguments to the student's function are:
    - @param round number index of the current round of battle
    - @param myThrows string[] stack of the previous outputs of your function (most recent is myThrows[0])
    - @param theirThrows string[] stack of the previous outputs of opponent's function (most recent is theirThrows[0])
  - The student's function must return a string "rock" | "paper" | "scissors" (in "strict" mode)
  - When the student is ready with their function, they must first test it.
  - If the student's function doesn't return "rock" | "paper" | "scissors" in the test (in "strict" mode), they must fix it
  - If the student's function passes the tests, they can submit it to the Arena.
  - The student UI includes a number of helpful hints and suggestions for some simple strategies
  - If "nolimits" mode is currently active (set by the teacher admin UI), the student's function can return any string

- Admin UI requirements
  - Teacher can choose from students' submitted functions to queue them to face each other in upcoming matches
  - Teacher can adjust how many rounds each match lasts (default 10)
  - Teacher can adjust delay between rounds and delay between matches
  - Teacher can pause, stop, and restart matches
  - Teacher can switch between active "Tournaments" that show on the Arena and to which students may currently submit functions
  - Teacher can choose whether a Tournament is "strict" mode or "nolimits" mode
    - In "strict" mode, student functions may only return "rock"|"paper"|"scissors"
    - In "nolimits" mode, student functions may return any string. An API request to an LLM is made to determine which is the winner.
  - Teacher can choose whether a Tournament is in "singles" or "team" mode
    - In team mode, the teacher enters the names of two teams
    - In team mode, the teacher chooses which students are on which team or can randomize it with a button click

- Arena (room) UI requirements
  - Arena shows a list of student functions that have been submitted and that are ready for battle
    - In team mode, student functions are listed with their team on opposite sides of the arena
  - Student function names are shown along with the students name in a badge
  - The functions currently battling are shown in a stylized "arena" in the middle
  - Each round shows a countdown 3, 2, 1, "Throw!", and the function outputs are shown
  - The winner of the round is shown.
  - A tally of the round wins on each side is shown
  - At the end of a match, the match winner is shown.
  - A leaderboard shows top functions by match wins. It also shows rounds won.
  - In team mode, a student's team gets a win if the student wins a match.
  - In team mode, the team wins are shown near the team lists
  - In "nolimits" mode, there is no change in the arena UI (it is not obvious to the students)
  - In "nolimits" mode, the arena submits the functions' outputs to llama3.1-8b on Cerebras to choose a winner
    - The LLM is told to be creative and unpredictable about which choice wins in "no-limits" rock-paper-scissors.
    - The LLM is told to provide a very brief (<20 words) explanation about why the winner was chosen, which is shown in the arena.
    