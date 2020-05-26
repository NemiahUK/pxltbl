//config vars
const touchWidth = 2;
const paddleWidth = 5;

//these are used to make the pixel pulse
var t = 0;
var forward = true;
var flashSpeed = 16;

//pixel location and speed
var x;
var y;
var vX;
var vY;

//have we had a bump?
var bump = 0;

//paddle positions
let leftPaddlePos;
let rightPaddlePos;



exports.setup = function(api) {
    api.fpsLimit = 60;

    leftPaddlePos = Math.floor(api.pxlH/2);
    rightPaddlePos = Math.floor(api.pxlH/2);

    resetBall(api);
};

exports.loop = function(api) {



    //if a button is pressed then exit
    if(api.buttons.any) api.exit();

    //move the pixel by the current speed
    x+=vX;
    y+=vY;

    //if pixel at edges then reverse direction, play sound and set border yellow for 5 frames
    if(y >= api.pxlH-2 || y < 1) {
        vY = 0-vY;
        bump = 5;
        api.playWav('sfx_sounds_Blip7');
    }

    //if there has been an impact then flash border yellow
    if(bump) {
        api.blank(100,100,0);
        bump--;
    } else {
        api.blank(100,0,0);
    }

    //draw the black playing area
    api.setColor(0,0,0,1);
    api.fillBox(0, 1, api.pxlW, api.pxlH-2);

    //draw the pixel
    api.setColor(0,t,255,0.9);
    api.setPixel(Math.round(x),Math.round(y));

    //update the pulsating colour
    if(forward) {
        t+=flashSpeed;
    } else {
        t-=flashSpeed;
    }
    if (t > 255 - flashSpeed) forward = false;
    if (t < flashSpeed) forward = true;



    //get touch - position paddles
    let touches = api.getTouch();
    if(touches.length > 0) {
        for (let i = 0; i < touches.length; i++) {
            if(touches[i].x < touchWidth) {
                leftPaddlePos = touches[i].y;
            } else if (touches[i].x >= api.pxlW - touchWidth) {
                rightPaddlePos = touches[i].y;
            }

        }
    }

    //limit to valid psotions
    let minPaddlePos = Math.floor(paddleWidth/2)+1;
    let maxPaddlePos = api.pxlH - Math.floor(paddleWidth/2)-2;
    leftPaddlePos = Math.min(Math.max(leftPaddlePos, minPaddlePos), maxPaddlePos);
    rightPaddlePos = Math.min(Math.max(rightPaddlePos, minPaddlePos), maxPaddlePos);



    //draw paddles
    api.setColor(0,128,0);
    api.fillBox(0,leftPaddlePos - Math.floor(paddleWidth/2),1, paddleWidth);
    api.fillBox(api.pxlW-1,rightPaddlePos - Math.floor(paddleWidth/2),1, paddleWidth);


    //check for paddle collision or out of bounds
    if(((Math.round(x) >= api.pxlW-1 || Math.round(x) < 1))  ) {
        const obPixel = api.getPixel(x,y);
        if(obPixel.b === 0) {
            vX = 0 - vX;
            api.playWav('sfx_sounds_Blip9');
            //TODO - add pulse to paddle, calc paddle velocity and apply to ball
            //for now randomise direction slightly
            vY+= Math.random()*0.2-0.1;
            vX = vX*1.05;
        } else {
            //point lost
            resetBall(api);
            api.playWav('sfx_exp_medium1');
        }
    }


};


function resetBall(api) {
    x = api.pxlW/2;
    y = api.pxlH/2;
    vX = 0.3;
    if(Math.random() >= 0.5) vX = 0-vX;
    vY = Math.random()*0.6 - 0.3;

}