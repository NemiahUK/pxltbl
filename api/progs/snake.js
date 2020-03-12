//these are used to make the pixel pulse
var t = 0;
var forward = true;
var flashSpeed = 16;

//pixel location and speed

var direction = 90;
var speed = 2; //in pixels per second
var lastMove;
var x,y;
var appleX, appleY;

var snake = [];
var score = 0;


// Ricky's TODO notes
//---------------------------------------------------------------------------------------------------------------
// Shouldn't be able to spawn apple on the snake
// Snake Snake should have max length or it could fill the screen, taking up all valid apple spawn locations
// Turn left and right instead of just right.

exports.setup = function(api) {
    api.fpsLimit = 60;
    api.clearInputs();
    api.blank(255,0,0);
    api.setColor(0,0,0);
    api.fillBox(1,1,api.pxlW-2,api.pxlH-2);

    lastMove = api.millis;
    x = Math.floor(api.pxlW/2);
    y = Math.floor(api.pxlH/2);

    for(let i=5; i>=0; i--) {
        snake.push({x: x-i, y:y});
    }

    score = 0;

    spawnApple(api);

};

exports.loop = function(api) {

    api.setColor(0,0,0);
    api.fillBox(1,1,api.pxlW-2,api.pxlH-2);

    //if a button is pressed then change direction
    if(api.buttons.left) direction-=90;
    if(api.buttons.right) direction+=90;
    if(api.buttons.any) api.clearInputs();

    //over/under flow
    if(direction >= 360) direction-=360;
    if(direction < 0) direction+=360;


    //process movement
    if(api.millis - lastMove > 1000/speed) {
        lastMove = api.millis;
        switch (direction) {
            case 0:
                y--;
                break;
            case 90:
                x++;
                break;
            case 180:
                y++;
                break;
            case 270:
                x--;
                break;
        }
        snake.push({x: x, y: y});


        //if snake has eaten the apple
        if (x == appleX && y == appleY) {
            //allow the snake to grow
            //spawn new apple
            spawnApple(api);
            //increase speed
            speed+=0.2;
        } else {
            //keep the snake the same length
            snake.shift();
        }


        //if the snake has hit the wall
        if(x > api.pxlW -2 || x < 1 || y > api.pxlH -2 || y < 1 ) {
            //TODO - instead of just quitting, display score and restart game.
            gameOver();
        }

        if (checkCollisionWithSnake(x, y, api)) gameOver(api);
    }

    //draw the apple
    api.setColor(0,255,0);
    api.setPixel(appleX,appleY);


    //draw the snake
    api.setColor(0,255,255);
    for(let i=0; i < snake.length; i++) {
        if(i == snake.length - 1) api.setColor(255,255,255);
        api.setPixel(snake[i].x,snake[i].y);
    }
};

function gameOver(api) {
    api.debug(snake.length);
    api.exit();
}

function checkCollisionWithSnake(x, y, api) {
    for(let i = 1; i < snake.length - 1; i++) {
        if(snake[i].x === x || snake[i].y === y) return true;
    }

    return false;
}

function spawnApple(api) {
    //spawns an apple at a random point that's not part of a snake

    //valid locations are 2 pixel smaller than the display (to account for borders)
    appleX = Math.floor(Math.random()*(api.pxlW-2)) + 1;
    appleY = Math.floor(Math.random()*(api.pxlH-2)) + 1;

}