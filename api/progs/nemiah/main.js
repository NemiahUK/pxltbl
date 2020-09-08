var rainbow = [0,45,65,135,210,260,270];

var xPos = 0;
var yPos;
var xScroll = 5;

var animState = 0;

exports.setup = function(api) {
    api.fpsLimit = 60;
    api.setRotation(0);
    yPos = Math.floor((api.pxlH - 8)/2);
};



exports.loop = function(api) {
    api.blank(0, 0, 0);

    var y = yPos;
    if(xPos%6 < 3) y=yPos-1;

    api.setColor(255,255,255);
    api.fillBox(xPos-xScroll,1+y,7,7);
    api.setColor(0, 0, 0);
    api.fillBox(xPos+3-xScroll,4+y,1,4);
    api.text('nemiah', xPos+1-xScroll,y);


    for (var j=0; j < 8; j++) {
        for (var i = 0; i < 7; i++) {
            var y = yPos;
            if((xPos-j)%6 < 3) y--;
            api.setColorHsl(rainbow[i], 255, 128, 1-j/9);
            api.setPixel(xPos - j - 1-xScroll, 1 + i + y);
        }
    }


    if(animState === 0) {
        xPos+=0.2;
    } else {
        xPos+=1;
    }
    if(xPos >= (api.pxlW+10)/2 && animState === 0) xScroll+=0.2;

    if(api.buttons.any || api.getTouch().length) {
        animState=1;
    }


    //prevent overflow
    if(xPos > ((api.pxlW+12)/2)+6 && animState === 0) {
        xPos = (api.pxlW+12)/2;
        xScroll = 6;
    }


    if(xPos-xScroll > api.pxlW+12){
        api.exit();
    }
};

