// Hackspace logo Paul Williams https://github.com/phyushin.
exports.setup = function(api) {
  api.blank(0, 0, 0);
};

exports.loop = function(api) {
  api.blank(0,0,0);
  api.setColor(255, 0, 0);
//draw a red box
  api.fillBox(9,3,5,5);
//draw a white H
  api.setColor(255,255,255);
  api.fillBox(10,4,1,3);
  api.fillBox(10,5,3,1);
  api.fillBox(12,4,1,3);


  // If fire button pressed then exit back to home screen.
  if(api.buttons.any) {
    api.exit();
  }
};