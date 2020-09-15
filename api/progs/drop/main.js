/*
Drop Game by Steven Tomlinson https://github.com/TmpR
 */

exports.setup = function(api) {
  // Code here get's executed once at program startup.
  api.debug('Starting game...');
  api.fpsLimit = 60;
  api.playWav('sfx_sound_poweron');
};

let hasRun = false;
let gameStatus = 0;
const gravity = 0.5;

let introStatus = 0;
let introTicks = 0;

let level = 0;
let width = 0;
let towerTop = 0;
let towerHeight = 0;
let towerLeft = 0;
let scroll = 0;

let flyInX = 0;
let flyInY = 0;
let flyInSpeed = 0;
let flyInStatus = 0;
let flyInHeight = 0;
let flyInColor = 0;
let fallXSpeed = 0;

let gameOverTicks = 0;

let stack = [];
let gibs = [];

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
    default:
      break;
  }
};

function gameStart(api) {

  if (!hasRun) {
    hasRun = true;
    introStatus = 0;
    introTicks = 0;
    level = 1;
    width = 9;
  }



  introTicks++;
  switch (introStatus) {
    case 0:
      api.blank(0,0,0);
      api.setDrawColor(0,255,255);
      api.text('Rdy?',0,1);

      const touches = api.getTouch();
      // Play
      if(touches.length && touches[0].x < api.getScreenWidth()) {
        introStatus = 1;
      }

      // Exit
      if(touches.length && touches[0].x > api.getScreenWidth()) {
        api.exit();
      }

      break;

    case 1:
      // Explode screen
      api.playWav('sfx_exp_short_hard15');
      screenToGibs(api);
      introStatus++;
      introTicks=0;

      break;

    case 2:
      api.blank(0,0,0);
      animateGibs(api);
      if(introTicks === 60) {
        gibs = [];
        introStatus++;
      }

      break;

    case 3:
      gameStatus = 1;
      api.clearInputs();

      towerTop = 0;
      towerHeight = 0;
      towerLeft = Math.floor((api.getScreenWidth() - width)/2);

      scroll = api.getScreenHeight();

      flyInHeight = 2;
      flyInX = 0.0-width;
      flyInY = api.getScreenHeight()-(4+flyInHeight);
      flyInSpeed = 0.1;
      flyInStatus = 1;       //0 - waiting   1 - flying in  2 - falling  3 - Landing

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

      break;

    default:
      break;
  }

}

function gamePlay(api) {
  //playing game
  api.blank(0, 0, 0);


  //scroll tower/gibs if needed..
  if(scroll - towerHeight < 8){
    scroll++;
  }
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
      api.setDrawColor(flyInColor.r, flyInColor.g, flyInColor.b);
      api.fillBox(flyInX,flyInY,width,flyInHeight);
      if((api.getTouch().length)) {
        fallXSpeed = flyInSpeed;
        flyInStatus++;
        api.playWav('sfx_movement_dooropen1');
      }


      break;

    case 2: // Falling ...
      // Move flyin
      // FallXSpeed*=0.9;
      flyInY+=gravity;
      flyInX+=fallXSpeed;
      // Draw flyin
      api.setDrawColor(flyInColor.r, flyInColor.g, flyInColor.b);
      api.fillBox(flyInX,flyInY,width,flyInHeight);
      if(flyInY+flyInHeight >= scroll-towerHeight){
        flyInStatus++;
      }
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
        for (let i = towerLeft + width; i < flyInX+width; i++) {
          for (let j = 0; j < flyInHeight; j++) {
            spawnGib(i, flyInY + j - scroll, false, flyInColor.r, flyInColor.g, flyInColor.b);
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
      api.setDrawColor(flyInColor.r, flyInColor.g, flyInColor.b);
      api.fillBox(flyInX,flyInY,width,flyInHeight);
      api.setDrawColor(255, 255, 255,0.7);
      api.fillBox(flyInX,flyInY,width,flyInHeight);

      api.clearInputs();
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
      towerHeight+=flyInHeight;

      flyInStatus=1;
      flyInSpeed*= -1;
      if(flyInSpeed > 0) {
        flyInSpeed+=0.005;
        flyInX=0-width;
      } else {
        flyInSpeed-=0.005;
        flyInX=api.getScreenWidth();
      }

      flyInColor.h += 10;
      if (flyInColor.h > 360) {
        flyInColor = 0;
      }

      const rgb = api.hslToRgb(flyInColor.h, 255, 128);
      flyInColor.r = rgb[0];
      flyInColor.g = rgb[1];
      flyInColor.b = rgb[2];
      api.debug(flyInColor);
      flyInHeight=Math.ceil(Math.random() * Math.floor(3));
      flyInY=scroll - (towerHeight + 3 + flyInHeight);

      api.debug('Level ' + level + ' complete.');
      api.debug('Tower Height: ' + towerHeight);
      api.debug(stack);

      level++;
      break;

  }
}

function gameOver(api) {


  gameOverTicks++;
  api.blank(0,0,0);
  animateTower(api);
  animateGibs(api);
  if(gameOverTicks > 120) {
    api.blank(0, 0, 0);
    api.setDrawColor(flyInColor.r, flyInColor.g, flyInColor.b);
    const bounds = api.textBounds(level);
    api.text(level, (api.getScreenWidth() - bounds.w) / 2, (api.getScreenHeight() - bounds.h)/2);
    if (api.getTouch().length) {
      gameStatus = 0;
      hasRun = false;
      api.clearInputs();
      api.playWav('sfx_sound_poweron');
    }
  }
}

function animateTower(api) {
  towerHeight = 0;
  for (let i = 0; i < stack.length; i++) {
    towerHeight += stack[i].height;
    api.setDrawColor(stack[i].color);
    api.fillBox(stack[i].left, scroll-towerHeight, stack[i].width, stack[i].height);
  }
}

function animateGibs(api) {
  if(gibs.length && gibs[0].y+scroll > api.getScreenHeight()){
    gibs.shift();
  }
  for (let i = 0; i < gibs.length; i++) {
    api.setDrawColor(gibs[i].r, gibs[i].g, gibs[i].b);
    api.setPixel(gibs[i].x, gibs[i].y+scroll);
    // Movement
    gibs[i].x += gibs[i].vX;
    gibs[i].y += gibs[i].vY;
    // Gravity
    gibs[i].vY += gravity;
    // Fade
    // gibs[i].a-=16;
  }
}

function screenToGibs(api) {
  for (let y = 0; y < api.getScreenHeight(); y++) {
    for (let x = 0; x < api.getScreenWidth(); x++) {
      const i = y * api.getScreenWidth() + x;
      const r = api.getBuffer()[i * 3];
      const g = api.getBuffer()[i * 3 + 1];
      const b = api.getBuffer()[i * 3 + 2];
      spawnGib(x,y,Math.round(Math.random()), r, g, b);
    }
  }
}

function spawnGib(x, y, left, r, g, b) {
  let vX = -0.8 + (Math.random()*0.5);
  const vY =  -2 + (Math.random());
  if(!left) {
    vX *= -1;
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
}
