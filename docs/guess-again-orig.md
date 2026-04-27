# Guess again\!

## Your mission

Create a game where you guess a random number.

## What it does

1. Use the Python module called `random` to pick a number from 1 to 100  
2. Ask the user to guess the number  
3. Start a `while` loop that keeps going as long as the guess is wrong  
   1. If the guess is too small, print `"Too small!"`  
   2. If the guess is too big, print `"Too big!"`  
   3. Use `input()` to ask the user to guess again  
4. When the guess is finally right, print something exciting

## Example usage

| Guess a number between 1 and 100: 32 Too small\! Guess again: 76 Too big\! Guess again: 42 Yes\! You guessed it in only 3 tries\! |
| :---- |

You need to

| Get a random number:  \# Use random module import random \# Get a random integer btwn 1 and 100 answer \= random.randint(1, 100\) | Get the user's guess:  guess \= input("Guess a number from 1 to 100: ") \# Turn the input into an integer guess \= int(guess) |
| :---- | :---- |
| Keep them guessing:  while guess \!= answer:   if guess \< answer:     print("Too small\!")   \# TODO: print "Too big" if too big | Tell them they won:  \# After the while loop print("Yes\!") |

# Now add these features\! 

A. Show how many tries it took

1. Make a variable to keep track of the number of tries (maybe call it `tries`).  
2. Increment (add `1`) to `tries` each time the user makes a guess.  
3. When the user finally wins, print `"It took you 3 tries"`.

B. The game can make a guess for you

1. If the user presses Enter without typing a number, the game picks a random guess by itself.  
2. Show the game's guess to the user and say if it's too big or too small.  
3. **EXPERT MODE:** Now, see if you can make the game smart enough to make a guess based on whether previous guesses were too big or small.  
   * For example: If previous guesses were `10` (too small) and `90` (too big), then the game would pick a random number between `10` and `90`.  
   * Ask for help if you need it\!\!

# Tips

1. Remember: `guess = input("Guess a number: ")` will be a **string**. To use `guess` as a number, you need to turn it into an **integer** like this:

| `guess = input("Guess a number: ") guess = int(guess)` |
| :---- |

2. To keep track of and show the number of tries, you'll need these lines:

| `tries = 0 . . .  tries = tries + 1 . . . print("It took you " + str(tries) + "tries.")` |
| :---- |

