export default {
  id: 'snarky-calculator',
  title: 'Snarky Calculator',
  description: 'Build a calculator that insults you!',

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
      content: `a = input("First number: ")
action = input("Operator: ")
b = input("Second number: ")`
    },
    {
      title: 'Doing math',
      content: `if action == "+":
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
  ],

  starterCode: `# Snarky Calculator
# The computer is better than you at math, dummy!

`,
};
