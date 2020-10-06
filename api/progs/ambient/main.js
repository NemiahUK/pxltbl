class Fairy {
  x = 0;
  y = 0;
  vecX = 0;
  vecY = 0;
  colorR = 0;
  colorG = 0;
  colorB = 0;
  speed = 0;

  constructor(x, y, r = 0, g = 255, b = 255) {
    this.x = x;
    this.y = y;
    this.colorR = r;
    this.colorG = g;
    this.colorB = b;

    this.vecX = 1 - (Math.random() * 2);
    this.vecY = 1 - (Math.random() * 2);

    // Normalize the vector
    const hypot = Math.sqrt((this.vecX * this.vecX) + (this.vecY * this.vecY));
    this.vecX /= hypot;
    this.vecY /= hypot;

    this.speed = 0.1;
  }

  // Getters & setters
  get x() {
    return this.x;
  }

  set x(val) {
    this.x = val;
  }

  get y() {
    return this.y;
  }

  set y(val) {
    this.y = val;
  }

  get r() {
    return this.colorR;
  }

  set r(val) {
    this.colorR = val;
  }

  get g() {
    return this.colorG;
  }

  set g(val) {
    this.colorG = val;
  }

  get b() {
    return this.colorB;
  }

  set b(val) {
    this.colorB = val;
  }

  get color() {
    return {
      'r' : this.colorR,
      'g' : this.colorG,
      'b' : this.colorB
    }
  }

  set color(colorObj) {
    this.colorR = colorObj.r
    this.colorG = colorObj.g;
    this.colorB = colorObj.b;
  }



  draw(api) {
    api.setDrawColor(this.colorR, this.colorG, this.colorB);
    api.setPixel(Math.floor(this.x), Math.floor(this.y));
  }

  update(api) {
    this.x += this.vecX * this.speed;
    this.y += this.vecY * this.speed;

    // Make sure not out of bounds
    if (this.x < 0 || this.x >= api.getScreenWidth()) {
      this.vecX *= -1;
    }

    if (this.y < 0 || this.y >= api.getScreenHeight()) {
      this.vecY *= -1;
    }
  }

  colorChange() {
    const colNumber = Math.floor(Math.random() * fairyColors.length)


    this.colorR = fairyColors[colNumber].r;
    this.colorG = fairyColors[colNumber].g;
    this.colorB = fairyColors[colNumber].b;

  }
}

let fairies = [];       // We need this to store the location of fairies so we can get it every frame.
const maxFairies = 10;
const minMillisToSpawn = 3000;
const maxMillisToSpawn = 15000;
let spawnTime = 0;
const fairyColors = [
  { 'r' : 255,  'g' : 0,    'b' : 0   },
  { 'r' : 255,  'g' : 0,    'b' : 255 },
  { 'r' : 255,  'g' : 255,  'b' : 0   },
  { 'r' : 0,    'g' : 255,  'b' : 0   },
  { 'r' : 0,    'g' : 255,  'b' : 255 },
  { 'r' : 0,    'g' : 0,    'b' : 255 }
];

exports.setup = function(api) {
  api.blank(0, 0, 0);
  api.setFpsLimit(30);

  spawnTime = api.getRunTime() + Math.max(minMillisToSpawn, Math.floor(Math.random() * maxMillisToSpawn));
};


exports.loop = function(api) {
  const w = api.getScreenWidth();
  const h = api.getScreenHeight();

  api.setDrawColor(0,0,0,0.05);
  api.fillBox(0,0,w,h);


  // Check if fairy should spawn:
  if(fairies.length < maxFairies) {
    // Enough room, check if time to spawn.
    if (api.getRunTime() > spawnTime) {
      // add a fairies to the list
      const xPos = Math.floor(Math.random() * w);
      const yPos = Math.floor(Math.random() * h);

      const colNumber = Math.floor(Math.random() * fairyColors.length)

      fairies.push(new Fairy(xPos, yPos, fairyColors[colNumber].r, fairyColors[colNumber].g, fairyColors[colNumber].b))
      api.playWav('sfx_coin_cluster3');

      // Need new spawn time:
      spawnTime = api.getRunTime() + Math.max(minMillisToSpawn, (Math.random() * maxMillisToSpawn));
    }
  }

  // Draw "Fairies"------------------------------------------------------------
  for (let fairy of fairies) {
    fairy.update(api)
    fairy.draw(api);
  }



  // Touch input
  let touches = api.getTouch(true);
  if(touches.length > 0) {
    for (let i = 0; i < touches.length; i++) {
      for (let fairy of fairies) {
        if(touches[i].x === Math.floor(fairy.x) && touches[i].y === Math.floor(fairy.y)) {
          const currentR = fairy.r;
          const currentG = fairy.g;
          const currentB = fairy.b;


          fairy.colorChange()

          // If we end up "changing" to the same color, destroy the fairy. Muwha ha haaaa
          if (currentR === fairy.r && currentG === fairy.g && currentB === fairy.b) {
            const index = fairies.indexOf(fairy);

            if (index !== -1) {
              fairies.splice(index, 1);
              api.playWav('sfx_deathscream_alien3');
            }
          } else {
            api.playWav('sfx_coin_cluster9');
          }

          continue;
        }

        api.setDrawColor(255,0,255);
        api.setPixel(touches[i].x, touches[i].y);
      }
    }
  }


  // Button input -------------------------------------------------------------
  const buttons = api.getButtons();

  api.setDrawColor(0,255,0);
  if(buttons.leftTop)   api.setPixel(0,1);
  if(buttons.topLeft)   api.setPixel(1,0);
  if(buttons.topRight)   api.setPixel(w-2,0);
  if(buttons.rightTop)   api.setPixel(w-1,1);
  if(buttons.rightBottom)   api.setPixel(w-1,h-2);
  if(buttons.bottomRight)   api.setPixel(w-2,h-1);
  if(buttons.bottomLeft)   api.setPixel(1,h-1);
  if(buttons.leftBottom)   api.setPixel(0,h-2);


  // Glow effect --------------------------------------------------------------
  for(let x=0; x < w; x++) {
    for(let y=0; y < h; y++) {
      const pixel = api.getPixel(x,y);
      if(pixel.r > 100 || pixel.b > 100 || pixel.g > 100) {
        api.setDrawColor(pixel.r,pixel.g,pixel.b,0.3);
        api.fillBox(x-1,y-1,3,3);
        //api.setDrawColor(0,0,0,0.9);
        //api.setPixel(x,y);
      }
    }
  }


  // Re-draw touches/buttons/fairies as glow can overwrite them.
  api.setDrawColor(255,0,255);
  if(touches.length > 0) {
    for (let i = 0; i < touches.length; i++) {
      api.setPixel(touches[i].x, touches[i].y);
    }
  }

  api.setDrawColor(0,255,0);
  if(buttons.leftTop)   api.setPixel(0,1);
  if(buttons.topLeft)   api.setPixel(1,0);
  if(buttons.topRight)   api.setPixel(w-2,0);
  if(buttons.rightTop)   api.setPixel(w-1,1);
  if(buttons.rightBottom)   api.setPixel(w-1,h-2);
  if(buttons.bottomRight)   api.setPixel(w-2,h-1);
  if(buttons.bottomLeft)   api.setPixel(1,h-1);
  if(buttons.leftBottom)   api.setPixel(0,h-2);

  for (let fairy of fairies) {
    fairy.draw(api);
  }
};