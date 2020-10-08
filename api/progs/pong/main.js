// Config vars
const touchWidth = 2;
const paddleWidth = 5;
const aiPosErrorMargin = 1.5;
const aiSpeed = 4;
const startingBallSpeed = 10;
const ballSpeedIncrement = 0.2;
const fps = 30;
const pointToWin = 3;

const gameStates = {
    PLAYING : 'playing',
    DEMO : 'Demo',
    PLAYER_SELECT : 'Player select',
    GAME_OVER : 'Game Over'
}

let currentGameState = gameStates.PLAYER_SELECT;

// These are used to make the pixel pulse
let t = 0;
let forward = true;
let flashSpeed = 16;

// Pixel location and speed
let x;
let y;
let vX;
let vY;

// If value > 0 then there has been a "bump". Equal to the amount of frames we
// react to the bump (visual feedback).
let bump = 0;

// Paddle positions
let leftPaddlePos;
let rightPaddlePos;

let leftControlledByAi = true;
let rightControlledByAi = true;

let currentBallSpeed = startingBallSpeed;
let leftPlayerScore = 0;
let rightPlayerScore = 0;

// Frame time vars
let deltaTime = 0;
let lastGameTick = 0;

// Game setup
exports.setup = function(api) {
    api.fpsLimit = fps;

    // Set initial position of paddles
    leftPaddlePos = Math.floor(api.getScreenHeight() / 2);
    rightPaddlePos = Math.floor(api.getScreenHeight() / 2);

    // Set initial position of the "ball"
    resetBall(api);

    // Set up frame timer
    lastGameTick = api.getRunTime();
};


// Main execution loop
exports.loop = function(api) {
    // Get delta time
    let currentTime = api.getRunTime()
    deltaTime = currentTime - lastGameTick;
    lastGameTick = currentTime


    // Game input -------------------------------------------------------------
    // ------------------------------------------------------------------------

    // Get touch - position paddles
    let touches = api.getTouch();

    // check game state before acting accordingly.
    switch(currentGameState) {
        case gameStates.DEMO:
            if (touches.length > 0 || api.getButtons().any )
                api.clearInputs();
                currentGameState = gameStates.PLAYER_SELECT;

            // AI :robot: - Super advanced!!! Be careful when making changes
            processAiControllers();

            // Limit to valid positions
            limitPaddlePos(api);

            // Game logic
            gameLogic(api)

            // Game Drawing -----------------------------------------------------------
            // ------------------------------------------------------------------------

            // Static elements draw

            // If there has been an impact then flash border yellow
            if(bump) {
                api.blank(100,100,0);
                bump--;
            } else {
                api.blank(100,0,0);
            }

            // Draw the black playing area
            api.setDrawColor(0, 0, 0, 1);
            api.fillBox(0, 1, api.getScreenWidth(), api.getScreenHeight() - 2);

            drawScore(api);
            drawPaddles(api);
            drawBall(api);
            break;

        case gameStates.PLAYING:
            // Process touches
            if(touches.length > 0) {
                for (let i = 0; i < touches.length; i++) {
                    if(touches[i].x < touchWidth && !leftControlledByAi) {
                        leftPaddlePos = touches[i].y;
                    } else if (touches[i].x >=
                        api.getScreenWidth() - touchWidth &&
                        !rightControlledByAi) {
                        api.clearInputs();
                        rightPaddlePos = touches[i].y;
                    }
                }
            }

            // AI :robot: - Super advanced!!! Be careful when making changes
            processAiControllers();

            // Limit to valid positions
            limitPaddlePos(api);

            // Game logic
            gameLogic(api)

            // Game Drawing -----------------------------------------------------------
            // ------------------------------------------------------------------------

            // Static elements draw

            // If there has been an impact then flash border yellow
            if(bump) {
                api.blank(100,100,0);
                bump--;
            } else {
                api.blank(100,0,0);
            }

            // Draw the black playing area
            api.setDrawColor(0, 0, 0, 1);
            api.fillBox(0, 1, api.getScreenWidth(), api.getScreenHeight() - 2);

            drawScore(api);
            drawPaddles(api);
            drawBall(api);
            break;

        case gameStates.PLAYER_SELECT:

            // Game Drawing -----------------------------------------------------------
            // ------------------------------------------------------------------------


            // Draw the black playing area
            api.setDrawColor(0, 0, 0, 1);
            api.fillBox(0, 0, api.getScreenWidth(), api.getScreenHeight());

            if(touches.length > 0) {
                for (let i = 0; i < touches.length; i++) {
                    if (touches[i].y > api.getScreenHeight() / 2) {
                        currentGameState = gameStates.PLAYING;
                        api.clearInputs();
                    }

                    else if (touches[i].x < api.getScreenWidth() / 2) {
                        leftControlledByAi = !leftControlledByAi;
                        api.clearInputs();
                    } else {
                        rightControlledByAi = !rightControlledByAi;
                        api.clearInputs();
                    }
                }
            }

            if (api.getButtons().any ) {
                api.clearInputs();
                currentGameState = gameStates.DEMO;
            }


            // Draw dynamic elements ------------------------------------------

            let leftMsg = (leftControlledByAi) ? 'C' : 'P';
            let rightMsg = (rightControlledByAi) ? 'C' : 'P';
            const readyMsg = 'Go!'

            let msgSize = api.textBounds('C');
            let readyMsgSize = api.textBounds(readyMsg);

            api.setDrawColor(255, 255, 255);
            api.text(leftMsg, Math.floor(api.getScreenWidth() / 2 - (2 + msgSize.w)), 1);
            api.text(rightMsg, Math.floor(api.getScreenWidth() / 2 + 2), 1);

            api.setDrawColor(100, 255, 0);
            api.text(readyMsg, Math.floor(api.getScreenWidth() / 2) - (readyMsgSize.w / 2), (Math.floor(api.getScreenHeight() / 2) + 1));
            break;

        case gameStates.GAME_OVER:
            api.setDrawColor(0, 0, 0, 1);
            api.fillBox(0, 0, api.getScreenWidth(), api.getScreenHeight());

            if (touches.length > 0 || api.getButtons().any ){
                api.clearInputs();
                resetScore();
                currentGameState = gameStates.PLAYER_SELECT;
            }


            let winnerMsg = Math.max(leftPlayerScore, rightPlayerScore).toString();
            let winnerMsgSize = api.textBounds(winnerMsg);
            let looserMsg = Math.min(leftPlayerScore, rightPlayerScore).toString();
            let looserMsgSize = api.textBounds(looserMsg);

            let winPosX = 0;
            let loosePosX = 0;
            let posY = api.getScreenHeight() / 2 - Math.max(looserMsgSize.h) / 2;

            if(leftPlayerScore > rightPlayerScore) {
                winPosX = 1;
                loosePosX = api.getScreenWidth() - looserMsgSize.w - 1;
            } else {
                winPosX = api.getScreenWidth() - winnerMsgSize.w - 1;
                loosePosX = 1;
            }

            api.setDrawColor(100, 255, 0);
            api.text(winnerMsg, winPosX, posY)

            api.setDrawColor(255, 0, 0);
            api.text(looserMsg, loosePosX, posY)

            break;

        default:
            break;
    }
}; // End game loop -----------------------------------------------------------

