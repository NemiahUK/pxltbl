/**
 * PxlTbl API
 */



/*-----------------------------------------------------------------------------
 * Dependencies
 *---------------------------------------------------------------------------*/

const pkg = require("./package.json")                       // Including our `package.json` file so we can access the data
const config = require("./config.json")                     // Grab the config file so we can access the data

const fs = require('fs');                                   // FileSystem included with Node.js
const path = require('path');                               // Gets the path of a file or directory.
const http = require('http');                               // HTTP tools

const log = require('fancy-log');                           // Better debug messaging a support for colors
const c = require('ansi-colors');                           // Easily switch between different ANSI colors, great for console logging.

/**
 * This function is used to set up a singleton instance of our API class.
 *
 * @type {{setup: (function(*=): API)}}
 */
const pxlTbl = ( function() {
    /* --- Data --- */

    let _instance;                                          // Our instance of the API. To avoid conflicts and memory issues, we make it impossible to make more than one API at a time. If an instance of API and been `setup()`, then it's referance will be here.

    /**
     * The PxlTbl API. Using an instance of this class, you and control and access the data of a PxlTbl in your code.
     */
    class API {
        /* --- Data --- */
        // TODO: Grab defaults from a config file?

        /* --- Constants --- */

        // TODO: Find other values that should be constant and add here?
        // TODO: Constant inside a `constants` object and freeze it to make values read only.

        //defined - touch panel params TODO: Should be set by driver/config file
        #touchMaxX = 32767;                                 // int16 ???
        #touchMaxY = 32767;                                 // int16 ???
        #touchTlPixelX = 903;                               // X value from the touch panel of the top left corner of the top left pixel
        #touchTlPixelY = 1713;                              // Y value from the touch panel of the top left corner of the top left pixel
        #touchBrPixelX = 31652;                             // X value from the touch panel of the bottom right corner of the bottom pixel
        #touchBrPixelY = 31710;                             // Y value from the touch panel of the bottom right corner of the bottom pixel


        #isRasPi = false;                                   // Is true when the API is running on a physical PxlTbl, false when using the web emulator
        #frameTime = 0;                                     // The frame time of the last frame rendered
        #millis = 0;                                        // Number of ms since start
        #frames = 0;                                        // Number of frames rendered
        #fps = 0;                                           // Current frames per second


        #colorR = 255;                                      // Color red channel
        #colorG = 255;                                      // Color green channel
        #colorB = 255;                                      // Color blue channel
        #colorA = 1;                                        // Color alpha channel (transparency)
        #goHome = false;                                    // Used to signal intent to return to main menu
        #screenSaverDisplayed = false;                      // Is the screensaver being displayed
        #idleTimeLimit = 1000 * 60 * 5;                     // Amount of time in milliseconds until a screensaver is displayed
        #orientation = 0;
        #brightness = 200;                                  // Brightness setting for the screen
        #fontArray = [];                                    // Holds the font that is used when calling `text()` and similar methods.
        #whiteBalance = {
            r: 1.0,
            g: 0.9,
            b: 0.5
        };                                                  // White balance setting for the screen.

        #serial = null;                                     // ???
        #serialEnabled = false;                             // ???
        #baud = 0;                                          // ???
        #serialDevices = [];                                // ???
        #serialPath = '';                                   // ???
        #buffer = null;                                     // Add empty buffer for future use.
        #frameStart = Buffer.from([0x1, 0x2]);              // ???
        #gotParams = false;                                 // ???
        #paramTries = 0;                                    // ???

        #startTime = null;                                  // ???
        #lastLoopTime = null;                               // ???
        #lastStatsTime = null;                              // ???
        #lastInputTime = null;

        #webServer = '';                                    // ???
        #webIo = '';                                        // ???
        #webRoot = './web';                                 // ???
        #webClients = 0;                                    // ???

        //HID device
        #hidEnabled = false;
        #touchPanel = null;                                 // The touch panel device reference
        #hidPath = '';                                      // TODO I think this needs removing - Ste
        #touchParams = {};


        /* --- Options --- */

        // These are the defaults, overridden by the settings object passed into `pxlTbl.setup()`.

        #debugging = false;                                 // When true, the API will output TODO: should we grab a default value from an environment/config file?
        #consoleDisplay = false;                            // When true, a graphical representation of the PxlTbl data is displayed in the console window.
        #fpsLimit = 30;                                     // Limit the frames per second so we won't over work the hardware rendering useless frame. Good values would be 30 or 60
        #cbLoop = null;                                     // This is a place holder for the user's main loop. Users will pass a loop function into the API before run time and it can be called though this variable.
        #emulationOnly = false;                             // ???
        #screenSaverDelay = 10000;                          // Time in ms before screensaver starts

        // TODO: The following should be gotten from the firmware or overridden for no-pi emulation

        #originalPxlW = 0;                                  // ???
        #originalPxlH = 0;                                  // ???

        #numLeds = 0;                                       // This could be more than the size of the screen as it includes button LEDs etc.
        // TODO: Delete? #stripSerpantine = false;                           // ???
        // TODO: Delete? #stripStart = 'TL';                                 // TODO not implemented yet can be TL, TR, BL, BR
        // TODO: Delete? #rgbOrder = 'RGB';                                  // TODO not implemented yet


        // NOTE: Actual default values of the following data variables should be assigned in the constructor after settings applied as these are derived values.
        #pxlW = 0;
        #pxlH = 0;
        #pxlCount = 0;

        // Calculated touch position to pixel mapping, derived in `API`s constructor
        #touchPixelWidth = 0;
        #touchPixelHeight = 0;
        #touchPixelStartX = 0;
        #touchPixelStartY = 0;

        //TODO - allow custom button map of buttonName => GPIO pin to be added to options object. This would replace the one below.
        #buttons = {
            topLeft: false,
            leftTop: false,
            topRight: false,
            rightTop: false,
            rightBottom: false,
            bottomRight: false,
            bottomLeft: false,
            leftBottom: false,
            top: false,
            bottom: false,
            left: false,
            right: false,
            any: false
        };

        // Touch data
        #touch = [];                                        //the touch data from the local hardware
        #touchRead = [];                                    //the persistent touch data to allow for de-duplicating touch events
        #touchWeb = [];                                     //the touch data from the web interface


        /* --- Methods, Getters and Setters --- */

        /**
         * Allows users to pass in an object of key paired settings values.
         *
         * @constructor
         * @param {Object} settings - Custom settings for the API sotored in a key value paired object.
         */
        constructor(settings) {
            if(settings.hasOwnProperty('consoleDisplay')) this.#consoleDisplay = settings.consoleDisplay;
            if (settings.hasOwnProperty('debugging')) this.#debugging = settings.debugging;

            this.#originalPxlW = config.pixels.width; // TODO: Get from config/hardware
            this.#originalPxlH = config.pixels.height; // TODO: Get from config/hardware

            // Set the font
            this.setFont(); // TODO: need to be able to


            /* --- Derived values --- */
            this.#pxlW = this.#originalPxlW;
            this.#pxlH = this.#originalPxlH;
            this.#pxlCount = this.#pxlW * this.#pxlH;
            this.#numLeds = this.#pxlW * this.#pxlH;

            // This will be table border and RGB buttons. Also makes total divisible by 8 for Teensy Octo:
            this.#buffer = Buffer.alloc((this.#numLeds) * 3);

            //calculated touch position to pixel mapping
            this.#touchPixelWidth = (this.#touchBrPixelX - this.#touchTlPixelX) / (this.#pxlW - 1);
            this.#touchPixelHeight = (this.#touchBrPixelY - this.#touchTlPixelY) / (this.#pxlH - 1);
            this.#touchPixelStartX = this.#touchTlPixelX - (this.#touchPixelWidth / 2);
            this.#touchPixelStartY = this.#touchTlPixelY - (this.#touchPixelHeight / 2);

            // Set up start time:
            this.#startTime = new Date().getTime();
            this.#lastLoopTime = this.#startTime;
            this.#lastStatsTime = this.#startTime;

            if (settings.hasOwnProperty('loop')) this.#cbLoop = settings.loop;
            // TODO: Handle error better. Fail gracefully.
            else this.error('Main loop not found. Include a reference to your defined loop inside your settings object passed into `pxlTbl.setup()`.');

            this.#serialEnabled = config.serial.enabled;
            this.#serialDevices = config.serial.devices;
            this.#baud = config.serial.baud;
            this.#hidEnabled = config.hid.enabled;

            this.#touch = new Array(this.#pxlCount);
            this.#touchRead = new Array(this.#pxlCount);
            this.#touchWeb = new Array(this.#pxlCount);

            if(settings.hasOwnProperty('fpsLimit')) this.#fpsLimit = parseInt(settings.fpsLimit);




            //start web server
            this.startWebServer();

            // TODO: Port hosted from should be a setting. Make the port displayed in the address here dynamic too when implemented.
            if(!this.#consoleDisplay) this.log('Console display disabled, visit http://127.0.0.1:3000 to view stats.');

            //Go go go!
            this.start();



        }

        /* --- Internal methods  --- */

        start() {
            // Check if we are running on a Raspberry Pi
            try {
                const raspi = require('raspi');
                const board = require('raspi-board');


                raspi.init(() => {


                    if(board.getBoardRevision() !== 'unknown') {

                        this.log('Raspberry Pi version: '+board.getBoardRevision()+' detected, booting...');
                        this.#isRasPi = true;


                        //load GPIO
                        const gpio = require('rpi-gpio');

                        //start button input
                        //TODO use buttonmap object once implimented
                        gpio.setup(13, gpio.DIR_IN, gpio.EDGE_BOTH); //Right Top
                        gpio.setup(15, gpio.DIR_IN, gpio.EDGE_BOTH); //Top Right
                        gpio.setup(16, gpio.DIR_IN, gpio.EDGE_BOTH); //Left Bottom
                        gpio.setup(18, gpio.DIR_IN, gpio.EDGE_BOTH); //Bottom Left
                        gpio.setup(22, gpio.DIR_IN, gpio.EDGE_BOTH); //Left Top
                        gpio.setup(37, gpio.DIR_IN, gpio.EDGE_BOTH); //Top Left
                        gpio.setup(36, gpio.DIR_IN, gpio.EDGE_BOTH); //Right Bottom
                        gpio.setup(32, gpio.DIR_IN, gpio.EDGE_BOTH); //Bottom Right
                        gpio.setup(31, gpio.DIR_IN, gpio.EDGE_BOTH); //Home

                        gpio.on('change',  (channel, value) => {
                            this.setButton(channel, value);
                        });

                        //setup HID touch

                        if (this.#hidEnabled) {
                            const HID = require('node-hid');
                            const hidConfig = require('./hid-config');

                            const devices = HID.devices();

                            for (let i = 0; i < devices.length; i++) {
                                if (devices[i].path === this.#hidPath) { //TODO I'm not sure why we are checking the path here. We should jsut be looking for mathing HD device on any path
                                    for (let j = 0; j < hidConfig.length; j++) {
                                        if (hidConfig[j].vendorId === devices[i].vendorId && hidConfig[j].productId === devices[i].productId) {
                                            this.#touchParams = hidConfig[j];
                                        }
                                    }
                                }
                            }

                            if (this.#touchParams.name !== undefined) {
                                this.log("Found HID device: " + this.#touchParams.name);
                                this.#touchPanel = new HID.HID(pxltblApi.hidPath);
                                this.#touchPanel.setNonBlocking(true);
                            } else {
                                //TODO display this a bit better
                                this.warn("HID device at " + this.#hidPath + " did not match any devices in hid-config.json.");
                                this.debug(devices);
                            }

                        }

                        //start serial
                        //TODO this should loop through the available serial devices in config.json and query the device.
                        if (this.#serialEnabled) {
                            const Serial = require('raspi-serial').Serial;
                            this.#serialPath = this.#serialDevices[0];
                            this.#serial = new Serial({
                                portId: this.#serialPath,
                                baudRate: this.#baud
                            });

                            this.#serial.open(() => {
                                this.log('Serial port ' + this.#serialPath + ' open at ' + this.#baud + ' baud.');
                                //Setup incoming serial data handler
                                this.#serial.on('data', (data) => {
                                    this.handleSerial(data);
                                });
                                process.stdout.write('Querying pxltbl hardware...');
                                this.getParams();

                            });
                        } else {
                            this.log('Serial is disabled.');
                            this.log('*** STARTUP COMPLETE ***');
                            this.show();
                        }


                    } else {
                        this.warn('This isn\'t a Raspberry Pi!?? That\'s OK though, I\'ll carry on in software/web only mode...');
                        this.log('*** STARTUP COMPLETE ***');
                        this.show();
                    }



                });


            } catch (err) {
                this.warn('There was an error setting up the Raspberry Pi. That\'s OK though, I\'ll carry on in software/web only mode...');
                this.log('*** STARTUP COMPLETE ***');
                this.show();
            }

        }

        startWebServer() {
            this.log('Setting up web server...');

            this.#webServer = http.createServer((request, response) => {
                let filePath = this.#webRoot + request.url;

                // Make the URL `www.your-url.com/` point to `www.your-url.com/index.html`
                if (filePath === this.#webRoot + '/')
                    filePath = this.#webRoot + '/index.html';

                const extName = path.extname(filePath);
                let contentType = 'text/html';
                switch (extName) {
                    case '.js':
                        contentType = 'text/javascript';
                        break;
                    case '.css':
                        contentType = 'text/css';
                        break;
                    case '.json':
                        contentType = 'application/json';
                        break;
                    case '.png':
                        contentType = 'image/png';
                        break;
                    case '.jpg':
                        contentType = 'image/jpg';
                        break;
                    case '.wav':
                        contentType = 'audio/wav';
                        break;
                }

                fs.readFile(filePath, function (error, content) {
                    if (error) {
                        if (error.code === 'ENOENT') {
                            fs.readFile('./404.html', function (error, content) {
                                response.writeHead(200, {'Content-Type': contentType});
                                response.end(content, 'utf-8');
                            });
                        } else {
                            response.writeHead(500);
                            response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                            response.end();
                        }
                    } else {
                        response.writeHead(200, {'Content-Type': contentType});
                        response.end(content, 'utf-8');
                    }
                });
            });

            //attaching socket IO server to web server
            this.#webIo = require('socket.io')(this.#webServer);
            this.#webIo.on('connection', (client) => {
                this.#webClients++;
                client.on('buttonDown', (data) => {
                    this.buttonDown(data);
                });

                client.on('buttonUp', (data) => {
                    this.buttonUp(data);
                });

                client.on('touchDown', (data) => {
                    this.touchDown(data);
                });

                client.on('touchUp', (data) => {
                    this.touchUp(data);
                });

                client.on('disconnect', () => {
                    this.#webClients--;
                });
            });

            this.#webServer.listen(3000);
            this.log('Webserver started on port: 3000');


        }


        /**
         * Main loop
         */

        loop() {

            //read touch data (if HID connected)
            //this.readTouchPanel();


            // Check idle time/screensaver
            let sSaverTime = new Date().getTime() - this.#lastInputTime;

            if (sSaverTime >= this.#screenSaverDelay) {
                this.#screenSaverDisplayed = true;
            }

            let curTime = new Date().getTime();
            this.#frameTime = curTime - this.#lastLoopTime;


            //delay if we are exceeding max FPS
            while (this.#fpsLimit > 0 && this.#frameTime < Math.floor(1000 / this.#fpsLimit)) {
                curTime = new Date().getTime();
                this.#frameTime = curTime - this.#lastLoopTime;
            }

            this.#millis = curTime - this.#startTime;
            this.#frames++;
            this.#lastLoopTime = new Date().getTime();

            //push runtime stats to console and web
            this.showStats();


            //run the external loop function - this is where all the user code is
            if(typeof this.#cbLoop == "function") this.#cbLoop();


            //update display and start again
            this.show();


        }


        /**
         * Show stats on console/web
         */

        showStats() {
            //update the web/console every 1000ms
            let curTime = new Date().getTime();
            if (curTime - this.#lastStatsTime > 1000) { //TODO replace 1000 with const

                this.#fps = Math.floor(this.frames * 1000 / (curTime - this.#lastStatsTime));
                this.#lastStatsTime = curTime;
                this.#frames = 0;

                const minFrameTime = Math.round(1000 / this.#fpsLimit);

                if(this.#consoleDisplay) {
                    console.clear();
                    console.log('Is RasPi: ' + this.#isRasPi);
                    console.log('Web Clients: ' + this.#webClients);
                    console.log('Millis: ' + this.#millis);
                    console.log('Game FPS: ' + this.#fps);
                    console.log('FPS limit: ' + this.#fpsLimit);
                    console.log('Frame time: ' + this.#frameTime);
                    console.log('Min frame time: ' + minFrameTime);
                    console.log('Screen size: ' + this.#pxlW+'x'+this.#pxlH+' ('+this.#pxlW*this.#pxlH+')');
                    console.log('Total num of pixels: ' + this.#buffer.length/3);
                    console.log('Frame size: ' + (this.#buffer.length + this.#frameStart.length) + ' bytes');
                    console.log('Bandwidth: ' + Math.round((this.#buffer.length+this.#frameStart.length) * this.#fps * 8 / 1024) +' kbps (Available: '+this.#baud / 1000 +' kbps)');

                    //console.log('Touch read time: ' + this.#touchReadTime);
                    //console.log('Touch packets per read: ' + this.#touchPacketsPerRead);
                    //console.log('Touch: ' + this.#touch);
                    //console.log(Buffer.concat([this.#frameStart, this.#buffer]));


                    for (let i = 0; i < this.#buffer.length; i+=3) {
                        if(i % (this.#pxlW * 3) === 0) process.stdout.write('\n');
                        process.stdout.write('\x1b[38;2;'+this.#buffer[i]+';'+this.#buffer[i+1]+';'+this.#buffer[i+2]+'m▄ ');
                    }

                    process.stdout.write('\x1b[0m');

                }

                //this.dump();

                //send to web
                if(this.#webClients) {
                    this.#webIo.emit('frameData', {
                        webClients: this.#webClients,
                        millis: this.#millis,
                        fps: + this.#fps,
                        fpsLimit: this.#fpsLimit,
                        frameTime: this.#frameTime,
                        minFrameTime: minFrameTime,
                        length: this.#buffer.length,
                        pxlW: this.#originalPxlW,
                        pxlH: this.#originalPxlH,
                        orientation: this.#orientation
                    });
                }


            }

        }


        /**
         * Push display buffer to serial/web
         */

        show() {
            //pushes the buffer to the Teensy via UART and web.

            //touch debug overlay
            /*
            for (let i = 0; i < this.touch.length; i++) {
                if(this.touch[i]) this.buffer[i*3] = 255;
            }
            this.setColor(255,0,255);
            this.text(this.touchRawDataLength,0,0);
            this.text(this.touchReadTime,0,11);
            */

            let buffer = this.#buffer;
            let serialBuffer = Buffer.alloc((this.#numLeds) * 3);

            //if screensaver is active then blank the buffer
            //if(this.#screenSaverDisplayed === true) buffer = Buffer.alloc((this.#numLeds) * 3); TODO Make sure SSaver only fires when needed, then uncomment this line


            //TODO - this assumes stripStart = 'TL'  - it needs to take this into account.
            //TODO add RGB => GRB conversion etc
            if (this.stripSerpantine === true) {
                for (let y = 0; y < this.originalPxlH; y++) {
                    if (y % 2) { //odd row
                        for (let x = 0; x < this.originalPxlW; x++) {
                            let i = y * this.originalPxlW + x;
                            let iReverse = y * this.originalPxlW + (this.originalPxlW - x) - 1;
                            serialBuffer[i * 3] = (buffer[iReverse * 3] * (this.brightness / 255)*this.whiteBalance.r);
                            serialBuffer[i * 3 + 1] = (buffer[iReverse * 3 + 1] * (this.brightness / 255)*this.whiteBalance.g);
                            serialBuffer[i * 3 + 2] = (buffer[iReverse * 3 + 2] * (this.brightness / 255)*this.whiteBalance.b);
                        }
                    } else { //even row
                        for (let x = 0; x < this.originalPxlW; x++) {
                            let i = y * this.originalPxlW + x;
                            serialBuffer[i * 3] = (buffer[i * 3] * (this.brightness / 255)*this.whiteBalance.r);
                            serialBuffer[i * 3 + 1] = (buffer[i * 3 + 1] * (this.brightness / 255)*this.whiteBalance.g);
                            serialBuffer[i * 3 + 2] = (buffer[i * 3 + 2] * (this.brightness / 255)*this.whiteBalance.b);
                        }

                    }
                }
            } else {
                for (let i = 0; i < this.pxlCount; i++) {
                    serialBuffer[i * 3] = (buffer[i * 3] * (this.brightness / 255) * this.whiteBalance.r);
                    serialBuffer[i * 3 + 1] = (buffer[i * 3 + 1] * (this.brightness / 255) * this.whiteBalance.g);
                    serialBuffer[i * 3 + 2] = (buffer[i * 3 + 2] * (this.brightness / 255) * this.whiteBalance.b);
                }

            }

            //remove 1s from serial buffer (a value of 1 is our end of frame character)
            for (let i = 0; i < serialBuffer.length; i++) {
                if(serialBuffer[i] === 1) serialBuffer[i] = 0;
            }



            //send to web
            if(this.#webClients) {
                this.#webIo.volatile.emit('leds', buffer);
            }

            try {
                //send to serial
                if(this.#isRasPi && this.#serialEnabled) {
                    this.#serial.write(Buffer.concat([this.#frameStart, serialBuffer]), () => {
                        this.loop();

                    });
                } else {
                    setTimeout(() => {
                        this.loop();
                    },1);

                }


            } catch (err) {
                this.error(err);
            }

        }



        /**
         * Used when receiving input to both check if the screensaver is up (return
         * true if it is) and update the last input variables.
         */

        checkToggleScreensaver() {
            // This should only be called when there has been input, so update the variable.
            this.#lastInputTime = new Date().getTime();

            if (this.#screenSaverDisplayed) {
                this.#screenSaverDisplayed = false
                return false;
            }

            return true;
        }

        /**
         * Reads touch panel data andpopulates touch variables
         */
        readTouchPanel() {

        }

        /**
         * Sends serial data to the Teensy to get it to respond with it's hardware params
         */
        getParams() {

        }

        /**
         * Handles any serial data sent back form the teensy (i.e. hardware params)
         */
        handleSerial() {

        }


        /* --- Web / interaction methods --- */

        /**
         * Used to set a button state
         */
        setButtonByName(name,value) {

        };

        /**
         * Used to set a button state
         */
        setButton(channel,value) {

        };

        buttonDown(channel) {


        };


        /**
         * button event fired from web
         */
        buttonUp(channel) {


        };


        /**
         * touch event fired from web
         */
        touchDown(location) {
            //TODO - make these work with arrays (multi touch)

        };

        /**
         * touch event fired from web
         */
        touchUp(location) {

        };





        /* --- API methods --- */

        /**********************************************************************
         * List of API methods for reference:
         *
         * - quit()
         * - exit()
         *
         * - getFps()
         * - getFpsLimit()
         * - setFpsLimit(fpsLimit)
         * - getFrameTime() was frameTime()
         * - getRunTime() was milis()
         * - getOrientation() was getRotation()
         * - setOrientation(angle)
         * - getPxlCount() was pxlCount
         * - getScreenWidth() was pxlW()
         * - getScreenHeight() was pxlH()
         * - getWhiteBalance()
         * - setWhiteBalance(r, g, b)
         *
         * - isRasPi()
         *
         * --- Drawing methods ---
         *
         * - blank(r, g, b)
         * - setDrawColor(r, g, b, a(optional)) was setcolor()
         * - setDrawColor(hexColorString) was setcolor()
         * - setDrawColor(array) was setColor()
         * - setDrawColor({colorRgb}) was setColor()
         * - setDrawColorRGB(r, g, b, a(optional)) was setColor()
         * - setDrawColorHsl(h, s, l, a) was setColorHsl()
         * - setDrawColorHsv(h, s, v, a) was setColorHsv()
         * - setPixel()
         * - fillBox(x, y, w, h)
         * - setFont() NEW
         * - text(text, x, y)
         * - textBounds(text)
         *
         * --- Input functions ---
         *
         * - clearInputs() ***
         * - getButtons() was buttons() ***
         *
         * --- Sound functions ---
         *
         * - playWav(file, loop) ***
         *
         * --- Helper FUnction ---
         *
         * - debug(msg)
         * - warn(msg)
         * - error(msg)
         *
         * - hslToRgb()
         * - hsvToRgb()
         * - rgbToHsl()
         * - rgbToHsv()
         * - hslToHsv()
         * - hsvToHsl()
         * - hexToRgb(hexColorString)
         *
         * TODO:
         *
         * - Should we be returning and accepting classes like `ColorRgb`,
         *   `ColorCky`, etc. This was return values can be passed straight
         *   into other methods.
         *
         *********************************************************************/



        /**
         * Exits and shuts down the PxlTbl
         */

        shutdown = () => {
            this.log('Closing...');
            // TODO: this.#serial.close(function(){process.exit();});
            // For now just kill the process
            process.exit(1);
        };

        /**
         * Exits a prog and returns to the main menu
         */
        exit = () => {
            // Go to home screen
            this.#goHome = true;
        };

        /**
         * Get the current FPS of the app.
         *
         * @returns {number}
         */
        getFps = () => {
            return this.#fps;
        }

        /**
         * Ge the FPSs limit for the App
         *
         * @returns {number} fpsLimit - The amount of frames per second the API will attempt to maintain
         */
        getFpsLimit = () => {
            return this.#fpsLimit;
        }

        /**
         * Set the FPSs limit for the App
         *
         * @param {number} fpsLimit - The amount of frames per second the API will attempt to maintain
         */
        setFpsLimit = (fpsLimit) => {
            // TODO: Sanity check?
            this.#fpsLimit = fpsLimit;
        }


        /**
         * Get the time it tok to render the last frame in milliseconds.
         *
         * @returns {number} frameTime - Frame time in milliseconds
         */
        getFrameTime = () => {
            return this.#frameTime;
        }


        getRunTime = () => {
            return this.#millis;
        }

        /**
         * Get the current orientation of the screen in degrees.
         *
         * @returns {number} orientation - Screen rotation in degrees
         */
        getOrientation = () => {
            return this.#orientation;
        }

        /**
         * Set the current orientation of the screen in degrees.
         *
         * @param {number} angle - Angle to set the screen orientation to in degrees
         */
        setOrientation = (angle) => {
            // TODO: Sanity check?
            if(angle === 0 || angle === 180) {
                this.#orientation = angle;
                this.#pxlW = this.#originalPxlW;
                this.#pxlH = this.#originalPxlH;
            }

            if(angle === 90 || angle === 270) {
                this.#orientation = angle;
                this.#pxlW = this.#originalPxlH;
                this.#pxlH = this.#originalPxlW;
            }

            this.blank();
        }

        /**
         * Get the amount of pixels contained in the screen as a number.
         *
         * @returns {number} pxlCount - Number of pixels in the screen.
         */
        getPxlCount = () => {
            return this.#pxlCount;
        }

        /**
         * Get the width of the screen in pixels.
         *
         * @returns {number}
         */
        getScreenWidth = () => {
            return this.#pxlW;
        }

        /**
         * Get the height of the screen in pixels.
         *
         * @returns {number}
         */
        getScreenHeight = () => {
            return this.#pxlH;
        }

        /**
         * Get the white balance of the screen.
         *
         * @returns {{r: number, b: number, g: number}} colorRgb - RGB representation of the screen white balance
         */
        getWhiteBalance = () => {
            return this.#whiteBalance;
        }

        /**
         * Set the white balance of the screen.
         *
         * @param {number} r - Red value from 0 to 255
         * @param {number} g - Green value from 0 to 255
         * @param {number} b - Blue value from 0 to 255
         */
        setWhiteBalance = (r, g, b) => {
            // TODO: Sanity check?
            this.#whiteBalance.r = r;
            this.#whiteBalance.g = g;
            this.#whiteBalance.b = b;
        }

        // --- Drawing Methods ------------------------------------------------

        /**
         * Fill the screen with the color r, g and b;
         *
         * @param r {number} r - Red value from 0 to 255
         * @param g {number} g - Green value from 0 to 255
         * @param b {number} b - Blue value from 0 to 255
         */
        blank = (r = 0, g = 0, b = 0) => {
            for (let i = 0; i < this.#pxlCount; i++) {
                this.#buffer[i * 3] = r;
                this.#buffer[i * 3 + 1] = g;
                this.#buffer[i * 3 + 2] = b;
            }
        }

        setDrawColor = (r, g, b, a = 1) => {
            if(typeof r === 'object' && r.hasOwnProperty('r') && r.hasOwnProperty('g') && r.hasOwnProperty('b')) {
                // Have we been passed an object of RGB?
                a = (r.hasOwnProperty('a')) ? r.a : 1;
                b = r.b;
                g = r.g;
                r = r.r;
            } else if(typeof r === 'object' && r.hasOwnProperty('h') && r.hasOwnProperty('s') && r.hasOwnProperty('l')) {
                // Have we been passed an object of HSL?
                a = (r.hasOwnProperty('a')) ? r.a : 1;

                const rgb = this.hslToRgb(r.h,r.s,r.l);

                r = rgb.r;
                g = rgb.g;
                b = rgb.b;

            } else if(typeof r === 'object' && r.hasOwnProperty('h') && r.hasOwnProperty('s') && r.hasOwnProperty('v')) {
                // Have we been passed an object of HSV?
                a = (r.hasOwnProperty('a')) ? r.a : 1;

                const rgb = this.hsvToRgb(r.h,r.s,r.v);

                r = rgb.r;
                g = rgb.g;
                b = rgb.b;
            } else if(Array.isArray(r) && r[0] !== undefined && r[1] !== undefined && r[2] !== undefined) {
                // Have we been passed an array?
                if(r.length > 3) a = r[3]; else a = 1;
                b = r[2];
                g = r[1];
                r = r[0];
            } else if(typeof r === 'string') {
                //have we been passed a hex string?
                //TODO - convert string to values
            }

            this.#colorR = Math.round(r);
            this.#colorG = Math.round(g);
            this.#colorB = Math.round(b);
            this.#colorA = a;
        }


        /**
         * TODO: Description
         *
         * @param r
         * @param g
         * @param b
         * @param a
         */
        setDrawColorRgb = (r, g, b, a = 1) => {
            this.setDrawColor(r,g,b,a);
        }

        /**
         * TODO: Description
         *
         * @param h
         * @param s
         * @param l
         * @param a
         */
        setDrawColorHsl = (h, s, l, a = 1) => {
            const hsl = {
                h: h,
                s: s,
                l: l,
                a: a
            };

            this.setDrawColor(hsl);
        }

        /**
         * TODO: Description
         *
         * @param h
         * @param s
         * @param v
         * @param a
         */
        setDrawColorHsv = (h, s, v, a = 1) => {
            const hsv = {
                h: h,
                s: s,
                v: v,
                a: a
            };

            this.setDrawColor(hsv);
        }

        /**
         * Set an individual pixel.
         *
         * @param x
         * @param y
         */
        setPixel = (inX, inY) => {
            inX = Math.round(inX);
            inY = Math.round(inY);

            let x = 0;
            let y = 0;

            switch(this.#orientation) {
                case 0:
                    x = inX;
                    y = inY;
                    break;
                case 90:
                    x = this.#pxlH - inY - 1;
                    y = inX;
                    break;
                case 180:
                    x = this.#pxlW - inX - 1;
                    y = this.#pxlH - inY - 1;
                    break;
                case 270:
                    x = inY;
                    y = this.#pxlW - inX - 1;
                    break;
            }

            if(x < 0 || y < 0 || x >= this.#originalPxlW || y >= this.#originalPxlH) return false;

            const pixel = y * this.#originalPxlW + x;

            this.#buffer[pixel * 3] = this.#buffer[pixel * 3] * (1-this.#colorA) + this.#colorA * this.#colorR;
            this.#buffer[pixel * 3 + 1] = this.#buffer[pixel * 3 + 1] * (1-this.#colorA) + this.#colorA * this.#colorG;
            this.#buffer[pixel * 3 + 2] = this.#buffer[pixel * 3 + 2] * (1-this.#colorA) + this.#colorA * this.#colorB;
        }

        /**
         * Returns the color of a given pixel.
         *
         * @param {number} x - TODO:
         * @param {number} y - TODO:
         * @returns {{r: {number}, b: {number}, g: {number}}} colorRgb
         */
        getPixel = (x, y) => {
            const pixel = Math.round(y) * this.#originalPxlW + Math.round(x);

            return {
                r: this.#buffer[pixel * 3],
                g: this.#buffer[pixel * 3 + 1],
                b: this.#buffer[pixel * 3 + 2]
            }
        }

        /**
         * Draws a filled box at location `x, y` of width `w` and height `h`.
         *
         * @param x
         * @param y
         * @param w
         * @param h
         */
        fillBox = (x, y, w, h) => {
            x = Math.round(x);
            y = Math.round(y);
            w = Math.round(w);
            h = Math.round(h);

            for (let i = 0; i < h; i++) {
                for (let j = 0; j < w && j + x < this.#originalPxlW; j++) {
                    this.setPixel(x + j, y + i);
                }
            }
        }

        /**
         * Gets the font array TODO: this is hard coded in, can we load a file
         *
         * @returns {fontArray}
         */
        setFont = (fontName = 'default') => {
            //TODO check to see if file exists first...
            const newFont = require('./fonts/'+fontName+'.js');

            this.#fontArray = []; // Reset existing
            this.#fontArray = newFont;
        }

        text = (text, x, y) => {
            // Sanitize data
            text = '' + text;
            x = Math.round(x);
            y = Math.round(y);

            let cursor = 0;
            let biggestY = 0;

            for (let i = 0; i < text.length; i++) {
                const character = this.#fontArray[text.charCodeAt(i)];
                const len = character.length;

                for (let col = 0;  col < len; col++) {
                    let column = character[col];

                    let bit = 0;
                    let lower = 0;

                    while (bit < 8) {
                        if(bit == 0 && column & 0x01) {
                            //lower the whole letter but dont set any pixels
                            lower = 2;
                        } else {

                            if (column & 0x01) {
                                if(bit + lower > biggestY) biggestY = bit + lower;
                                this.setPixel(x + cursor, (bit - 1 + y) + lower);
                            }
                        }

                        bit++;
                        column = column >> 1;
                    }
                    cursor++;
                }
                cursor++;
            }

            return {w: cursor-1, h: biggestY};
        }

        /**
         * Returns the height and width of a string if it were to be drawn in the current font.
         *
         * @param {string} text - The string to be measured.
         * @returns {{w: number, h: number}} -
         */
        textBounds = (text) => {
            //TODO - instead of calling text, do something more efficient!
            return this.text(text, 100, 100);
        }


        /* --- Sounds --- */

        beep = (freq, duration, waveform) => {
            //plays a sound

        };

        playWav = function (fileName,loop) {


            var player = require('node-wav-player');

            if(loop === undefined) loop = false;


            player.play({
                path: './wav/'+fileName+'.wav',
                loop: loop
            }).then(() => {

            }).catch((error) => {
                pxltblApi.error('Could not load wav: '+fileName);
            });

            return player;

            /*

            var file = fs.createReadStream('wav/'+fileName+'.wav');
            var reader = new wav.Reader();

            // the "format" event gets emitted at the end of the WAVE header
            reader.on('format', function (format) {

                // the WAVE header is stripped from the output of the reader
                reader.pipe(new Speaker(format));
            });

            // pipe the WAVE file to the Reader instance
            file.pipe(reader);


            */


        };

        /* --- Generic Helper methods --- */

        /**
         * Prints basic debug messaging to the console window if debugging messages are enabled.
         *
         * @param msg - The message to be output tot he console.
         */
        debug(msg) {
            if(this.#debugging) {
                log('DEBUG: ' + msg);
                if(this.#webClients) {
                    this.#webIo.emit('debug', msg);
                }
            }
        }

        /**
         * Prints info messaging to the console window.
         *
         * @param msg - The message to be output tot he console.
         */
        log(msg) {
            log(c.cyan(msg));
            if(this.#webClients) {
                this.#webIo.emit('info', msg);
            }
        }


        /**
         * Prints basic warning messages to the console window.
         *
         * @param {String} msg - The message to be output tot he console.
         */
        warn(msg) {
            log.warn(c.yellow('WARNING: ' + msg));
            if(this.#webClients) {
                this.#webIo.emit('warn', msg);
            }
        }

        /**
         * Prints basic error messages to the console window.
         *
         * @param {String} msg - The message to be output tot he console.
         */
        error(msg) {
            log.error(c.red('ERROR: ' + msg));
            if(this.#webClients) {
                this.#webIo.emit('error', msg);
            }
        }

        /**
         * Input and rga value and get it's closest ANSI color.
         * Useful for older consoles so we can still color and format our output.
         *
         * @param {number} r - Red color channel value from 0 to 255
         * @param {number} g - Green color channel value from 0 to 255
         * @param {number} b - Blue color channel value from 0 to 255
         * @returns {number} ansiColor - A Standard ANSI color code
         */
        rgbToAnsi256(r, g, b) {
            // we use the extended greyscale palette here, with the exception of
            // black and white. normal palette only has 4 greyscale shades.
            if (r === g && g === b) {
                if (r < 8) {
                    return 16;
                }

                if (r > 248) {
                    return 231;
                }

                return Math.round(((r - 8) / 247) * 24) + 232;
            }

            return 16
                + (36 * Math.round(r / 255 * 5))
                + (6 * Math.round(g / 255 * 5))
                + Math.round(b / 255 * 5);
        }

        hslToRgb = (h, s, l) => {
            let r = 0;
            let g = 0;
            let b = 0;

            h /= 360;
            s /= 255;
            l /= 255;

            if (s === 0) {
                r = g = b = l; // achromatic
            } else {
                function hue2rgb(p, q, t) {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                }

                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;

                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }

            return [ Math.round(r * 255), Math.round(g * 255), Math.round(b * 255) ];
        }

        /**
         * TODO: Description
         *
         * @param {number} h - TODO: Description
         * @param {number} s - TODO: Description
         * @param {number} v - TODO: Description
         * @returns {{r: number, b: number, g: number}} colorRgb -
         */
        hsvToRgb = (h, s, v) => {
            let r = 0;
            let g = 0;
            let b = 0;

            h /= 360;
            s /= 255;
            v /= 255;

            const i = Math.floor(h * 6);
            const f = h * 6 - i;
            const p = v * (1 - s);
            const q = v * (1 - f * s);
            const t = v * (1 - (1 - f) * s);

            switch (i % 6) {
                case 0: r = v; g = t; b = p; break;
                case 1: r = q; g = v; b = p; break;
                case 2: r = p; g = v; b = t; break;
                case 3: r = p; g = q; b = v; break;
                case 4: r = t; g = p; b = v; break;
                case 5: r = v; g = p; b = q; break;
                default: break;
            }

            return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
        }

        /**
         * TODO: Description
         *
         * @param {number} r - Red color channel value from 0 to 255
         * @param {number} g - Green color channel value from 0 to 255
         * @param {number} b - Blue color channel value from 0 to 255
         * @returns {{s: number, h: number, l: number}}
         */
        rgbToHsl = (r, g, b) => {
            // Convert RGB values from 0-255 range to 0-1 range.
            r /= 255;
            g /= 255;
            b /= 255;

            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0; // achromatic
            } else {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                    default: break;
                }

                h /= 6;
            }

            return { h: Math.round(360 * h), s: Math.round(255 * s), l: Math.round(255 * l) };
        }

        /**
         * TODO: Description
         *
         * @param {number} r - Red color channel value from 0 to 255
         * @param {number} g - Green color channel value from 0 to 255
         * @param {number} b - Blue color channel value from 0 to 255
         * @returns {{s: number, h: number, v: number}}
         */
        rgbToHsv = (r, g, b) => {
            // Convert RGB values from 0-255 range to 0-1 range.
            r /= 255;
            g /= 255;
            b /= 255;

            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, v = max;

            const d = max - min;
            s = max === 0 ? 0 : d / max;

            if (max === min) {
                h = 0; // achromatic
            } else {
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                    default: break;
                }

                h /= 6;
            }

            return { h: Math.round(360*h), s: Math.round(255*s), v: Math.round(255*v) };
        }

        /**
         * Convert a HSL color into a HSV color.
         *
         * @param {number} h - TODO: Description for tooltips.
         * @param {number} s - TODO: Description for tooltips.
         * @param {number} l - TODO: Description for tooltips.
         * @returns {{s: number, h: number, v: number}}
         */
        hslToHsv = (h, s, l) => {
            let colorObj = this.hslToRgb(h, s, l);
            colorObj = this.rgbToHsv(colorObj.r, colorObj.g, colorObj.b);

            return { h: colorObj.h, s: colorObj.s, v: colorObj.v }
        }

        /**
         * Convert a HSV color into a HSL color.
         *
         * @param {number} h - TODO: Description for tooltips.
         * @param {number} s - TODO: Description for tooltips.
         * @param {number} v - TODO: Description for tooltips.
         * @returns {{s: number, h: number, l: number}}
         */
        hsvToHsl = (h, s, v) => {
            let colorObj = this.hsvToRgb(h, s, v);
            colorObj = this.rgbToHsl(colorObj.r, colorObj.g, colorObj.b);

            return { h: colorObj.h, s: colorObj.s, l: colorObj.l }
        }

        /**
         * Takes a color's hex value as a sting and converts it into an colorRgb object.
         *
         * @param hexColorSting
         * @returns {{r: number, b: number, g: number}|null}
         */
        hexToRga = (hexColorSting) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColorSting);

            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

    } /* End of API class */

    return {
        /**
         * This static method sets up our API  with the settings passed in as an object.
         * Values in the settings objects should be key value airs. Check the
         * documentation for a full list of setting keys that may be used.
         *
         *
         * @param settings
         *
         * @returns {API}
         */
        setup: (settings) => {
            // TODO: should we do some validation/sanity checking of the passed settings first? eg if(!(type0f(settings) = 'object'));

            // check if instance is available
            if (!_instance) {
                _instance = new API(settings);
                // Now we have an instance, we don't want to be able to create any more API's so we delete the constructor.
                delete _instance.constructor;
            }
            return _instance;
        }
    };
})();

module.exports =  pxlTbl;