

const api = require('./api.js');







    api.start({
        callbackLoop: loop,
        fpsLimit: 30
    });










var t = 0;
var v = 0.3;
var offset = 23.0;

function loop() {

    api.setColor(60,0,150+offset);
    api.blank(0,0,0);
    api.text('Scrolling text demo! ;)',Math.round(offset),1,0,100,0,1);

    if(api.buttons.up) v=v+0.1;
    if(api.buttons.down) v=v-0.1;

    var touches = api.getTouch();
    if(touches.length > 0) {
        api.setPixel(touches[0].x,touches[0].y);
    }


    offset = offset - v;
    if(offset < -120) offset = 23;



}

