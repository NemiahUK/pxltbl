const raspi = require('raspi');

//TODO - the the moment this just creates a variable 'pxltblApi' with al lthe properties and methods etc, it needs turning into a proper Node class.
const api = require('./api.js');


//TODO - the raspi.init event could probably be moved to the pxltable class
raspi.init(() => {





    api.construct(60,loop,buttonPress);

    //TODO - Options:  fps, pxlW, pxlH, stripStart, stripZigZag, stripType, whiteBalance

    //TODO - Add SPI to firmware, get SPI to send setup values to arduino before serial starts. Also use SPI for input back




});





var t = 0;
var forward = true;
var x = 12;
var y = 5;
var vX = 0.3;
var vY = 0.3;

var flashSpeed = 16;

var bump = 0;

function loop() {

    //console.log('loop');
    x+=vX;
    y+=vY;

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

    if(bump) {
        api.blank(100,100,0);
        bump--;
    } else {
        api.blank(100,0,0);
    }
    api.fillBox(1, 1, 21, 9, 0, 0, 0, 1);

    api.setPixel(Math.round(x),Math.round(y),0,t,255,0.9);
    if(forward) {
        t+=10;
    } else {
        t-=10;
    }
    if (t > 255 - flashSpeed) forward = false;
    if (t < flashSpeed) forward = true;

}



function buttonPress(button){

    //console.log(button);
    switch(button) {
        case 'up':
            y--;
            break;
        case 'down':
            y++;
            break;
        case 'left':
            x--;
            break;
        case 'right':
            x++;
            break;
        case 'space':

            break;
    }


}