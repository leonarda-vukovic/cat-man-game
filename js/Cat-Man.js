var wordToGuess;  //actual word player must guess
var wordSubstitute;  //"_ _ _ _" version
var wrongGuesses;   //number of wrong guesses in the current round
var lives;  //lives left
var currentRound;
const maxRoundsPerLevel = 10;
var currentLevel;
const levels = ["Easy", "Medium", "Hard", "Extra Hard"]; 
var hintsLeft = 3;
var skipsLeft = 1;
var hintUsedThisRound = false; //prevents multiple hints usage per round
var wordsByCategory = {};
var hintsByCategory = {};
var currentHint;
var roundOver = false; //helper variable for disabling hint and skip buttons after user finishes a round
var usedWords = new Set();
var currentCategory;
var totalLivesLost = 0; 
var maxGuessesPerLevel = {
  "Easy": 6,
  "Medium": 6,
  "Hard": 5,
  "Extra Hard": 5
};
var startingLivesPerLevel = {
  "Easy": 10,
  "Medium": 8,
  "Hard": 6,
  "Extra Hard": 3
};

$(document).ready(function() {
  $("#playBtn").click(function(){
    showScreen("storyScreen");
  });
  $("#rulesBtn").click(function(){
    showScreen("rulesScreen");
  });
  $("#backToStory").click(function(){
    showScreen("storyScreen");
  });
  $("#playAgainBtn").click(function(){
  resetGame();
  });


  fetch("../data/words.csv")
  .then(response => response.text())
  .then(text => {
      parseCSV(text);
      $("#easyBtn, #mediumBtn, #hardBtn, #extraBtn").removeAttr("disabled");
  })
  .catch(error => {
      console.error("Error loading CSV:", error);
  });

  $("#alphabet button").unbind("click").click(function(){
    var letter = $(this).attr("id")
    letter = letter.toUpperCase()
    $(this).attr("disabled", "disabled")
    wordSubstitute = checkLetter(letter,wordSubstitute, wordToGuess)
  })
  $("#guessBtn").click(function(){
    guessWord();
  });
  $("#nextRoundBtn").click(function(){
    nextRound();
  })
  $("#hintBtn").click(function(){
    useHint();
  });
  $("#skipBtn").click(function(){
    useSkip();
  });
})

function parseCSV(text) {
  wordsByCategory = {};
  hintsByCategory = {};
  var lines = text.split("\n");
  for (var i = 0; i < lines.length; i++) {
    if(lines[i].trim() == "") continue 
    var parts = lines[i].split(","); 
    var word = parts[0].trim().toUpperCase();   
    var level = parts[1].trim();
    var category = parts[2].trim().toUpperCase();
    var hint = parts[3].trim();
    if (!wordsByCategory[category]) {
      wordsByCategory[category] = {};
      hintsByCategory[category] = {};
    }
    if (!wordsByCategory[category][level]) {
      wordsByCategory[category][level] = [];
      hintsByCategory[category][level] = [];
    }
    wordsByCategory[category][level].push(word);
    hintsByCategory[category][level].push(hint);
  }
}

function playGame(level){ //this function now accepts a level
  currentLevel = level;
  currentRound = 1;
  maxGuesses = maxGuessesPerLevel[level];
  lives = startingLivesPerLevel[level];
  $("#catImg").css("transform", "scale(1)"); //setting the cat to its initial size
  startRound(); 
}

function startRound(){
  wordToGuess = pickRandomWord();
  wordSubstitute = createSubstitute(wordToGuess);
  wrongGuesses = 0;
  hintUsedThisRound = false;
  roundOver = false;
  
  //showing game area, hiding next round button 
  showScreen("gameArea");
  $("#nextRoundBtn").hide();

  //display of the starting game stats
  document.getElementById("result").innerHTML = wordSubstitute
  document.getElementById("wrongGuesses").innerHTML = wrongGuesses + " wrong guess(es)";
  document.getElementById("livesDisplay").innerHTML = "Lives: " + lives;
  document.getElementById("roundDisplay").innerHTML = "Round: " + currentRound;
  document.getElementById("levelDisplay").innerHTML = "Level: " + currentLevel;
  document.getElementById("categoryDisplay").innerHTML = "Category: " + currentCategory;
  document.getElementById("hintDisplay").innerHTML = ""; //so that a hint doesnt remain on screen in case it was activated in the previous round
  updateThreeButtons();  //this controls the state of Hint, Skip and Guess Word buttons
}

