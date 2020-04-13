/*
Drop Game by Steven Tomlinson https://github.com/TmpR
 */

exports.setup = function(api) {
  // Code here get's executed once at program startup.
  api.debug('Starting game...');
  api.fpsLimit = 30;

};

var hasRun = false;
var gameStatus = 0;
var gravity = 0.5;

var rotate = 0;

var introStatus, introTicks;

var level,width, towerLeft ,scroll;

var gameOverTicks;

var players = [];
var stack = [];
var gibs = [];

let numPlayers = 2;

let scoreTwinkle = 0;
const pointTwinkleSpeed = 16;

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
    introStatus = 0;
    introTicks = 0;
    gameOverTicks = 0;

    players[0] = {
      score: 0,
      color: {r: 0, g: 255, b:255}
    };
    players[1] = {
      score: 0,
      color: {r: 255, g: 0, b:50}
    };

    spawnPoint(api,0);
    spawnPoint(api,1);

  }



  introTicks++;
  switch (introStatus) {
    case 0:
      api.blank(0,0,0);
      api.setColor(0,255,0);
      api.fillBox(api.pxlW/2,api.pxlH-6,1,5);
      api.fillBox(api.pxlW/2+1,api.pxlH-5,1,3);
      api.fillBox(api.pxlW/2+2,api.pxlH-4,1,1);



      const touches = api.getTouch();
      //play
      if(touches.length && touches[0].x < api.pxlW) {
        introStatus = 1;
      }

      //exit
      if(touches.length && touches[0].x > api.pxlW) {
        api.exit();
      }
      break;

    case 1:
      //explode screen
      //api.playWav('sfx_exp_short_hard15');
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

      gameStatus=1;
      api.clearInputs();


      gibs=[];
    }

}

function gamePlay(api) {
  //playing game

  //draw background
  api.setColor(players[0].color);
  api.fillBox(0,1,api.pxlW/2,api.pxlH-1);
  api.setColor(players[1].color);
  api.fillBox(api.pxlW/2,1,api.pxlW/2,api.pxlH);
  api.setColor(0,0,0, 0.9);
  api.fillBox(0,1,api.pxlW,api.pxlH);

  api.setColor(100,100,100);
  api.fillBox(0,0,api.pxlW,1);


  const touches = api.getTouch();

  //draw gibs
  animateGibs(api);

  let totalScore = 0;


  for(let i=0; i < players.length; i++) {

    //draw point
    api.setColor(players[i].color);
    api.setPixel(players[i].point.x, players[i].point.y);
    //draw twinkle
    api.setColor(255,255,255,0.2  );
    if(scoreTwinkle %pointTwinkleSpeed < pointTwinkleSpeed/4) api.setPixel(players[i].point.x, players[i].point.y);

    //check if point touched
    for(let j=0; j < touches.length; j++) {
      if(players[i].point.x === touches[j].x && players[i].point.y === touches[j].y) {
        players[i].score++;
        api.playWav('sfx_coin_single1');
        spawnPoint(api,i);
      }
    }

    //draw scores
    api.setColor(players[i].color);

    switch (i) {
      case 0:
        api.fillBox(0,0,players[i].score,1);
        //draw twinkle
        api.setColor(255,255,255,0.3);
        if(scoreTwinkle <= players[i].score) api.setPixel(scoreTwinkle,0);
        break;
      case 1:
        api.fillBox(api.pxlW-players[i].score,0,players[i].score,1);
        //draw twinkle
        api.setColor(255,255,255,0.3);
        if(scoreTwinkle <= players[i].score) api.setPixel(api.pxlW - scoreTwinkle,0);
        break;
    }




    //check for winner
    if(players[i].score >= 16) {
      api.clearInputs();
      gameStatus=2;
      api.playWav('sfx_sounds_powerup1');
    }



  }


  scoreTwinkle++;
  if(scoreTwinkle > 64) scoreTwinkle = 0;


}

function gameOver(api) {

  gameOverTicks++;

  if(gameOverTicks < 90) api.clearInputs();

  //work out the winner
  let score = 0;
  let winner;

  for(let i=0; i < players.length; i++){
    if(players[i].score > score) {
      score = players[i].score;
      winner = i;
    }
  }

  animateGibs(api);

  api.blank(players[winner].color.r,players[winner].color.g,players[winner].color.b);
  api.setColor(0, 0, 0);
  const bounds = api.textBounds('WIN');
  api.text('WIN', (api.pxlW-bounds.w)/2, (api.pxlH-bounds.h)/2);
  if (api.getTouch().length) {
      gameStatus = 0;
      hasRun = false;
      api.clearInputs();
  }

}


function animateGibs(api) {
  if(gibs.length && gibs[0].y+scroll > api.pxlH){
    gibs.shift();
  }
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
}

function spawnPoint(api,player) {

  players[player].point = {
    x: Math.floor(Math.random()*api.pxlW/2+api.pxlW/2*player),
    y: Math.floor(Math.random()*(api.pxlH-2)+2),

  }



}
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
}
