# Pixel Table - Alpha

The API is here. All you need to start coding is a RasPi. The API comes with a browser-based Emulator so you don’t need to build the table just yet.

## BIG plans

It's early days yet, but we have lots of great ideas. Soon you won't need a RasPi to develop and test your own "progs", 
everything will eventually be done through a simple browser-based IDE/Emulator that can run anywhere.  We'll be adding 
loads of documentation to get you started.

## Hardware guide coming soon

We'll also be releasing a full guide on how to build your own Pixel Table using a RasPi + Arduino + NeoPixels. It's fairly straight
forward, and once built, you can use this API to make programming your table super-easy!


## Hello World

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