//this function is used to control which "page" is being displayed - the initial, story, rules or gameplay
function showScreen(screenId) {
  //first we hide everything then only display selected one
  $("#introScreen, #storyScreen, #rulesScreen, #gameArea").hide();
  $("#" + screenId).show();
}

function updateThreeButtons(){
  if(roundOver){  //if the round is over, all three need o be disabled
      $("#hintBtn").attr("disabled", "disabled");
      $("#skipBtn").attr("disabled", "disabled");
      $("#guessBtn").attr("disabled", "disabled");
      return
  }
  //if the current round isnt over, only then we can get to this point in the code - so we enable the Guess Word button
  $("#guessBtn").removeAttr("disabled");

  //if there is no hints left or if the hint was already used in this round, disable the button. Otherwisse it should be enabled
  if(hintsLeft == 0 || hintUsedThisRound){
      $("#hintBtn").attr("disabled", "disabled");
  } 
  else {
      $("#hintBtn").removeAttr("disabled");
  }
  
  //if all skips are used, skip button disabled
  if(skipsLeft == 0){
      $("#skipBtn").attr("disabled", "disabled");
  } 
  else {
      $("#skipBtn").removeAttr("disabled");
  }
}

function pickRandomWord(){
  var categories = Object.keys(wordsByCategory);
  currentCategory = categories[Math.floor(Math.random() * categories.length)];
  var wordList = wordsByCategory[currentCategory][currentLevel];
  var randIndex;
  var selectedWord;
  do {
      randIndex = Math.floor(Math.random() * wordList.length);
      selectedWord = wordList[randIndex];
  } while (usedWords.has(selectedWord));

  usedWords.add(selectedWord);
  currentHint = hintsByCategory[currentCategory][currentLevel][randIndex];
  //alert(selectedWord) - I used this while I was testing my game so that it was easier to trigger a win or a loss
  return selectedWord;
}

function createSubstitute(wordToGuess){
  var result =""
  for(var i = 0; i< wordToGuess.length; i++){ //in case we have spaces in the phrase
    if(wordToGuess.charAt(i) == ' ')
      result += " "
    else
      result += "_"
  }
  return result
}

function checkLetter(letter, wordSubstitute , wordToGuess){
  var contains = 0
  var updateword = wordSubstitute
  updateword = updateword.split("")
  for(var i = 0; i< wordToGuess.length; i++){
    if(letter == wordToGuess.charAt(i)){
                contains = 1
      updateword[i] = letter
    } 
  }

  if(contains == 0){
    wrongGuesses += 1
    document.getElementById("wrongGuesses").innerHTML = '<span id = "span1">' + wrongGuesses + '</span>' + " wrong guess(es)"
  }
  
  updateword = updateword.join("")
  result.innerHTML = updateword
  checkWord(updateword)
  return updateword
}

function checkWord(updateword){
  if(updateword == wordToGuess)
    gamewon()
  if(wrongGuesses >= maxGuesses)
    gamelost()
}

function guessWord(){
  if(roundOver) return;
  var input = document.getElementById("inWord").value
    input = input.toUpperCase()
  $("#inWord").val("")
  if(input == wordToGuess){
    result.innerHTML = wordToGuess  
    gamewon()
  }
  else{
    wrongGuesses += 1
    document.getElementById("wrongGuesses").innerHTML = '<span id = "span1">' + wrongGuesses + '</span>' + " wrong guess(es)"
    if(wrongGuesses>=maxGuesses)
      gamelost()
  }
}

function gamewon(){
  //if the current round is the last of this level
  if(currentRound == maxRoundsPerLevel){ 
    var nextLevel = getNextLevel();
     
    //if this level is not the last one
    if(nextLevel != null){
      document.getElementById("finalResult").innerHTML = "You've completed the level!"
      $("#nextRoundBtn").text("Next Level"); //next round button becomes next level button
      $("#nextRoundBtn").show();
    }
    //if this level is the last one
    else{
      document.getElementById("finalResult").innerHTML ="You've finished all levels! You escaped the cat!";
      $("#nextRoundBtn").hide();
      $("#playAgainBtn").show(); //the game ends in this part so we display the Play Again button
    }
  }
  //if the current round is not the last of this level
  else{
    document.getElementById("finalResult").innerHTML = "Congrats, you won this round. Ready for the next one?"
    $("#nextRoundBtn").text("Next Round");
    $("#nextRoundBtn").show();
  }

  roundOver = true;
  updateThreeButtons();
  disableAlphabet()
}

