// Build a Taco-cat-goat-cheese-pizza Simulator
// and learn about variables

// Declare a variable and assign 0 to it
var cardCounter = 0;
// Declare a variable and assign an array (list) of strings (words) to it
var cardList = ["taco", "cat", "goat", "cheese", "pizza"];
// Declare two variables and leave them empty
var sayWord, cardWord;

// Do some stuff every time the "play" button is clicked
onEvent("playButton", "click", function( ) {
  hideElement("slapImage");
  // Set sayWord to the next word in cardWords 
  sayWord = cardList[cardCounter];
  // Set cardWord to a random word from cardList
  cardWord = cardList[(randomNumber(0, 4))];
  
  // Show the sayWord and cardWord
  setText("label1", sayWord);
  setText("label2", cardWord);
  
  // See if sayWord equals cardWord
  if (sayWord == cardWord) {
    // Show the "slap" image
    showElement("slapImage");
    // Play a sound
    playSound("assets/category_explosion/8bit_explosion.mp3", false);
  }
  
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

