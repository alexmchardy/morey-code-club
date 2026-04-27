export default {
  id: 'guess-again',
  title: 'Guess Again!',
  description: 'Create a number guessing game with hints!',

  intro: `
    <p class="subtitle">Can you guess the secret number?</p>
    <h3>Your mission</h3>
    <p>Create a game where you guess a random number from 1 to 100. The computer tells you if your guess is too big or too small until you get it right!</p>
    <h3>What it does</h3>
    <ol>
      <li>The computer picks a secret random number from 1 to 100</li>
      <li>You guess a number</li>
      <li>If too small, it says "Too small!"</li>
      <li>If too big, it says "Too big!"</li>
      <li>Keep guessing until you get it right!</li>
    </ol>
    <h3>Example</h3>
    <div class="example-box">
      <span class="output">Guess a number between 1 and 100: </span><span class="input">32</span><br>
      <span class="output">Too small!</span><br>
      <span class="output">Guess again: </span><span class="input">76</span><br>
      <span class="output">Too big!</span><br>
      <span class="output">Guess again: </span><span class="input">42</span><br>
      <span class="snark">Yes! You guessed it in only 3 tries!</span>
    </div>
  `,

  steps: [
    {
      id: 'import-random',
      text: 'Import the random module',
      detect: (code) => /import\s+random/.test(code)
    },
    {
      id: 'get-random',
      text: 'Pick a random number with random.randint(1, 100)',
      detect: (code) => /random\.randint\s*\(\s*1\s*,\s*100\s*\)/.test(code)
    },
    {
      id: 'get-guess',
      text: 'Ask the user for a guess using input()',
      detect: (code) => /input\s*\(/.test(code)
    },
    {
      id: 'convert-int',
      text: 'Convert the guess to an integer with int()',
      detect: (code) => /int\s*\(/.test(code)
    },
    {
      id: 'while-loop',
      text: 'Use a while loop to keep asking until correct',
      detect: (code) => /while\s+.*!=/.test(code) || /while\s+.*guess/.test(code)
    },
    {
      id: 'too-small',
      text: 'Print "Too small!" when guess is less than answer',
      detect: (code) => /if\s+.*</.test(code) && /too\s*(small|low|little)/i.test(code)
    },
    {
      id: 'too-big',
      text: 'Print "Too big!" when guess is greater than answer',
      detect: (code) => /(if|elif|else)\s+.*>/.test(code) && /too\s*(big|high|large)/i.test(code)
    },
    {
      id: 'win-message',
      text: 'Print a winning message when they guess correctly',
      manual: true
    },
    {
      id: 'count-tries',
      text: 'BONUS: Count and display the number of tries',
      manual: true
    },
  ],

  hints: [
    {
      title: 'Getting a random number',
      content: `Use the random module to pick a number:

import random

answer = random.randint(1, 100)`
    },
    {
      title: 'Getting the user\'s guess',
      content: `input() gives you a string. Use int() to turn it into a number:

guess = input("Guess a number from 1 to 100: ")
guess = int(guess)`
    },
    {
      title: 'The while loop',
      content: `Keep looping as long as the guess is wrong:

while guess != answer:
    if guess < answer:
        print("Too small!")
    # TODO: add "Too big" check here
    guess = input("Guess again: ")
    guess = int(guess)`
    },
    {
      title: 'Winning message',
      content: `After the while loop ends, you know they got it right:

print("Yes! You got it!")`
    },
    {
      title: 'Counting tries',
      content: `Make a variable to track tries. Add 1 each time they guess:

tries = 1  # Start at 1 for the first guess

while guess != answer:
    # ... your hints code ...
    tries = tries + 1

print("It took you " + str(tries) + " tries!")`
    },
  ],

  starterCode: `# Guess Again!
# Can you guess the secret number?

`,
};
