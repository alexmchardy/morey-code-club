export default {
  id: 'snarky-calculator',
  title: 'Snarky Calculator',
  description: 'Build a calculator that insults you!',

  intro: `
    <p class="subtitle">The computer is better than you at math, dummy!</p>
    <h3>Your mission</h3>
    <p>Build a calculator that can add, subtract, multiply, and divide. It also makes random snarky remarks and insults you based on what you ask it to do (dummy!).</p>
    <h3>What it does</h3>
    <p>It's like a regular calculator, dummy! You enter a number, then a math operator (<code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>), then another number.</p>
    <ol>
      <li>Enter a number</li>
      <li>Enter a math operator (<code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>)</li>
      <li>Enter another number</li>
      <li>It prints the answer</li>
      <li>Then it prints a totally unnecessary insult or snarky remark depending on the answer</li>
    </ol>
    <h3>Example usage</h3>
    <div class="example-box">
      <span class="input">2</span><br>
      <span class="input">+</span><br>
      <span class="input">3</span><br>
      <span class="output">=</span><br>
      <span class="output">5</span><br>
      <span class="snark">C'mon! You can do that in your head, dummy!</span>
    </div>
  `,

  steps: [
    {
      id: 'get-inputs',
      text: 'Get two numbers and an operator using input()',
      detect: (code) => (code.match(/input\s*\(/g) || []).length >= 3
    },
    {
      id: 'do-math',
      text: 'Do math based on the operator (+, -, *, /)',
      detect: (code) => /if\s+.*==\s*["'][+\-*/]["']/.test(code)
    },
    {
      id: 'print-answer',
      text: 'Print the answer',
      detect: (code) => /print\s*\(/.test(code) && /int\s*\(/.test(code)
    },
    {
      id: 'add-snark',
      text: 'Add snarky remarks based on the answer',
      manual: true
    },
    {
      id: 'loop-it',
      text: 'Wrap everything in while True:',
      detect: (code) => /while\s+True\s*:/.test(code)
    },
  ],

  hints: [
    {
      title: 'Getting input',
      content: `input( ) asks the user a question in the console, waits for them to type and press Enter, then puts what they typed into the variable on the left of the =.

a = input("First number: ")
action = input("Operator: ")
b = input("Second number: ")`
    },
    {
      title: 'Doing math',
      content: `input() gives you a string. You need int( ) around each value to turn the string into a number before you can do math.

if action == "+":
    answer = int(a) + int(b)
elif action == "-":
    answer = int(a) - int(b)`
    },
    {
      title: 'Adding snark',
      content: `if answer < 10:
    print("Too easy, dummy!")
elif answer > 100:
    print("Wow, big number!")`
    },
    {
      title: 'While loop',
      content: `Put a while True: at the top (same indent as your other code at column 0), then indent everything else one level so it runs over and over:

while True:
    a = input("First number: ")
    # ... rest of your calculator, all indented inside the loop`
    },
  ],

  starterCode: `# Snarky Calculator
# The computer is better than you at math, dummy!

`,
};
