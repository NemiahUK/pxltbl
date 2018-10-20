




exports.setup = function(api) {
    // Code here get's executed once at program startup.

    api.fpsLimit = 60;
    // Blank the screen
    api.blank(0, 0, 0);
};

var hasRun = false;

var level = 1;
var width = 9;

var towerTop = 9;
var towerLeft = 7;

var scroll = 0;


var flyInX = 0.0-width;
var flyInY = 2.0;
var flyInSpeed = 0.1;
var flyInStatus = 1;       //0 - waiting   1 - flying in  2 - falling  3 - Landing
var flyInHeight = 2;

var flyInColor = {
    r: 255,
    g: 0,
    b: 0
};


var stack = [];

stack.push({
    width: width,
    left: towerLeft,
    height: flyInHeight,
    color: flyInColor
});

exports.loop = function(api) {

    if(!hasRun) {
        hasRun=true;
        //api.playWav('logon');


    }

    //playing game
    api.blank(0, 0, 0);


    // Draw tower
    for (var i=0; i<stack.length; i++) {

        api.setColor(stack[i].color.r, stack[i].color.g, stack[i].color.b);
        api.fillBox(stack[i].left, (scroll+7)-2*i, stack[i].width, stack[i].height);
    }

    switch (flyInStatus) {
        case 0:

            break;
        case 1:
            //move flyin
            flyInX+=flyInSpeed;

            //draw flyin
            api.setColor(flyInColor.r, flyInColor.g, flyInColor.b);
            api.fillBox(Math.round(flyInX),Math.round(flyInY),width,flyInHeight);

            if(api.buttons.fire) flyInStatus++;

            break;
        case 2:
            //move flyin
            flyInY+=flyInSpeed;

            //draw flyin
            api.setColor(flyInColor.r, flyInColor.g, flyInColor.b);
            api.fillBox(Math.round(flyInX),Math.round(flyInY),width,flyInHeight);

            if(flyInY+flyInHeight >= scroll+towerTop) flyInStatus++;

            break;
        case 3:

            flyInX = Math.round(flyInX);
            flyInY = Math.round(flyInY);

            //calculate new width
            if(flyInX < towerLeft) {
                //too far left
                var oldWidth = width;
                width = flyInX+width - towerLeft;
                flyInX+=oldWidth-width;

            } else if(flyInX > towerLeft) {
                //too far right
                width = towerLeft + width - flyInX;

            } else {
                //bang on!

                //play sound
                api.playWav('beep');

            }

            if(width < 1) {
                api.playWav('looser');
                api.exit();
            }


            //draw flyin
            api.setColor(flyInColor.r, flyInColor.g, flyInColor.b);
            api.fillBox(flyInX,flyInY,width,flyInHeight);

            api.setColor(255, 255, 255,0.7);
            api.fillBox(flyInX,flyInY,width,flyInHeight);

            flyInStatus++;
            break;
        case 4:
            //add to stack

            stack.push({
                width: width,
                left: flyInX,
                height: flyInHeight,
                color: flyInColor
            });





            flyInY=0;
            flyInX=0-width;
            flyInStatus=1;
            flyInSpeed+=0.02;
            flyInColor.g+=50;
            towerTop-=flyInHeight;
            scroll+=2;

            break;
        case 5:


            break;


    }






};

