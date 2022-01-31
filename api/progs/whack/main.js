// Whack a mole prog.

// Put variables here that you need to persist between loops.
var failMessage = 'Over'; // Message that appears when game is over.
var welcomeMessage = 'Whack a Mole'; // Title of game.
var moleCorner = 0;  // 0 = top left, 1 = top right ...
var moleVisible = false;
var moleWhacked = false;
var moleWhackedTime = 0; // Time when mole was whacked.
var moleAppearTime = 0; // Time when mole appeared.
var timeLimit = 3000; // Time given to whack mole.
var score = 0; // One mole = one point.
var gameState = 0; // Switch that cycles between welcome screen, main game and game end.

exports.setup = function(api) {
    // Code here gets executed once at program startup.

    // Blanks the screen
    api.blank(0, 0, 0);

}

exports.loop = function(api) {

    //need to add switch here on gameState
    switch (gameState) {
        case 0:
            //welcome screen
            setupGame(api);
            break;
        case 1:
            // Main game
            playGame(api);
            break;
        case 2:
            //game over screen
            endOfGame(api);
            break;

    }
}

function setupGame(api) {

    //if any button pressed,  gameState++;
    api.blank(0, 0, 0);
    api.setDrawColor(106,13,173); // Purple
    api.text(welcomeMessage,2,5); // Displays game name.
    if (api.getButtons().any) {
        // Triggers main game when any button is pressed. Will include touch soon.
        api.blank(0, 0, 0);
        gameState = 1;
        moveMole(api);// Set mole to random corner.
    }
}

// Game mechanics.
function playGame(api) {

    // Draws hole borders.
    api.setDrawColor(106,13,173);
    api.fillBox(0,0,4,4);
    api.setDrawColor(0,0,0);
    api.fillBox(1,1,2,2);
    api.setDrawColor(106,13,173);
    api.fillBox(28,0,4,4);
    api.setDrawColor(0,0,0);
    api.fillBox(29,1,2,2);
    api.setDrawColor(106,13,173);
    api.fillBox(0,14,4,4);
    api.setDrawColor(0,0,0);
    api.fillBox(1,15,2,2);
    api.setDrawColor(106,13,173);
    api.fillBox(28,14,4,4);
    api.setDrawColor(0,0,0);
    api.fillBox(29,15,2,2);

    var moleX, moleY;

    // Hole locations.
    switch (moleCorner) {
        case 0:
            moleX = 1;
            moleY = 1;
            break;
        case 1:
            moleX = 29;
            moleY = 1;
            break;
        case 2:
            moleX = 1;
            moleY = 15;
            break;
        case 3:
            moleX = 29;
            moleY = 15;
            break;
    }

    // if mole visible = true
    if(moleVisible === true) {
        // draw the mole in the correct corner
        // has it been whacked
        if(moleWhacked) {
            api.setDrawColor(255,0,0);
        } else {
            api.setDrawColor(255,255,255);
        }
        // If time has elapsed and mole not whacked.
        if(api.getMillis() - moleAppearTime > timeLimit) {
            gameOver(api);
        }
        api.fillBox(moleX, moleY, 2,2);

    }




    // switch for each corner
    switch (moleCorner) {
        case 0:

            // does the button pressed == the correct corner?
            if(api.getButtons().topLeft || api.getButtons().leftTop || api.isTouchInBounds(0,0,4,4)) {
                // if so display the mole whacked
                moleWhackedTime = api.getMillis();
                moleWhacked = true;
            }
            break;
        case 1:
            if(api.getButtons().topRight || api.getButtons().rightTop || api.isTouchInBounds(28,0,4,4)) {
                moleWhacked = true;
                moleWhackedTime = api.getMillis();
            }
            break;
        case 2:
            if(api.getButtons().bottomLeft || api.getButtons().leftBottom || api.isTouchInBounds(0,14,4,4)) {
                moleWhacked = true;
                moleWhackedTime = api.getMillis();
            }
            break;
        case 3:
            if(api.getButtons().bottomRight || api.getButtons().rightBottom || api.isTouchInBounds(28,14,4,4)) {
                moleWhacked = true;
                moleWhackedTime = api.getMillis();
            }
            break;

    }

    // if been whacked move the mole to a new corner
    if(moleWhacked && api.getMillis() - moleWhackedTime > 1000) {

        api.clearInputs();
        api.log('Time: ' + (moleWhackedTime - moleAppearTime));
        score += 1;
        api.log('Score: ' + score);
        timeLimit = timeLimit - 100;
        api.log('Time Limit: ' + timeLimit);
        moveMole(api);

        if(api.getButtons().topRight) {
            if(moleWhackedTime > 1000) {
                gameOver(0);
            }
        }




    }


}

function endOfGame(api) {
    //display score / game over msg
    api.blank(0, 0, 0);
    api.setDrawColor(255, 0, 0);
    api.text(failMessage,2,2);
    api.text('SC=' + score,2,10);

    //give option to exit, or option to restart
    if (api.getButtons().left || api.isTouchInBounds(0,0,16,18)) {
        api.exit();
    } else if (api.getButtons().right || api.isTouchInBounds(17,0,16,18)) {
        gameState = 0;
    }
}





function gameOver(api) {
    //advance gameState
    gameState = 2;

    //play sound
    api.playWav('looser');


}

function moveMole(api) {
    // set the mole to a random corner
    moleCorner = Math.floor(Math.random() * 4);
    // set the mole to be visible
    moleVisible = true;
    // and not whacked
    moleWhacked = false;
    //blank the screen
    api.blank(0, 0, 0);
    moleAppearTime = api.getMillis();

}


