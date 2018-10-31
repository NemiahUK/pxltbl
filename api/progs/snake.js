//these are used to make the pixel pulse
var t = 0;
var forward = true;
var flashSpeed = 16;

//pixel location and speed
var x = 12;
var y = 5;
var vX = 0.3;
var vY = 0.3;

//have we had a bump?
var bump = 0;

exports.setup = function(api) {
    api.fpsLimit = 60;
};

exports.loop = function(api) {

    //if a button is pressed then exit
    if(api.buttons.topLeft) y--;
    if(api.buttons.leftTop) x--;
    if(api.buttons.leftBottom) x++;
    if(api.buttons.bottomLeft) y++;

    api.clearInputs();


    api.blank(0,0,0);

    //draw the pixel
    api.setColor(0,t,255);
    api.setPixel(x,y);

    //update the pulsating colour
    if(forward) {
        t+=flashSpeed;
    } else {
        t-=flashSpeed;
    }
    if (t > 255 - flashSpeed) forward = false;
    if (t < flashSpeed) forward = true;
};


