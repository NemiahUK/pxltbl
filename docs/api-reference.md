# API Reference

## API functions

There are two ways to use the api.

#### Method 1 - Using "progs" via index.js

This is the simplest way to get up and running. Pixel Table has a basic "operating system" - index.js. This creates
a menu allowing you to run all the scripts in the progs/ directory. As well as providing easy access to settings. It 
also inculdes the API and makes it avaiable to your scripts in a simple way.

If you use this method, you simply create your script as-per the hello world example and upload it to the progs folder. 
You don't need to restart the running node process, you just go back to the home screen menu and select your prog. The 
system will reload your script from the file system and run it.

You don't need to initialise the api, you just put your code inside the setup() and loop() functions in your script.

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
        if(api.buttons.topLeft) api.exit();
        
    };



Eventually you will also be able to create and upload progs via the web interface.

#### Method 2 - Creating your own script and including the API

If you don't want to use the menu system and have access to other progs etc you can just include the API. This way only
your script will run and you have more control over the system.

To initialise the API...

### start(options)

Initialises the API and returns a reference to it. The minimum you need is to set an FPS limit and callback function e.g.

    api = api.start({
        callbackLoop: myLoop,
        fpsLimit: 30
    });

The function myLoop() will then be called 30 times a second.

The options are...

 **callbackLoop** (function) *required - The function to call every frame
 
 **fpsLimit** (number) *recomended - The maximum FPS allowed. You can omit this or set to 0 but it's not advised, a 
 RasPi 3 runs around 100fps but without setting a limit animations will not be consistent unless you use time-based
 maths to animate things.
 
 **consoleData** (boolean) default: true - If true then show stats in console (updated every 500ms).
 
 


## Drawing functions

For most draw functions you must first set the colour using setColor(), whatever colour is set will persist until 
setColor() is called again.

Pixel 0,0 is the top left pixel with the co-ordinates increasing in value as you move right or down.

The entire display can be rotated in 90deg increments using rotate() this will change the physical position of pixel 
0,0 accordingly.


### blank(r,g,b)
Fills the screen with the selected colour.

---

### setColor(r,g,b,[a])
Sets the drawing colour. 

`r,g,b` are values 0-255. `a` is optional, in the range of 0-1, default 1.0

---

### setColor(string)  *not yet implemented*
Sets the drawing colour.

String must be HTML/CSS Hex colour code. e.g. `#DECAFF`

---

### setColor(array)
Sets the drawing colour.

Expects an array of 3 or 4 elements...

    [0] = r    0-255
    [1] = g    0-255
    [2] = b    0-255
    [3] = a    0.0-1.0

---

### setColor(object)
Sets the drawing colour.

Possible object properties are...

RGB format

    {
        r : 0-255
        g : 0-255
        b : 0-255
        a : 0.0-1.0    //optional - default 1.0
    }
HSL format

    {
        h : 0-360
        s : 0-255
        l : 0-255
        a : 0.0-1.0    //optional - default 1.0
    }
HSV format

    {
        h : 0-360
        s : 0-255
        v : 0-255
        a : 0.0-1.0    //optional - default 1.0
    }

---

### setColorHsl(h,s,l,a)
Sets the drawing colour. 

`h` is 0-360, `s,l` are 0-255. `a` is optional, in the range of 0-1, default 1.0

---

### setColorHsv(h,s,v,a)
Sets the drawing colour. 

`h` is 0-360, `s,v` are 0-255. `a` is optional, in the range of 0-1, default 1.0

---

### fillBox(x,y,w,y)

Draws a filled box at location `x,y` of width `w` and height `h`

---

### text(text,x,y)

Draws `text` starting with the upper left corner of the first character at location `x,y`.

Returns an object containing the width and height of the bounding box containing the text.

    {
        w : width,
        h : height
    }

---

### textBounds(text)

Returns an object containing the width and height of the bounding box containing the text.

    {
        w : width,
        h : height
    }

---

## Input functions

Pixel table uses 8 control buttons at the corners of the table. These are named by the side they are on first 
followed by where they are on that side. So topLeft is on the TOP side at the LEFT and leftTop is on the LEFT side
at the TOP.

The top left button is where pixel 0,0 is located, it is not tied to a physical button. If the display is rotated (rotate()) then the names of the buttons will change
to match the device orientation, so topLeft will now be a different physical button, but it will still be where pixel 0,0 is.

### clearInputs()

Sets all buttons to false and clears all touch data.

---

### buttons

This variable is an object containing all the button states (true or false).

    {
        topLeft: true/false,
        leftTop: true/false,
        topRight: true/false,
        rightTop: true/false,
        rightBottom: true/false,
        bottomRight: true/false,
        bottomLeft: true/false,
        leftBottom: true/false
    };
    
---



## Helper functions


#### rgbToHsv(r,g,b)

---

#### hsvToRgb(h,s,v)

---

#### rgbToHsl(r,g,b)

---

#### hslToRgb(h,s,l)

To be continued....