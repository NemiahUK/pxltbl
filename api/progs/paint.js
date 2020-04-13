var color = 0;
var cleared = false;

exports.setup = function(api) {
    api.fpsLimit = 60;

};

exports.loop = function(api) {

    if(!cleared) {
        cleared = true;
        api.blank(0,0,0);
    }

    api.setColor(255,128,0);
    api.fillBox(0,0,3,3);


    api.setColor(100,255,0);
    api.fillBox(0,3,3,3);

    api.setColor(255,0,255);
    api.fillBox(0,6,3,3);

    api.setColor(0,255,255);
    api.fillBox(0,9,3,3);

    api.setColor(100,100,100);
    api.fillBox(0,12,3,3);

    api.setColor(255,0,0);
    api.setPixel(0,15);
    api.setPixel(2,15);
    api.setPixel(1,16);
    api.setPixel(0,17);
    api.setPixel(2,17);

    api.setColor(0,0,0);
    if(color !== 0) api.setPixel(1,1);
    if(color !== 1) api.setPixel(1,4);
    if(color !== 2) api.setPixel(1,7);
    if(color !== 3) api.setPixel(1,10);
    if(color !== 4) api.setPixel(1,13);

    const touches = api.getTouch();
    if(touches.length > 0) {
        for (let i = 0; i < touches.length; i++) {

            if (touches[i].x > 3) {
                //draw
                if (color === 0) api.setColor(255,128,0);
                if (color === 1) api.setColor(100,255,0);
                if (color === 2) api.setColor(255,0,255);
                if (color === 3) api.setColor(0,255,255);
                if (color === 4) api.setColor(0, 0, 0);

                api.setPixel(touches[i].x, touches[i].y);
            } else {
                //change color
                if (touches[i].y < 3) {
                    color = 0;
                } else if (touches[i].y < 6) {
                    color = 1;
                } else if (touches[i].y < 9) {
                    color = 2;
                } else if (touches[i].y < 12) {
                    color = 3;
                } else if (touches[i].y < 15) {
                    color = 4;
                } else if (touches[i].y < 18) {
                    api.exit();
                }

            }
        }

    }

};

