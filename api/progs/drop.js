/*

Drop Game by Steven Tomlinson https://github.com/TmpR


 */




exports.setup = function(api) {
    // Code here get's executed once at program startup.

    api.debug('Starting game...');
    api.fpsLimit = 60;
    // Blank the screen
    api.blank(0, 0, 0);
    api.playWav('sfx_sound_poweron');

};

var hasRun = false;
var gameStatus = 0;
var gravity = 0.5;

var level,width, towerTop, towerHeight, towerLeft ,scroll;
var flyInX, flyInY, flyInSpeed,  flyInStatus, flyInHeight, flyInColor, fallXSpeed;

var fireLockout, gameOverTicks;

var stack = [];
var gibs = [];

exports.loop = function(api) {

    if (!hasRun) {
        hasRun = true;

        //one time only start stuff
        //api.playWav('logon');


    }
    switch (gameStatus) {
        case 0:
            gameStart(api);

            break;
        case 1:
            gamePlay(api);
            break;
        case 2:
            gameOver(api);
            break;


    }


};

function gameStart(api) {


    level = 1;
    width = 9;

    towerTop = 0;
    towerHeight = 0;
    towerLeft = 7;

    scroll = 11;

    flyInX = 0.0-width;
    flyInY = 0.0;
    flyInSpeed = 0.1;
    flyInStatus = 1;       //0 - waiting   1 - flying in  2 - falling  3 - Landing
    flyInHeight = 2;

    flyInColor = {
        h: 0,
        s: 1,
        l: 1,
        r: 255,
        g: 0,
        b: 0
    };

    stack=[];
    stack.push({
        width: width,
        left: towerLeft,
        height: 1,
        color: { r:255, g:255, b:255}
    });

    gibs=[];

    //stop fire from being passed to this stage of the game
    if(api.buttons.fire === false) fireLockout = false;
    if(fireLockout) api.buttons.fire=false;



    api.blank(0,0,0);
    api.setColor(0,255,255);
    api.text('Rdy?',0,1);



    if(api.buttons.fire) {
        gameStatus=1;
        fireLockout=true;
    }






}

function gamePlay(api) {

    //playing game
    api.blank(0, 0, 0);


    //stop fire from being passed to this stage of the game
    if(api.buttons.fire === false) fireLockout = false;
    if(fireLockout) api.buttons.fire=false;



    //scroll tower/gibs if needed..
    if(scroll - towerHeight < 6) scroll++;



    // Draw tower
    animateTower(api);

    //draw gibs
    animateGibs(api);


    switch (flyInStatus) {
        case 0:

            break;
        case 1: //flying in...
            //move flyin
            flyInX+=flyInSpeed;

            //draw flyin
            api.setColor(flyInColor.r, flyInColor.g, flyInColor.b);
            api.fillBox(flyInX,flyInY,width,flyInHeight);

            if(api.buttons.fire) {
                fallXSpeed = flyInSpeed;
                flyInStatus++;

                api.playWav('sfx_movement_dooropen1');

            }

            break;
        case 2: //falling ...
            //move flyin
            //fallXSpeed*=0.9;
            flyInY+=gravity;
            flyInX+=fallXSpeed;


            //draw flyin
            api.setColor(flyInColor.r, flyInColor.g, flyInColor.b);
            api.fillBox(flyInX,flyInY,width,flyInHeight);

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
                api.playWav('sfx_exp_short_hard15');



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
                api.playWav('sfx_exp_short_hard15');

            } else {
                //bang on!

                //play sound
                api.playWav('sfx_sounds_impact1');

            }

            if(width < 1) {
                api.playWav('sfx_sound_shutdown2');
                gameOverTicks=0;
                level--;
                gameStatus++;

            }


            //draw flyin
            api.setColor(flyInColor.r, flyInColor.g, flyInColor.b);
            api.fillBox(flyInX,flyInY,width,flyInHeight);

            api.setColor(255, 255, 255,0.7);
            api.fillBox(flyInX,flyInY,width,flyInHeight);

            fireLockout = true;

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
                flyInSpeed+=0.005;
                flyInX=0-width;
            } else {
                flyInSpeed-=0.005;
                flyInX=api.pxlW;
            }

            flyInColor.h+=0.03;
            if (flyInColor > 1) flyInColor = 0;
            var rgb = api.hslToRgb(flyInColor.h,1,0.5);
            flyInColor.r=rgb[0];
            flyInColor.g=rgb[1];
            flyInColor.b=rgb[2];

            api.debug(flyInColor);

            flyInHeight=Math.ceil(Math.random() * Math.floor(3));


            api.debug('Level '+level+' complete.');
            level++;


            break;



    }

};

function gameOver(api) {

    //stop fire from being passed to this stage of the game
    if(api.buttons.fire === false) fireLockout = false;
    if(fireLockout) api.buttons.fire=false;



    gameOverTicks++;

    api.blank(0,0,0);
    animateTower(api);
    animateGibs(api);

    if(gameOverTicks > 120) {


        api.blank(0, 0, 0);
        api.setColor(0, 255, 255);
        var bounds = api.textBounds(level);
        api.text(level, 11-(bounds.w/2), 2);


        if (api.buttons.fire) {
            gameStatus = 0;
            fireLockout = true;
            api.playWav('sfx_sound_poweron');

        }
    }
};

function animateTower(api) {
    towerHeight = 0;
    for (var i=0; i<stack.length; i++) {
        towerHeight+= stack[i].height;

        api.setColor(stack[i].color.r, stack[i].color.g, stack[i].color.b);
        api.fillBox(stack[i].left, scroll-towerHeight, stack[i].width, stack[i].height);
    }

}

function animateGibs(api) {
    if(gibs.length && gibs[0].y > api.pxlH) gibs.shift();

    for (var i=0; i<gibs.length; i++) {

        api.setColor(gibs[i].r,gibs[i].g,gibs[i].b,gibs[i].a);
        api.setPixel(gibs[i].x, gibs[i].y+scroll);

        //movement
        gibs[i].x+=gibs[i].vX;
        gibs[i].y+=gibs[i].vY;
        //gravity
        gibs[i].vY+=gravity;
        //fade
        //gibs[i].a-=16;

    }
}

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

