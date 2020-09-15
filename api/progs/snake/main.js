//these are used to make the pixel pulse
let t = 0;
let forward = true;
let flashSpeed = 16;

//pixel location and speed
let direction = 90;
let speed = 2.0; //in pixels per second
let lastMove;
let x;
let y;
let appleX, appleY;

let main = [];


let gameStatus = 0;
let score = 0;


// Ricky's TODO notes
//---------------------------------------------------------------------------------------------------------------
// Shouldn't be able to spawn apple on the snake
// Snake Snake should have max length or it could fill the screen, taking up all valid apple spawn locations
// More control options

exports.setup = function(api) {
    api.setFpsLimit(60);
    api.clearInputs();
    api.blank(255,0,0);
    api.setDrawColor(0,0,0);
    api.fillBox(1,1,api.getScreenWidth()-2,api.getScreenHeight()-2);

    lastMove = api.getRunTime();
    x = Math.floor(api.getScreenWidth()/2);
    y = Math.floor(api.getScreenHeight()/2);

    for(let i=5; i>=0; i--) {
        main.push({x: x-i, y:y});
    }

    spawnApple(api);

};

exports.loop = function(api) {
    api.setDrawColor(0,0,0);
    api.fillBox(1,1,api.getScreenWidth()-2,api.getScreenHeight()-2);

    //if a button is pressed then change direction
    if(api.getButtons().left) direction -= 90;
    if(api.getButtons().right) direction += 90;
    if(api.getButtons().any) api.clearInputs();
    // api.debug(direction);

    //over/under flow
    if(direction >= 360) direction-=360;
    if(direction < 0) direction+=360;


    //process movement
    if(api.getRunTime() - lastMove > 1000/speed) {
        lastMove = api.getRunTime();
        score++;
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
            default:
                break;
        }
        main.push({x: x, y: y});


        //if snake has eaten the apple
        if (x === appleX && y === appleY) {
            //allow the snake to grow
            //spawn new apple
            spawnApple(api);
            //increase speed
            speed+=0.5;
            score+=100;
        } else {
            //keep the snake the same length
            main.shift();
        }


        //if the snake has hit the wall
        if(x > api.getScreenWidth() -2 || x < 1 || y > api.getScreenHeight() -2 || y < 1 ) {
            //TODO - instead of just quitting, display score and restart game.
            gameOver(api);
        }

        if (checkCollisionWithSnake(x, y, api)) gameOver(api);
    }

    //draw the apple
    api.setDrawColor(0,255,0);
    api.setPixel(appleX,appleY);


    //draw the snake
    api.setDrawColor(0,255,255);
    for(let i=0; i < main.length; i++) {
        if(i === main.length - 1) api.setDrawColor(255,255,255);
        api.setPixel(main[i].x,main[i].y);
    }
};

function gameOver(api) {
    api.debug(score);
    api.exit();
}

function checkCollisionWithSnake(x, y, api) {
    for(let i = 1; i < main.length - 1; i++) {
        if(main[i].x === x && main[i].y === y) return true;
    }

    return false;
}

function spawnApple(api) {
    let newX, newY, pixelData;
    //spawns an apple at a random point that's not part of a snake

    //valid locations are 2 pixel smaller than the display (to account for borders)
    do {
        newX = Math.floor(Math.random() * (api.getScreenWidth() - 2)) + 1;
        newY = Math.floor(Math.random() * (api.getScreenHeight() - 2)) + 1;
        pixelData = api.getPixel(newX,newY);
    } while (pixelData.r !== 0 || pixelData.g !== 0 || pixelData.b !== 0);
    appleX = newX;
    appleY = newY;

}