function resetBall(api) {
    // Reset position
    x = api.getScreenWidth() / 2;
    y = api.getScreenHeight() / 2;

    // Set initial velocity vector
    currentBallSpeed = startingBallSpeed;

    (Math.random() >= 0.5) ? vX = -1 : vX = 1;
    vY = 1 - Math.random() * 2;

    // now we have a vector, we need to normalize it and set the magnitude to
    // the balls velocity.
    limitBallVelocity();
}

function resetScore() {
    leftPlayerScore = 0;
    rightPlayerScore = 0;
}

function limitBallVelocity() {
    let magnitude = Math.sqrt((vX * vX) + (vY * vY))
    vX /= magnitude;
    vX *= currentBallSpeed;

    vY /= magnitude;
    vY *= currentBallSpeed;
}

function processAiControllers() {
    if(leftControlledByAi || rightControlledByAi) {
        let idealPos = Math.round(y);

        if (leftControlledByAi) {
            if(idealPos > Math.round(leftPaddlePos + aiPosErrorMargin)) {
                let distance = Math.abs(idealPos -
                    leftPaddlePos + aiPosErrorMargin);

                // Move paddle to the ball
                leftPaddlePos += Math.min(distance, aiSpeed)
            } else if(idealPos < leftPaddlePos + aiPosErrorMargin) {

                let distance = Math.abs(idealPos -
                    leftPaddlePos + aiPosErrorMargin);

                // Move paddle to the ball
                leftPaddlePos -= Math.min(distance, aiSpeed / deltaTime);
            }
        }

        if (rightControlledByAi) {
            if(idealPos > Math.round(rightPaddlePos + aiPosErrorMargin)) {
                let distance = Math.abs(idealPos
                    - rightPaddlePos + aiPosErrorMargin);

                // Move paddle to the ball
                rightPaddlePos += Math.min(distance, aiSpeed)
            } else if(idealPos < rightPaddlePos + aiPosErrorMargin) {

                let distance = Math.abs(idealPos - rightPaddlePos
                    + aiPosErrorMargin);

                // Move paddle to the ball
                rightPaddlePos -= Math.min(distance, aiSpeed / deltaTime);
            }
        }
    }
}

