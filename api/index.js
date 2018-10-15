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
var flashSpeed = 16;

function loop() {

    //console.log('loop');

    if(x >= api.pxlW) x = 0;
    if(x < 0) x = api.pxlW-1;
    if(y >= api.pxlH) y = 0;
    if(y < 0) y = api.pxlH-1;

    api.blank(0,20,0);
    api.setPixel(Math.round(x),Math.round(y),255,0,t);
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