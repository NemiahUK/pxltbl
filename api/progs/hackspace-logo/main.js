// Hackspace logo Paul Williams https://github.com/phyushin.
exports.setup = function(api) {
  api.blank(0, 0, 0);
};

exports.loop = function(api) {
  api.blank(0,0,0);
  api.setDrawColor(255, 0, 0);
//draw a red box
  api.fillBox(9,3,5,5);
//draw a white H
  api.setDrawColor(255,255,255);
  api.fillBox(10,4,1,3);
  api.fillBox(10,5,3,1);
  api.fillBox(12,4,1,3);

  let touches = api.getTouch(true);
  if(touches.length > 0) {
    for (let i = 0; i < touches.length; i++) {
      api.setPixel(touches[i].x, touches[i].y);
    }
  }

  // If fire button pressed then exit back to home screen.
  if(api.getButtons().any) {
    api.exit();
  }
};