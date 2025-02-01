// Build a Taco-cat-goat-cheese-pizza Simulator
// and learn about variables

// TODO: Declare a variable named "cardCounter" and assign 0 to it

// Declare a variable and assign an array (list) of strings (words) to it
var cardList = ["taco", "cat", "goat", "cheese", "pizza"];
// Declare three variables and leave them empty
var sayWord, cardWord, randNum;

// TODO: Use onEvent() to do something every time the "Play" button is clicked
onEvent("", "", function( ) {
  // Start off with "slapImage" hidden
  hideElement("slapImage");
  // TODO: Use randomNumber() (look in Math Toolbox) to set randNum to a number between 0 and 4
  // randNum = ??

  // TODO: Use randNum to set cardWord to a random word from cardList
  // cardWord = cardList[??];
   
  // Set sayWord to the next word in cardWords 
  sayWord = cardList[cardCounter];

  // TODO: Use setText() (look in UI controls Toolbox) to show the sayWord in label1

  // TODO: Use setText() to show the cardWord in label2

  // TODO: Use an "if" statement (look in Control Toolbox) to see
  //       if sayWord equals cardWord. If they are equal, 
  //       use showElement() to show the "slapImage"

 
  
  // Increment the cardCounter so sayWord will be the next word next time
  cardCounter = cardCounter + 1;
  // See if cardCounter is past the end of the cardList
  if (cardCounter >= cardList.length) {
    // ...if it is, go back to the start of the list
    cardCounter = 0;
  }
});

// Variations:
// - Play a sound when the slap happens
// - Change the card words or add new ones
// - Have the simulator actually say the words like a player would
// - Add pictures to the cards
// - Delay the slap slightly
// - Simulate multiple players

