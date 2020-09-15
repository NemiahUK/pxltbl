const rainbow = [0,45,65,135,210,260,270];

let xPos = 0;
let yPos = 0;
let xScroll = 5;

let animState = 0;

exports.setup = function(api) {
    api.fpsLimit = 60;
    api.setOrientation(0);
    yPos = Math.floor((api.getScreenHeight() - 8) / 2);


};



exports.loop = function(api) {

    api.blank(0, 0, 0);

    let y = yPos;
    if(xPos % 6 < 3) y = yPos - 1;

    api.setDrawColor(255, 255, 255);
    api.fillBox(xPos - xScroll, 1 + y, 7, 7);
    api.setDrawColor(0, 0, 0);
    api.fillBox(xPos + 3 - xScroll, 4 + y, 1, 4);
    api.text('n', xPos + 1 - xScroll, y);



    for (let j=0; j < 8; j++) {
        for (let i = 0; i < 7; i++) {
            y = yPos;
            if((xPos-j)%6 < 3) y--;
            api.setDrawColorHsl(rainbow[i], 255, 128, 1-j/9);
            //api.setDrawColor(255,0,0);
            api.setPixel(xPos - j - 1-xScroll, 1 + i + y);
        }
    }


    if(animState === 0) {
        xPos += 0.2;
    } else {
        xPos += 1;
    }
    if(xPos >= (api.getScreenWidth()+10)/2 && animState === 0) xScroll+=0.2;

    if(api.getButtons().any || api.getTouch().length) {
        animState=1;
    }


    //prevent overflow
    if(xPos > ((api.getScreenWidth()+12)/2)+6 && animState === 0) {
        xPos = (api.getScreenWidth()+12)/2;
        xScroll = 6;
    }


    if(xPos-xScroll > api.getScreenWidth()+12){
        api.exit();
    }
};

