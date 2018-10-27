/*
Drop Game by Steven Tomlinson https://github.com/phyushin
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

var introStatus, introTicks;

var level,width, towerTop, towerHeight, towerLeft ,scroll;
var flyInX, flyInY, flyInSpeed,  flyInStatus, flyInHeight, flyInColor, fallXSpeed;

var fireLockout, gameOverTicks;

var stack = [];
var gibs = [];

exports.loop = function(api) {

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
    if (!hasRun) {
        hasRun = true;

        //reset game vars
        introStatus = 0;
        introTicks = 0;
        level = 1;
        width = 9;

        towerTop = 0;
        towerHeight = 0;
        towerLeft = 7;

        scroll = 0;

        flyInX = 0.0-width;
        flyInY = 0.0;
        flyInSpeed = 0.1;
        flyInStatus = 1;       //0 - waiting   1 - flying in  2 - falling  3 - Landing
        flyInHeight = 2;

        flyInColor = {
            h: 0,
            s: 128,
            l: 255,
            r: 255,
            g: 0,
            b: 0
        };

        stack=[];
        stack.push({
            width: width,
            left: towerLeft,
            height: 1,
            color: { r:128, g:128, b:128}
        });

        gibs=[];
    }

    //stop fire from being passed to this stage of the game
    if(api.buttons.fire === false) fireLockout = false;
    if(fireLockout) api.buttons.fire=false;

    introTicks++;

    switch (introStatus) {
        case 0:
            api.blank(0,0,0);
            api.setColor(0,255,255);
            api.text('Rdy?',0,1);
            if(api.buttons.fire) introStatus = 1;
            break;
        case 1:
            //explode screen
            api.playWav('sfx_exp_short_hard15');
            screenToGibs(api);
            introStatus++;
            introTicks=0;
            break;
        case 2:
            api.blank(0,0,0);
            animateGibs(api);
            if(introTicks == 60) {
                gibs = [];
                introStatus++;
            }
            break;
        case 3:
            scroll = 11;
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
            api.setColor(flyInColor);
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
            api.setColor(flyInColor);
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
            api.setColor(flyInColor);
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

            flyInColor.h+=10;
            if (flyInColor.h > 360) flyInColor = 0;
            var rgb = api.hslToRgb(flyInColor.h,255,128);
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
        api.setColor(flyInColor);
        var bounds = api.textBounds(level);
        api.text(level, 11-(bounds.w/2), 2);

        if (api.buttons.fire) {
            gameStatus = 0;
            hasRun = false;
            fireLockout = true;
            api.playWav('sfx_sound_poweron');
        }
    }
};

function animateTower(api) {
    towerHeight = 0;
    for (var i=0; i<stack.length; i++) {
        towerHeight+= stack[i].height;
        api.setColor(stack[i].color);
        api.fillBox(stack[i].left, scroll-towerHeight, stack[i].width, stack[i].height);
    }

}

function animateGibs(api) {
    if(gibs.length && gibs[0].y+scroll > api.pxlH) gibs.shift();
    for (var i=0; i<gibs.length; i++) {
        api.setColor(gibs[i]);
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

function screenToGibs(api) {
    for (var y = 0; y < api.pxlH; y++) {
        for (var x = 0; x < api.pxlW; x++) {
            var i = y * api.pxlW + x;
            var r = api.buffer[i*3];
            var g = api.buffer[i*3 + 1];
            var b = api.buffer[i*3 + 2];
            spawnGib(x,y,Math.round(Math.random()),r,g,b);
        }
    }
};

function spawnGib(x,y,left,r,g,b) {
    var vX = -0.8 + (Math.random()*0.5);
    var vY =  -2 + (Math.random()*1);

    if(!left) {
        vX*= -1;
    }

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