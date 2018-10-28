var player;

exports.setup = function(api) {
    api.fpsLimit = 60;
    api.setRotation(0);


};

var rainbow = [0,45,65,135,210,260,270];

var xPos = 0;
var xScroll = 5;

var animState = 0;

exports.loop = function(api) {

    api.blank(0, 0, 0);

    var y = 1;
    if(xPos%6 < 3) y=0;

    api.setColor(255,255,255);
    api.fillBox(xPos-xScroll,1+y,7,7);
    api.setColor(0, 0, 0);
    api.fillBox(xPos+3-xScroll,4+y,1,4);
    api.text('nemiah', xPos+1-xScroll,y);

    for (var j=0; j < 8; j++) {
        for (var i = 0; i < 7; i++) {
            var y = 1;
            if((xPos-j)%6 < 3) y=0;
            api.setColorHsl(rainbow[i], 255, 128, 1-j/9);
            api.setPixel(xPos - j - 1-xScroll, 1 + i + y);
        }
    }


    if(animState === 0) {
        xPos+=0.2;
    } else {
        xPos+=1;
    }
    if(xPos > 13 && animState === 0) xScroll+=0.2;

    if(api.buttons.any) {
        animState++;


    }



    //prevent overflow
    if(xPos > 24 && animState === 0) {
        xPos = 18;
        xScroll = 10;
    }

    if(xPos-xScroll > 30) api.exit();



};