function gamelost(){

  //updating game state
  lives-=1
  totalLivesLost += 1;
  updateCat();

  //reveal word and display new lives
  updatedword = wordSubstitute.split("")
  for (var i = 0; i < wordToGuess.length; i++){
    if (updatedword[i] == "_") 
    updatedword[i] = '<span style="color:orangered">' + wordToGuess.charAt(i) + '</span>'
  }
  result.innerHTML = updatedword.join("")	
  document.getElementById("livesDisplay").innerHTML = "Lives: " + lives;

  //game over case
  if(lives <= 0){
    roundOver = true;
    updateThreeButtons();
    disableAlphabet()
    document.getElementById("finalResult").innerHTML = "GAME OVER! You lost... The cat got you! ";
    $("#nextRoundBtn").hide();
    $("#playAgainBtn").show();
    return;
  }

  //level/round logic - similar to winning case
  if(currentRound == maxRoundsPerLevel){
    var nextLevel = getNextLevel()
    if(nextLevel != null){
      document.getElementById("finalResult").innerHTML = "You lost this round... but you've completed the level!";
      $("#nextRoundBtn").text("Next Level");
      $("#nextRoundBtn").show();
    }
    else{
      document.getElementById("finalResult").innerHTML = "You lost this round... but you've finished all levels! You escaped the cat!";
      $("#nextRoundBtn").hide();
      $("#playAgainBtn").show();
    }
  }
  else{
    document.getElementById("finalResult").innerHTML = "Sorry, you lost this round.";
    $("#nextRoundBtn").text("Next Round");
    $("#nextRoundBtn").show();
  }

  roundOver = true;
  updateThreeButtons();
  disableAlphabet()
}

function disableAlphabet()
{
  $("#alphabet button,#alphabet").attr("disabled","disabled")
}

//click on the Next Round button activates this function
function nextRound(){ 
  if(currentRound < maxRoundsPerLevel){
    currentRound++;
  }
  else{
    var nextLevel = getNextLevel();
    if(nextLevel != null){
      currentLevel = nextLevel;
      currentRound = 1;
    }
    else{
      return; //no more levels
    }
  }
  maxGuesses = maxGuessesPerLevel[currentLevel];
  $("#alphabet button").removeAttr("disabled"); 
  document.getElementById("finalResult").innerHTML = "";
  startRound();    
}

function getNextLevel(){ //determines whether next level exists or not
  var index = levels.indexOf(currentLevel);
  if(index < levels.length - 1){
    return levels[index + 1];
  }
  else{
    return null;
  }
}

//click on the Hint button activates this function
function useHint(){
  if(hintsLeft == 0){
      document.getElementById("finalResult").innerHTML = "No hints left!"
      return
  }
  if(hintUsedThisRound){
    document.getElementById("finalResult").innerHTML = "You already used a hint this round!"
    return
  }
  hintsLeft--;
  hintUsedThisRound = true;
  updateThreeButtons();
  document.getElementById("hintDisplay").innerHTML = "Hint: " + currentHint;
  document.getElementById("finalResult").innerHTML = "Hint used! (" + hintsLeft + " remaining)";
}

//click on the Skip button activates this function
function useSkip(){
  if(skipsLeft <= 0){
      document.getElementById("finalResult").innerHTML = "No skips left!";
      return
  }
  skipsLeft--;
  updateThreeButtons();
  document.getElementById("finalResult").innerHTML = "Word skipped! (" + skipsLeft + " skips left)";
  nextRound();
}

function updateCat(){
  var scale = 1 + (totalLivesLost * 0.3);
  $("#catImg").css("transform", "scale(" + scale + ")");
}

//click on the Play again button activates this function
function resetGame(){
  showScreen("introScreen");
  //reseting variables
  lives = 0;
  currentRound = 1;
  currentLevel = null;
  wrongGuesses = 0;
  hintsLeft = 3;
  skipsLeft = 1;
  hintUsedThisRound = false;
  roundOver = false;
  totalLivesLost = 0;

  usedWords.clear();

  //reseting UI
  $("#gameArea").hide();
  $("#playAgainBtn").hide();
  $("#nextRoundBtn").hide();
  $("#alphabet button").removeAttr("disabled");
  $("#guessBtn").removeAttr("disabled");
  $("#finalResult").html("");
  $("#result").html("");
  $("#wrongGuesses").html("");
  $("#hintDisplay").html("");
  $("#catImg").css("transform", "scale(1)");
}