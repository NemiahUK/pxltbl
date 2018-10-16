




//these are used to make the pixel pulse
var t = 0;
var forward = true;
var flashSpeed = 16;

//pixel location and speed
var x = 12;
var y = 5;
var vX = 0.2;
var vY = 0.2;

//have we had a bump?
var bump = 0;

exports.loop = function(api) {

    //move the pixel by the current speed
    x+=vX;
    y+=vY;

    //if pixel at edges then reverse direction, play sound and set border yellow for 5 frames
    if(x >= api.pxlW-2 || x < 1) {
        vX = 0-vX;
        bump = 5;
        api.playWav();
    }
    if(y >= api.pxlH-2 || y < 1) {
        vY = 0-vY;
        bump = 5;
        api.playWav();
    }

    //if there has been an impact then flash border yellow
    if(bump) {
        api.blank(100,100,0);
        bump--;
    } else {
        api.blank(100,0,0);
    }

    //draw the black playing area
    api.setColor(0,0,0,1);
    api.fillBox(1, 1, 21, 9);

    //draw the pixel
    api.setColor(0,t,255,0.9);
    api.setPixel(Math.round(x),Math.round(y));

    //update the pulsating colour
    if(forward) {
        t+=flashSpeed;
    } else {
        t-=flashSpeed;
    }
    if (t > 255 - flashSpeed) forward = false;
    if (t < flashSpeed) forward = true;

};


