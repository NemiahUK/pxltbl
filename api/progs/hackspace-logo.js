// Hello world example prog.


exports.setup = function(api) {
    // Code here get's executed once at program startup.

    // Blank the screen
    api.blank(0, 0, 0);
};

exports.loop = function(api) {

    // Set the drawing colour.
    api.blank(0,0,0);
    api.setColor(255, 0, 0);
    api.fillBox(9,3,5,5);
    api.setColor(255,255,255);
    api.fillBox(10,4,1,3);
    api.fillBox(10,5,3,1);
    api.fillBox(12,4,1,3);

    // If fire button pressed then exit back to home screen.
    if(api.buttons.any) api.exit();

};

