//these are used to make the pixel pulse
var t = 0;
var forward = true;
var flashSpeed = 16;

//pixel location and speed

var direction = 90;
var speed = 2; //in pixels per second
var lastMove;
var x,y;

var snake = [];



exports.setup = function(api) {
    api.fpsLimit = 60;
    api.clearInputs();
    api.blank(255,0,0);
    api.setColor(0,0,0);
    api.fillBox(1,1,api.pxlW-2,api.pxlH-2);

    lastMove = api.millis;
    x = api.pxlW/2;
    y = api.pxlH/2;

    for(let i=5; i>=0; i--) {
        snake.push({x: x-i, y:y});
    }

};

exports.loop = function(api) {

    api.setColor(0,0,0);
    api.fillBox(1,1,api.pxlW-2,api.pxlH-2);

    //if a button is pressed then exit
    if(api.buttons.left) direction-=90;
    if(api.buttons.right) direction+=90;
    if(api.buttons.any) api.clearInputs();


    if(direction >= 360) direction-=360;
    if(direction < 0) direction+=360;








    //draw the pixel

    api.setColor(0,255,255);
    for(let i=0; i < snake.length; i++) {
        if(i == snake.length - 1) api.setColor(255,255,255);

        api.setPixel(snake[i].x,snake[i].y);

    }

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
        snake.push({x: x, y:y});
        snake.shift();
    }
};