function limitPaddlePos(api) {
    let minPaddlePos = Math.floor(paddleWidth/2)+1;
    let maxPaddlePos = api.getScreenHeight() - Math.floor(paddleWidth/2)-2;
    leftPaddlePos =
        Math.min(Math.max(leftPaddlePos, minPaddlePos), maxPaddlePos);
    rightPaddlePos =
        Math.min(Math.max(rightPaddlePos, minPaddlePos), maxPaddlePos);
}

function drawScore(api) {
    let leftMsgSize = api.textBounds(leftPlayerScore.toString());

    api.setDrawColor(100, 100, 100)
    api.text(leftPlayerScore.toString(), Math.floor(api.getScreenWidth() / 2 - (2 + leftMsgSize.w)), 2);
    api.text(rightPlayerScore.toString(), Math.floor(api.getScreenWidth() / 2 + 2), 2);
}

function drawPaddles(api) {
    // Draw paddles
    api.setDrawColor(0,128,0);
    api.fillBox(0, leftPaddlePos - Math.floor(paddleWidth / 2), 1, paddleWidth);
    api.fillBox(api.getScreenWidth()-1, rightPaddlePos -
        Math.floor(paddleWidth / 2), 1, paddleWidth);
}

function drawBall(api) {
    // Draw the pixel
    api.setDrawColor(0, t, 255, 0.9);
    api.setPixel(Math.round(x), Math.round(y));

    //update the pulsating colour
    if(forward) {
        t += flashSpeed;
    } else {
        t -= flashSpeed;
    }
    if (t > 255 - flashSpeed) forward = false;
    if (t < flashSpeed) forward = true;
}

function checkCollisions(api) {
    // Check for paddle collision or out of bounds
    if(((Math.round(x) < 1 || Math.round(x) >= api.getScreenWidth() - 1))  ) {

        let leftPaddleBottom = leftPaddlePos - Math.floor(paddleWidth / 2);
        let leftPaddleTop = leftPaddleBottom + paddleWidth;

        let rightPaddleBottom = rightPaddlePos - Math.floor(paddleWidth / 2);
        let rightPaddleTop = rightPaddleBottom + paddleWidth;

        if((Math.round(x) < 1 &&
                (y >= leftPaddleBottom &&
                 y <= leftPaddleTop)) ||
                (Math.round(x) >= api.getScreenWidth() - 1 &&
                (y >= rightPaddleBottom &&
                 y <= rightPaddleTop))) {
            // Change ball direction
            vX = 0 - vX;

            // Activate feedback
            api.playWav('sfx_sounds_Blip9');
            // TODO - add pulse to paddle

            // Modify game vars
            // For now randomise direction slightly
            vY += Math.random() * 0.2 - 0.1;

            currentBallSpeed += ballSpeedIncrement;
            limitBallVelocity();

            // TODO - calc paddle velocity and apply to ball

        } else {
            // Point lost
            // api.debug('Ball pos: ' + x + ', ' + y + '\n');
            //
            // api.debug('\n\n');
            //
            // api.debug('Left pos: ' + leftPaddlePos);
            // api.debug('Left top: ' + leftPaddleTop);
            // api.debug('Left bottom: ' + leftPaddleBottom);
            //
            // api.debug('\n');
            //
            // api.debug('Right pos: ' + rightPaddlePos);
            // api.debug('Right top: ' + rightPaddleTop);
            // api.debug('Right bottom: ' + rightPaddleBottom);
            //
            // api.debug('\n\n');

            if(Math.round(x) >= api.getScreenWidth() - 1) {
                // Ball lost on right side:
                leftPlayerScore++;

                if (leftPlayerScore >= pointToWin)
                    currentGameState = gameStates.GAME_OVER;
            } else {
                rightPlayerScore++;

                if (rightPlayerScore >= pointToWin)
                    currentGameState = gameStates.GAME_OVER;
            }

            resetBall(api);
            api.playWav('sfx_exp_medium1');
        }
    }
}

function gameLogic(api) {
    // Ball ------------------------------------------------------

    // Move the pixel by the current speed
    x += vX / deltaTime;
    y += vY / deltaTime;

    // If pixel hits an edge then reverse direction, play sound and set
    // border yellow for 5 frames
    if(y >= api.getScreenHeight() - 2 || y < 1) {
        vY = 0 - vY;
        bump = 5;
        api.playWav('sfx_sounds_Blip7');
    }

    checkCollisions(api);
}
