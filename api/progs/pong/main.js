//config vars
const touchWidth = 2;
const paddleWidth = 5;
const aiPosErrorMargin = 2;
const aiSpeed = 0.6;

let players = 1;

//these are used to make the pixel pulse
let t = 0;
let forward = true;
let flashSpeed = 16;

//pixel location and speed
let x;
let y;
let vX;
let vY;

//have we had a bump?
let bump = 0;

//paddle positions
let leftPaddlePos;
let rightPaddlePos;



exports.setup = function(api) {
    api.fpsLimit = 60;

    leftPaddlePos = Math.floor(api.getScreenHeight()/2);
    rightPaddlePos = Math.floor(api.getScreenHeight()/2);

    resetBall(api);
};

exports.loop = function(api) {



    //if a button is pressed then exit
    if(api.getButtons().any) api.exit();

    //move the pixel by the current speed
    x += vX;
    y += vY;

    //if pixel at edges then reverse direction, play sound and set border yellow for 5 frames
    if(y >= api.getScreenHeight() - 2 || y < 1) {
        vY = 0 - vY;
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
    api.setDrawColor(0,0,0,1);
    api.fillBox(0, 1, api.getScreenWidth(), api.getScreenHeight()-2);

    //draw the pixel
    api.setDrawColor(0,t,255,0.9);
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
            } else if (touches[i].x >= api.getScreenWidth() - touchWidth && players === 2) {
                rightPaddlePos = touches[i].y;
            }
        }
    }

    // AI -  Super advanced!!! Be careful when making changes.
    if(players = 1) {
        let idealPos = Math.round(y);

        if(idealPos > rightPaddlePos + aiPosErrorMargin) {
            let distance = Math.abs(idealPos - rightPaddlePos + aiPosErrorMargin);

            // Move padel to the ball
            rightPaddlePos += Math.min(distance, aiSpeed)
        } else if(idealPos < rightPaddlePos + aiPosErrorMargin) {

            let distance = Math.abs(idealPos - rightPaddlePos + aiPosErrorMargin);

            // Move padel to the ball
            rightPaddlePos -= Math.min(distance, aiSpeed)
        }
    }

    //limit to valid psotions
    let minPaddlePos = Math.floor(paddleWidth/2)+1;
    let maxPaddlePos = api.getScreenHeight() - Math.floor(paddleWidth/2)-2;
    leftPaddlePos = Math.min(Math.max(leftPaddlePos, minPaddlePos), maxPaddlePos);
    rightPaddlePos = Math.min(Math.max(rightPaddlePos, minPaddlePos), maxPaddlePos);



    //draw paddles
    api.setDrawColor(0,128,0);
    api.fillBox(0,leftPaddlePos - Math.floor(paddleWidth/2),1, paddleWidth);
    api.fillBox(api.getScreenWidth()-1,rightPaddlePos - Math.floor(paddleWidth/2),1, paddleWidth);


    //check for paddle collision or out of bounds
    if(((Math.round(x) >= api.getScreenWidth()-1 || Math.round(x) < 1))  ) {
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
    x = api.getScreenWidth()/2;
    y = api.getScreenHeight()/2;
    vX = 0.3;
    if(Math.random() >= 0.5) vX = 0-vX;
    vY = Math.random()*0.6 - 0.3;

}