




exports.setup = function(api) {
    // Code here get's executed once at program startup.

    api.fpsLimit = 60;
    // Blank the screen
    api.blank(0, 0, 0);
};

var hasRun = false;

var level = 1;
var width = 9;

var towerTop = 0;
var towerHeight = 0;
var towerLeft = 7;

var scroll = 11;

var gravity = 0.5;


var flyInX = 0.0-width;
var flyInY = 0.0;
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
    height: 1,
    color: { r:255, g:255, b:255}
});


var gibs = [];

exports.loop = function(api) {

    if(!hasRun) {
        hasRun=true;
        //api.playWav('logon');


    }

    //playing game
    api.blank(0, 0, 0);

    //scroll tower/gibs if needed..
    if(scroll - towerHeight < 5) scroll++;



    // Draw tower
    towerHeight = 0;
    for (var i=0; i<stack.length; i++) {
        towerHeight+= stack[i].height;

        api.setColor(stack[i].color.r, stack[i].color.g, stack[i].color.b);
        api.fillBox(stack[i].left, scroll-towerHeight, stack[i].width, stack[i].height);
    }

    //draw gibs
    for (var i=0; i<gibs.length; i++) {

        api.setColor(Math.round(gibs[i].r),Math.round(gibs[i].g),Math.round(gibs[i].b),Math.round(gibs[i].a));
        api.setPixel(Math.round(gibs[i].x), Math.round(gibs[i].y+scroll));

        //movement
        gibs[i].x+=gibs[i].vX;
        gibs[i].y+=gibs[i].vY;
        //gravity
        gibs[i].vY+=gravity;
        //fade
        gibs[i].a-=16;

    }


    switch (flyInStatus) {
        case 0:

            break;
        case 1: //flying in...
            //move flyin
            flyInX+=flyInSpeed;

            //draw flyin
            api.setColor(flyInColor.r, flyInColor.g, flyInColor.b);
            api.fillBox(Math.round(flyInX),Math.round(flyInY),width,flyInHeight);

            if(api.buttons.fire) flyInStatus++;

            break;
        case 2: //falling ...
            //move flyin
            flyInY+=gravity;

            //draw flyin
            api.setColor(flyInColor.r, flyInColor.g, flyInColor.b);
            api.fillBox(Math.round(flyInX),Math.round(flyInY),width,flyInHeight);

            if(flyInY+flyInHeight >= scroll-towerHeight) flyInStatus++;

            break;
        case 3:  //landed...

            flyInX = Math.round(flyInX);
            flyInY = Math.round(flyInY);

            //calculate new width
            if(flyInX < towerLeft) {
                //too far left

                //spawn gibs
                for (var i=flyInX; i<towerLeft; i++) {
                    for (var j=0; j<flyInHeight; j++) {
                        spawnGib(i, flyInY+j - scroll, true, flyInColor.r, flyInColor.g, flyInColor.b);
                    }
                }

                var oldWidth = width;
                width = flyInX+width - towerLeft;
                flyInX+=oldWidth-width;



            } else if(flyInX > towerLeft) {
                //too far right

                //spawn gibs
                for (var i=towerLeft+width; i<flyInX+width; i++) {
                    for (var j=0; j<flyInHeight; j++) {
                        spawnGib(i, flyInY+j - scroll, false, flyInColor.r, flyInColor.g, flyInColor.b);
                    }
                }

                width = towerLeft + width - flyInX;
                towerLeft = flyInX;


            } else {
                //bang on!

                //play sound
                api.playWav('beep');

            }

            if(width < 1) {
                //api.playWav('looser');
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
                color: {
                    r: flyInColor.r,
                    g: flyInColor.g,
                    b: flyInColor.b
                }
            });




            flyInY=0;

            flyInStatus=1;
            flyInSpeed*= -1;
            if(flyInSpeed > 0) {
                flyInSpeed+=0.01;
                flyInX=0-width;
            } else {
                flyInSpeed-=0.01;
                flyInX=api.pxlW;
            }

            flyInColor.g+=100;
            flyInHeight=Math.ceil(Math.random() * Math.floor(3));





            break;
        case 5:


            break;


    }






};


function spawnGib(x,y,left,r,g,b) {


    var vX = -0.8 + (Math.random()*0.5);
    var vY =  -2 + (Math.random()*1);

    if(!left) vX*= -1;

    gibs.push({
        x: x,
        y: y,
        vX: vX,
        vY: vY,
        r: r,
        g: g,
        b: b,
        a: 1
    });
};

