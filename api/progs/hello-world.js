

// Hello world example prog.



// Put variables here that you need to persist between loops.
var message = 'Hi =]';


exports.setup = function(api) {
    // Code here get's executed once at program startup.

    // Blank the screen
    api.blank(0, 0, 0);
};

exports.loop = function(api) {

    // Set the drawing colour.
    api.setColor(0, 255, 0);

    // Print some text.
    api.text(message, 1,2);

    // If fire button pressed then exit back to home screen.
    if(api.buttons.fire) api.exit();


};

