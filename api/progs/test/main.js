// Hackspace logo Paul Williams https://github.com/phyushin.
exports.setup = function(api) {
  api.blank(0, 0, 0);
  api.setFpsLimit(0);
};

exports.loop = function(api) {

  const buttons = api.getButtons();
  const w = api.getScreenWidth();
  const h = api.getScreenHeight();
  const fps = api.getFps();

  api.setDrawColor(0,0,0,0.05);
  api.fillBox(0,0,w,h);
  api.setDrawColor(255,0,255);


  let touches = api.getTouch(true);
  if(touches.length > 0) {
    for (let i = 0; i < touches.length; i++) {
      api.setPixel(touches[i].x, touches[i].y);
    }
  }

  for(let x=0; x < w; x++) {
    for(let y=0; y < h; y++) {
      const pixel = api.getPixel(x,y);
      if(pixel.b > 100 && pixel.b < 256 && pixel.g === 0) {
        api.setDrawColor(pixel.r,pixel.g,pixel.b,0.3);
        api.fillBox(x-1,y-1,3,3);
        api.setDrawColor(0,0,0,0.9);
        //api.setPixel(x,y);
      }
    }
  }

  api.setDrawColor(255,0,255);
  if(touches.length > 0) {
    for (let i = 0; i < touches.length; i++) {
      api.setPixel(touches[i].x, touches[i].y);
    }
  }

  api.setFont('small-numbers');
  const bounds = api.textBounds(fps);
  api.setDrawColor(0,255,255);
  api.text(fps,w/2 - bounds.w/2,h/2 - bounds.h/2,'outline');
  api.setDrawColor(0,0,0);
  api.text(fps,w/2 - bounds.w/2,h/2 - bounds.h/2);


  api.setDrawColor(0,0,0);
  api.setPixel(0,1);
  api.setPixel(1,0);
  api.setPixel(w-2,0);
  api.setPixel(w-1,1);
  api.setPixel(w-1,h-2);
  api.setPixel(w-2,h-1);
  api.setPixel(1,h-1);
  api.setPixel(0,h-2);

  api.setDrawColor(0,255,0);
  if(buttons.leftTop)   api.setPixel(0,1);
  if(buttons.topLeft)   api.setPixel(1,0);
  if(buttons.topRight)   api.setPixel(w-2,0);
  if(buttons.rightTop)   api.setPixel(w-1,1);
  if(buttons.rightBottom)   api.setPixel(w-1,h-2);
  if(buttons.bottomRight)   api.setPixel(w-2,h-1);
  if(buttons.bottomLeft)   api.setPixel(1,h-1);
  if(buttons.leftBottom)   api.setPixel(0,h-2);

};