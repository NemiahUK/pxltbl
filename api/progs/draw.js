var color = 0;
var cleared = false;

exports.loop = function(api) {

    if(!cleared) {
        cleared = true;
        api.blank(0,0,0);
    }

    api.setColor(150,40,0);
    api.fillBox(0,0,3,3);


    api.setColor(40,150,0);
    api.fillBox(0,4,3,3);

    api.setColor(150,0,150);
    api.fillBox(0,8,3,3);

    api.setColor(0,0,0);
    if(color != 0) api.setPixel(1,1);
    if(color != 1) api.setPixel(1,5);
    if(color != 2) api.setPixel(1,9);

    var touches = api.getTouch();
    if(touches.length > 0) {
        if(touches[0].x > 3) {
            //draw
            if(color == 0) api.setColor(150,40,0);
            if(color == 1) api.setColor(40,150,0);
            if(color == 2) api.setColor(150,0,150);

            api.setPixel(touches[0].x, touches[0].y);
        } else {
            //change color
            if(touches[0].y < 3) {
                color = 0;
            } else if(touches[0].y > 7) {
                color = 2;
            } else {
                color = 1;
            }

        }
    }






}

