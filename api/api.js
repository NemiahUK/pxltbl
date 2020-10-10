/**
 * PxlTbl API
 */



/*-----------------------------------------------------------------------------
 * Dependencies
 *---------------------------------------------------------------------------*/

const zealit = require('zealit');                            // Enforce strict properties on class
const pkg = require("../package.json");                       // Including our `package.json` file so we can access the data
const config = require("./config.json");                     // Grab the config file so we can access the data

const fs = require('fs');                                   // FileSystem included with Node.js
const PNG = require('pngjs').PNG;                               // For reading PNG files
const path = require('path');                               // Gets the path of a file or directory.
const http = require('http');                               // HTTP tools
const hidController = require('node-hid');

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


        /* --- Constants --- */

        // TODO: Find other values that should be constant and add here?
        // TODO: Constant inside a `constants` object and freeze it to make values read only.


        // API / User Data
        #isRasPi = false;                                   // Is true when the API is running on a physical PxlTbl, false when using the web emulator
        #frameTime = 0;                                     // The frame time of the last frame rendered
        #millis = 0;                                        // Number of ms since start
        #frames = 0;                                        // Number of frames rendered
        #fps = 0;                                           // Current frames per second
        #orientation = 0;
        #brightness = 200;                                  // Brightness setting for the screen
        #whiteBalance = {
            r: 1.0,
            g: 0.9,
            b: 0.5
        };                                                  // White balance setting for the screen.
        #colorR = 255;                                      // Color red channel
        #colorG = 255;                                      // Color green channel
        #colorB = 255;                                      // Color blue channel
        #colorA = 1;                                        // Color alpha channel (transparency)

        // Internal vars
        #goHome = false;                                    // Used to signal intent to return to main menu
        #screenSaverDisplayed = false;                      // Is the screensaver being displayed
        #fontArray = [];                                    // Holds the font that is used when calling `text()` and similar methods.
        #startTime = null;                                  // ???
        #lastLoopTime = null;                               // ???
        #lastStatsTime = null;                              // ???
        #lastInputTime = new Date().getTime();


        // Serial HW config
        #serial = null;                                     // ???
        #serialEnabled = false;                             // ???
        #baud = 0;                                          // ???
        #serialDevices = [];                                // ???
        #serialDeviceId = -1;                               // ???
        #serialPath = '';                                   // ???
        #buffer = null;                                     // Add empty buffer for future use.
        #frameStart = Buffer.from([0x1, 0x2]);              // ???
        #gotParams = false;                                 // ???
        #paramTries = 0;                                    // ???


        // Web server config
        #webRoot = './web';                                 // ???
        #webServer = '';                                    // ???
        #webIo = '';                                        // ???
        #webClients = 0;                                    // ???

        // Buttons
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

        //HID device
        #lastHidInit = 0;
        #hidInitRetryDelay = 3000;
        #hidEnabled = false;
        #touchPanel = null;                                 // The touch panel device reference
        #hidPath = '';                                      // TODO I think this needs removing - Ste
        #touchParams = {};
        #touchReadTime = 0;
        #touchPacketsPerRead = 0;
        #touchLastRead = 0;
        #touchReadingData = false;
        #touchRawDataLength = 0;

        // Touch data
        #touch = [];                                        //the touch data from the local hardware
        #touchRead = [];                                    //the persistent touch data to allow for de-duplicating touch events
        #touchWeb = [];                                     //the touch data from the web interface


        // Sounds


        /* --- Options --- */

        // These are the defaults, overridden by the settings object passed into constructor.

        #debugging = false;                                 // When true, the API will output
        #consoleStats = false;                            // When true, a graphical representation of the PxlTbl data is displayed in the console window.
        #consoleScreen = false;                            // When true, a graphical representation of the PxlTbl data is displayed in the console window.
        #consoleTouch = false;                            // When true, a graphical representation of the PxlTbl data is displayed in the console window.
        #fpsLimit = 30;                                     // Limit the frames per second so we won't over work the hardware rendering useless frame. Good values would be 30 or 60
        #cbLoop = null;                                     // This is a place holder for the user's main loop. Users will pass a loop function into the API before run time and it can be called though this variable.
        #webPort = 3000;
        #screenSaverDelay = 1000 * 60 * 5;                  // Amount of time in milliseconds until a screensaver is displayed


        // The following is gotten from the firmware or overridden for no-pi emulation
        // NOTE: Actual default values of the following data variables should be assigned in the constructor after settings applied as these are derived values.
        #pxlW = 0;
        #pxlH = 0;
        #originalPxlW = 0;                                  // ???
        #originalPxlH = 0;                                  // ???
        #pxlCount = 0;
        #numLeds = 0;                                       // This could be more than the size of the screen as it includes button LEDs etc.
        // TODO: Delete? #stripSerpantine = false;                           // ???
        // TODO: Delete? #stripStart = 'TL';                                 // TODO not implemented yet can be TL, TR, BL, BR
        // TODO: Delete? #rgbOrder = 'RGB';                                  // TODO not implemented yet




        /* --- Methods, Getters and Setters --- */

        /**
         * Allows users to pass in an object of key paired settings values.
         *
         * @constructor
         * @param {Object} settings - Custom settings for the API sotored in a key value paired object.
         */
        constructor(settings) {
            if(settings.hasOwnProperty('consoleStats')) this.#consoleStats = settings.consoleStats;
            if(settings.hasOwnProperty('consoleScreen')) this.#consoleScreen = settings.consoleScreen;
            if(settings.hasOwnProperty('consoleTouch')) this.#consoleTouch = settings.consoleTouch;
            if(settings.hasOwnProperty('debugging')) this.#debugging = settings.debugging;
            if(settings.hasOwnProperty('fpsLimit')) this.#fpsLimit = parseInt(settings.fpsLimit);
            if(settings.hasOwnProperty('brightness')) this.#brightness = parseInt(settings.brightness);
            if(settings.hasOwnProperty('webPort')) this.#webPort = parseInt(settings.webPort);


            this.#originalPxlW = config.pixels.width;
            this.#originalPxlH = config.pixels.height;

            // Set the font
            this.setFont(); // TODO: need to be able to


            /* --- Derived values --- */
            this.#pxlW = this.#originalPxlW;
            this.#pxlH = this.#originalPxlH;
            this.#pxlCount = this.#pxlW * this.#pxlH;
            this.#numLeds = this.#pxlW * this.#pxlH;

            // This will be table border and RGB buttons. Also makes total divisible by 8 for Teensy Octo:
            this.#buffer = Buffer.alloc((this.#numLeds) * 3);



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


            //start web server
            this.startWebServer();

            // TODO: Port hosted from should be a setting. Make the port displayed in the address here dynamic too when implemented.
            if(!this.#consoleStats) this.log('Console display disabled, visit http://127.0.0.1:'+this.#webPort+' to view stats.');

            //Go go go!
            this.start();



        }

        /* --- Internal methods  --- */

        start = () => {
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
                        gpio.setup(13, gpio.DIR_IN, gpio.EDGE_BOTH, (err) => { if(err) this.error(err) }); //Right Top
                        gpio.setup(15, gpio.DIR_IN, gpio.EDGE_BOTH, (err) => { if(err) this.error(err) }); //Top Right
                        gpio.setup(16, gpio.DIR_IN, gpio.EDGE_BOTH, (err) => { if(err) this.error(err) }); //Left Bottom
                        gpio.setup(18, gpio.DIR_IN, gpio.EDGE_BOTH, (err) => { if(err) this.error(err) }); //Bottom Left
                        gpio.setup(22, gpio.DIR_IN, gpio.EDGE_BOTH, (err) => { if(err) this.error(err) }); //Left Top
                        gpio.setup(37, gpio.DIR_IN, gpio.EDGE_BOTH, (err) => { if(err) this.error(err) }); //Top Left
                        gpio.setup(36, gpio.DIR_IN, gpio.EDGE_BOTH, (err) => { if(err) this.error(err) }); //Right Bottom
                        gpio.setup(32, gpio.DIR_IN, gpio.EDGE_BOTH, (err) => { if(err) this.error(err) }); //Bottom Right
                        gpio.setup(31, gpio.DIR_IN, gpio.EDGE_BOTH, (err) => { if(err) this.error(err) }); //Home

                        gpio.on('change',  (channel, value) => {
                            this.setButton(channel, value);
                        });

                        //setup HID touch

                        if (this.#hidEnabled) {

                            const hidConfig = require('./hid-config');

                            const devices = hidController.devices();

                            for (let i = 0; i < devices.length; i++) {
                                for (let j = 0; j < hidConfig.length; j++) {
                                    if (hidConfig[j].vendorId === devices[i].vendorId && hidConfig[j].productId === devices[i].productId) {
                                        //found a valid HID device, so set up the params
                                        this.#touchParams = hidConfig[j];
                                        this.#hidPath = devices[i].path;

                                        //calculated touch position to pixel mapping
                                        this.#touchParams.pixelWidth = (this.#touchParams.bottomRightPixelX - this.#touchParams.topLeftPixelX) / (this.#pxlW - 1);
                                        this.#touchParams.pixelHeight = (this.#touchParams.bottomRightPixelY - this.#touchParams.topLeftPixelY) / (this.#pxlH - 1);
                                        this.#touchParams.pixelStartX = this.#touchParams.topLeftPixelX - (this.#touchParams.pixelWidth / 2);
                                        this.#touchParams.pixelStartY = this.#touchParams.topLeftPixelY - (this.#touchParams.pixelHeight / 2);
                                    }
                                }
                            }

                            if (this.#touchParams.name !== undefined) {
                                this.log("Found HID device: " + this.#touchParams.name);
                                this.startHid();
                            } else {
                                //TODO display this a bit better
                                this.warn("HID device at " + this.#hidPath + " did not match any devices in hid-config.json.");
                                this.debug(devices);
                                this.#hidEnabled = false;
                            }

                        }

                        //start serial
                        //TODO this should loop through the available serial devices in config.json and query the device.
                        if (this.#serialEnabled) {
                            this.openSerial();
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

        startHid = () => {

            this.debug('Initialising HID device, currently:');
            this.debug(this.#touchPanel);
            this.#touchPanel = new hidController.HID(this.#hidPath);
            this.#touchPanel.setNonBlocking(true);
            this.debug('now:');
            this.debug(this.#touchPanel);


        }

        startWebServer = () => {
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
                client.emit('version',pkg.version);
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

            this.#webServer.listen(this.#webPort);
            this.log('Webserver started on port: '+this.#webPort);


        }


        /**
         * Main loop
         */

        loop = () => {

            //read touch data (if HID connected)
            this.readTouchPanel();


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

        showStats = () => {
            //update the web/console every 1000ms
            let curTime = new Date().getTime();
            if (curTime - this.#lastStatsTime > 1000) { //TODO replace 1000 with const

                this.#fps = Math.floor(this.#frames * 1000 / (curTime - this.#lastStatsTime));
                this.#lastStatsTime = curTime;
                this.#frames = 0;

                const minFrameTime = Math.round(1000 / this.#fpsLimit);

                if(this.#consoleStats || this.#consoleScreen || this.#consoleTouch) console.clear();
                if(this.#consoleStats) {
                    console.log('Is RasPi: ' + this.#isRasPi);
                    console.log('Brightness: ' + this.#brightness);

                    console.log('Web Clients: ' + this.#webClients);
                    console.log('Millis: ' + this.#millis);
                    console.log('Game FPS: ' + this.#fps + ', limit: ' + this.#fpsLimit);
                    console.log('Frame time: ' + this.#frameTime + ', minimum: ' + minFrameTime);
                    console.log('Screen size: ' + this.#pxlW + 'x' + this.#pxlH + ', total: ' + this.#pxlW * this.#pxlH + ', sub-pixels: ' + this.#buffer.length / 3);
                    console.log('Frame size: ' + (this.#buffer.length + this.#frameStart.length) + ' bytes');

                    if (this.#serialEnabled) {
                        console.log('Serial: ' + this.#serialPath + ', Baud: ' + this.#baud + ',  Bandwidth: ' + Math.round((this.#buffer.length + this.#frameStart.length) * this.#fps * 8 / 1024) + ' kbps (Available: ' + this.#baud / 1000 + ' kbps)');
                    } else {
                        console.log('Serial Disabled');
                    }
                    if (this.#hidEnabled) {
                        console.log('HID read time: ' + this.#touchReadTime + 'ms, packets per read: ' + this.#touchPacketsPerRead);
                    } else {
                        console.log('HID Disabled');
                    }
                }

                if(this.#consoleScreen) {
                    for (let i = 0; i < this.#buffer.length; i += 3) {
                        if (i % (this.#pxlW * 3) === 0) process.stdout.write('\n');
                        process.stdout.write('\x1b[38;2;' + this.#buffer[i] + ';' + this.#buffer[i + 1] + ';' + this.#buffer[i + 2] + 'm▄ ');
                    }
                    process.stdout.write('\x1b[0m');
                }

                if(this.#consoleTouch) {
                    for (let i = 0; i < this.#buffer.length; i += 3) {
                        if (i % (this.#pxlW * 3) === 0) process.stdout.write('\n');
                        if(this.#touch[i/3]) {
                            process.stdout.write( '▄ ');
                        } else {
                            process.stdout.write( '  ');
                        }
                    }
                }



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
                        orientation: this.#orientation,
                        lastInputTime: Math.round((new Date().getTime() - this.#lastInputTime)/1000),
                        hidReadTime: this.#touchReadTime,
                        touchPacketsPerRead: this.#touchPacketsPerRead
                    });
                    
                }


            }

        }


        /**
         * Push display buffer to serial/web
         */

        show = () => {
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
            if(this.#screenSaverDisplayed === true) buffer = Buffer.alloc((this.#numLeds) * 3);


            //TODO - this assumes stripStart = 'TL'  - it needs to take this into account.
            //TODO add RGB => GRB conversion etc


            for (let i = 0; i < this.#pxlCount; i++) {
                serialBuffer[i * 3] = (buffer[i * 3] * (this.#brightness / 255) * this.#whiteBalance.r);
                serialBuffer[i * 3 + 1] = (buffer[i * 3 + 1] * (this.#brightness / 255) * this.#whiteBalance.g);
                serialBuffer[i * 3 + 2] = (buffer[i * 3 + 2] * (this.#brightness / 255) * this.#whiteBalance.b);
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

        checkToggleScreensaver = () => {
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
        readTouchPanel = () => {
            //dont run if no HID
            if(!this.#hidEnabled || (Object.keys(this.#touchParams).length === 0 && this.#touchParams.constructor === Object)) return false;

            let dataArray;
            const lastTouchArray = this.#touch;

            //check for HID timeout
            if(this.#touchReadTime > 5000 && this.#touchPacketsPerRead === 0) {
                if(new Date() - this.#lastHidInit > this.#hidInitRetryDelay) {
                    this.#lastHidInit = new Date();
                    this.warn('HID stopped responding, restarting...');
                    this.startHid();
                }
            }


            const now = new Date().getTime();
            this.#touchReadTime = now - this.#touchLastRead;
            this.#touchPacketsPerRead = 0;



            //read all available data and merge it into one touch array
            do {

                try {
                    dataArray = this.#touchPanel.readSync();

                    if(dataArray !== undefined && dataArray.length > 0) {
                        const data = Buffer.from(dataArray);
                        this.#touchLastRead = now;
                        this.#touchReadingData = true;
                        this.#touchRawDataLength = data.length;
                        this.#touchPacketsPerRead++;
                        this.#touch = Array(this.#pxlCount);

                        for (let point = 0; point < 10; point++) {
                            if (data[point*this.#touchParams.touchPacketSize+this.#touchParams.checkPos] === this.#touchParams.checkValue) {
                                const thisPoint = data.slice(point * this.#touchParams.touchPacketSize + this.#touchParams.coordPos, point * this.#touchParams.touchPacketSize + this.#touchParams.coordPos + 4);
                                let touchX = thisPoint[0] | (thisPoint[1] << 8);
                                let touchY = thisPoint[2] | (thisPoint[3] << 8);

                                //convert position to same scale as table
                                touchX = this.#touchParams.maxX * (touchX/this.#touchParams.maxX);
                                touchY = this.#touchParams.maxY * (touchY/this.#touchParams.maxY);

                                //workout which pixel is being touched...
                                const pixelX = Math.floor((touchX - this.#touchParams.pixelStartX) / this.#touchParams.pixelWidth);
                                const pixelY = Math.floor((touchY - this.#touchParams.pixelStartY) / this.#touchParams.pixelHeight);

                                if (pixelX >= 0 && pixelX < this.#pxlW && pixelY >= 0 && pixelY < this.#pxlH) this.#touch[pixelX + pixelY * this.#pxlW] = true;



                            }
                        }
                    }



                } catch (e) {
                    dataArray = [];
                }
            } while(dataArray.length > 0);


            //check to see if touchData has changed
            for (let i = 0; i < this.#touch.length; ++i ) {
                if (this.#touch[i] !== lastTouchArray[i]) {
                    // Touch data changed:
                    if(!this.checkToggleScreensaver()) this.#touch = lastTouchArray;

                    break;
                }
            }





        }

        /**
         * Opend the next serial device in the list
         */
        openSerial = () => {

            this.#serialDeviceId++;  //try next serial device.

            if(this.#serialDeviceId < this.#serialDevices.length) {

                const Serial = require('raspi-serial').Serial;
                this.#serialPath = this.#serialDevices[this.#serialDeviceId];
                this.#serial = new Serial({
                    portId: this.#serialPath,
                    baudRate: this.#baud
                });


                //TODO - need to handle erros properly if the serial port is not valid etc
                this.#serial.open(() => {

                    this.log('Serial port ' + this.#serialPath + ' open at ' + this.#baud + ' baud.');
                    //Setup incoming serial data handler
                    this.#serial.on('data', (data) => {
                        this.handleSerial(data);
                    });
                    this.log('Querying Arduino...');
                    this.getParams();

                });

                if(0) {
                    this.warn('Couldn\'t open '+ this.#serialPath);
                    this.openSerial();
                }
            } else {
                //no more serial devices to try...
                this.warn('Couldn\'t communicate with Arduino on any serial port, continuing without serial.');
                this.#serialEnabled = false;
                this.#gotParams = true;
                this.#paramTries = 0;
                this.show();
            }

        }

        /**
         * Sends serial data to the Teensy to get it to respond with it's hardware params
         */
        getParams = () => {
            if(this.#isRasPi) {
                this.#serial.write(Buffer.from([0x1,0x3]), () => {

                    //nothing to do here other than wait for reply
                    this.#paramTries++;
                    if(this.#paramTries === 5) {
                        this.log('Couldn\'t find arduino on '+ this.#serialPath);
                        this.openSerial();
                    } else {
                        if (this.#paramTries > 1) this.log('Retrying...');
                        setTimeout(() => {
                            if (!this.#gotParams) this.getParams();
                        }, 1000);
                    }

                });
            }
        }

        /**
         * Handles any serial data sent back form the teensy (i.e. hardware params)
         */
        handleSerial = (data) => {
            //TODO if this is a reply to getPrarams...
            const parts = data.toString().split('\n');
            this.#numLeds = parseInt(parts[1]);
            this.#originalPxlW = parseInt(parts[2]);
            this.#originalPxlH = parseInt(parts[3]);
            this.#baud = parseInt(parts[4]);
            //this.#rgbOrder = parts[5];
            this.#gotParams = true;

            this.log('Num LEDs:'+ this.#numLeds + ' pxlW:'+ this.#originalPxlW + ' pxlH:'+ this.#originalPxlH + ' Baud:'+ this.#baud);
            //TODO add serial options for direction e.g. TL and serpantine T/F

            //TODO add calculated params below to function setBuffers()
            this.#buffer = Buffer.alloc((this.#numLeds) * 3);
            this.#pxlW = this.#originalPxlW;
            this.#pxlH = this.#originalPxlH;
            this.#pxlCount = this.#pxlW*this.#pxlH;

            this.log('*** STARTUP COMPLETE ***');
            this.show();
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
        setButton = (channel,value) => {
            //if screensaver running, discard this event
            if (this.checkToggleScreensaver()) {
                switch (channel) {
                    case 22:
                        if(this.#orientation === 0) this.#buttons.leftTop = value;
                        if(this.#orientation === 90) this.#buttons.bottomLeft = value;
                        if(this.#orientation === 180) this.#buttons.rightBottom = value;
                        if(this.#orientation === 270) this.#buttons.topRight = value;

                        break;
                    case 37:
                        if(this.#orientation === 0) this.#buttons.topLeft = value;
                        if(this.#orientation === 90) this.#buttons.leftBottom = value;
                        if(this.#orientation === 180) this.#buttons.bottomRight = value;
                        if(this.#orientation === 270) this.#buttons.rightTop = value;

                        break;
                    case 15:
                        if(this.#orientation === 0) this.#buttons.topRight = value;
                        if(this.#orientation === 90) this.#buttons.leftTop = value;
                        if(this.#orientation === 180) this.#buttons.bottomLeft = value;
                        if(this.#orientation === 270) this.#buttons.rightBottom = value;

                        break;
                    case 13:
                        if(this.#orientation === 0) this.#buttons.rightTop = value;
                        if(this.#orientation === 90) this.#buttons.topLeft = value;
                        if(this.#orientation === 180) this.#buttons.leftBottom = value;
                        if(this.#orientation === 270) this.#buttons.bottomRight = value;

                        break;
                    case 36:
                        if(this.#orientation === 0) this.#buttons.rightBottom = value;
                        if(this.#orientation === 90) this.#buttons.topRight = value;
                        if(this.#orientation === 180) this.#buttons.leftTop = value;
                        if(this.#orientation === 270) this.#buttons.bottomLeft = value;

                        break;
                    case 32:
                        if(this.#orientation === 0) this.#buttons.bottomRight = value;
                        if(this.#orientation === 90) this.#buttons.rightTop = value;
                        if(this.#orientation === 180) this.#buttons.topLeft = value;
                        if(this.#orientation === 270) this.#buttons.leftBottom = value;

                        break;
                    case 18:
                        if(this.#orientation === 0) this.#buttons.bottomLeft = value;
                        if(this.#orientation === 90) this.#buttons.rightBottom = value;
                        if(this.#orientation === 180) this.#buttons.topRight = value;
                        if(this.#orientation === 270) this.#buttons.leftTop = value;

                        break;
                    case 16:
                        if(this.#orientation === 0) this.#buttons.leftBottom = value;
                        if(this.#orientation === 90) this.#buttons.bottomRight = value;
                        if(this.#orientation === 180) this.#buttons.rightTop = value;
                        if(this.#orientation === 270) this.#buttons.topLeft = value;

                        break;
                    case 31:
                        if(value) this.exit();
                        break;
                }
            }

            //set virtual buttons
            this.#buttons.top = this.#buttons.topLeft || this.#buttons.topRight;
            this.#buttons.bottom = this.#buttons.bottomLeft || this.#buttons.bottomRight;
            this.#buttons.left = this.#buttons.leftTop || this.#buttons.leftBottom;
            this.#buttons.right = this.#buttons.rightTop || this.#buttons.rightBottom;

            this.#buttons.any = this.#buttons.top || this.#buttons.bottom || this.#buttons.left || this.#buttons.right;


        };

        buttonDown = (channel) => {
            this.setButton(channel,true);
        };


        /**
         * button event fired from web
         */
        buttonUp = (channel) => {
            this.setButton(channel,false);
        };


        /**
         * touch event fired from web
         */
        touchDown = (location) => {
            //TODO - make these work with arrays (multi touch)
            if (this.checkToggleScreensaver()) {
                this.#touchWeb[location] = true;
            }
        };

        /**
         * touch event fired from web
         */
        touchUp = (location) => {
            //TODO - make these work with arrays (multi touch)
            if (this.checkToggleScreensaver()) {
                this.#touchWeb[location] = false;
            }
        };



        /**
         * Set the  goHome flag to false.
         */
        goneHome = () => {
            this.#goHome = false;
        }




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
         * - getBrightness()
         * - setBrightness(value)
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



        getBuffer = () => {
            return this.#buffer;
        }



        /**
         * Get the current goHome flag.
         *
         * @returns {boolean}
         */
        getGoHome = () => {
            return this.#goHome;
        }



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

        /**
         * Get the birghtness of the screen.
         *
         * @returns {{r: number, b: number, g: number}} colorRgb - RGB representation of the screen white balance
         */
        getBrightness = () => {
            return this.#brightness;
        }

        /**
         * Set the brightness of the screen.
         *
         * @param {number} r - Red value from 0 to 255
         * @param {number} g - Green value from 0 to 255
         * @param {number} b - Blue value from 0 to 255
         */
        setBrightness = (value) => {
            // TODO: Sanity check?
            this.#brightness = value;
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

        pngDraw = (file, x = 0, y = 0, w = 64, h= 64) => {

            const data = fs.readFileSync(file);
            let myImage = PNG.sync.read(data);

            const width  = Math.min(w, myImage.width);
            const height = Math.min(h, myImage.height);



            for (let yPos = 0; yPos < height; yPos++) {
                for (let xPos = 0; xPos < width; xPos++) {

                    const r = myImage.data[(xPos + yPos*myImage.width)*4];
                    const g = myImage.data[(xPos + yPos*myImage.width)*4+1];
                    const b = myImage.data[(xPos + yPos*myImage.width)*4+2];
                    const a = myImage.data[(xPos + yPos*myImage.width)*4+3];

                    //this.debug('r:'+r+'  g:'+g+'  b:'+b+'  a:'+a);

                    this.setDrawColor(r, g, b, a/255);
                    this.setPixel(xPos + x, yPos + y)
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

        text = (text, x, y, style = '') => {
            // Sanitize data
            text = '' + text;
            x = Math.round(x);
            y = Math.round(y);

            let cursor = 0;
            let biggestY = 0;

            for (let i = 0; i < text.length; i++) {
                let character = this.#fontArray[text.charCodeAt(i)];
                if(typeof character == "undefined") character = this.#fontArray[0xFF];
                if(typeof character == "undefined") character = [];

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
                                switch(style) {
                                    case '3d':
                                        // 3D text
                                        this.setPixel(x + cursor - 1, (bit - 1 + y) + lower+1);
                                        break;
                                    case 'outline':
                                        // outline
                                        this.fillBox(x + cursor - 1, (bit - 1 + y) + lower - 1,3,3);
                                        break;
                                    default:
                                        // normal text
                                        this.setPixel(x + cursor, (bit - 1 + y) + lower);
                                }

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
            // TODO - instead of calling text, do something more efficient!
            return this.text(text, 100, 100);
        }


        /* --- Input --- */

        /**
         * Clear touch and button data
         */

        clearInputs = () => {
            //stops button presses persisting between apps.
            this.getTouch();

            this.#buttons = {
                topLeft: false,
                leftTop: false,
                topRight: false,
                rightTop: false,
                rightBottom: false,
                bottomRight: false,
                bottomLeft: false,
                leftBottom: false
            };

        };



        /**
         * get touch data
         */

        getButtons = () => {
            return this.#buttons;
        }

        getTouch = (persist = false) => {
            let touches = [];


            for (let i = 0; i < this.#pxlCount; i++) {
                if((this.#touch[i] || this.#touchWeb[i]) && (!this.#touchRead[i] || persist)) {
                    let x = i % this.#pxlW;
                    let y = Math.floor(i / this.#pxlW);
                    touches.push({ x: x, y: y });
                }
            }

            if(!persist) this.#touchRead = this.#touch || this.#touchWeb;

            return touches;
        };

        isTouchInBounds = (x,y,w,h) => {

            for (let i = 0; i < this.#pxlCount; i++) {

                let curX = i % this.#pxlW;
                let curY = Math.floor(i / this.#pxlW);

                if((this.#touch[i] || this.#touchWeb[i]) && curX >= x && curX < x+w && curY >= y && curY < y+h) return true;

            }

            return false;

        };



        /* --- Sounds --- */

        /**
         * TODO: JS Docs
         *
         * @param freq
         * @param duration
         * @param waveform
         */
        beep = (freq, duration, waveform) => {


        };

        playWav = (fileName,loop = false) => {
            const player = require('node-wav-player');

            try {
                player.play({
                    path: './wav/' + fileName + '.wav',
                    loop: loop
                }).then(() => {

                }).catch((error) => {
                    this.error('Could not load wav: ' + fileName);
                });

                return player;
            } catch(err) {
                this.error('Could not access audio device while playing: ' + fileName);
                return false;
            }


            // const file = fs.createReadStream('wav/'+fileName+'.wav');
            // const reader = new wav.Reader();
            //
            // // the "format" event gets emitted at the end of the WAVE header
            // reader.on('format', function (format) {
            //
            //     // the WAVE header is stripped from the output of the reader
            //     reader.pipe(new Speaker(format));
            // });
            //
            // // pipe the WAVE file to the Reader instance
            // file.pipe(reader);



        };





        /* --- Generic Helper methods --- */

        /**
         * Prints basic debug messaging to the console window if debugging messages are enabled.
         *
         * @param msg - The message to be output tot he console.
         */
        debug = (msg) => {
            if(this.#debugging) {
                log(msg);
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
        log = (msg) => {
            log(c.cyanBright(msg));
            if(this.#webClients) {
                this.#webIo.emit('info', msg);
            }
        }


        /**
         * Prints basic warning messages to the console window.
         *
         * @param {String} msg - The message to be output tot he console.
         */
        warn = (msg) => {
            log.warn(c.yellow(msg));
            if(this.#webClients) {
                this.#webIo.emit('warn', msg);
            }
        }

        /**
         * Prints basic error messages to the console window.
         *
         * @param {String} msg - The message to be output tot he console.
         */
        error = (msg) => {
            let suggestion = '';

            if(typeof msg == 'object' && msg.stack && msg.message) {

                //TODO - replace this with a JSON file containing regex searches and string suggestions

                if(msg.message.includes('setColor')) suggestion = 'Did you mean api.setDrawColor()?';
                if(msg.message.includes('pxlW')) suggestion = 'Did you mean api.getScreenWidth()?';
                if(msg.message.includes('pxlH')) suggestion = 'Did you mean api.getScreenHeight()?';
                if(msg.message.includes('buffer')) suggestion = 'Did you mean api.getBuffer()?';
                if(msg.message.includes('fpsLimit')) suggestion = 'Did you mean api.setFpsLimit()?';

                if(msg.message.includes('Cannot read property \'topLeft\' of undefined')) suggestion = 'Did you mean api.getButtons() instead of api.buttons?';
                if(msg.message.includes('Cannot read property \'topRight\' of undefined')) suggestion = 'Did you mean api.getButtons() instead of api.buttons?';
                if(msg.message.includes('Cannot read property \'rightTop\' of undefined')) suggestion = 'Did you mean api.getButtons() instead of api.buttons?';
                if(msg.message.includes('Cannot read property \'rightBottom\' of undefined')) suggestion = 'Did you mean api.getButtons() instead of api.buttons?';
                if(msg.message.includes('Cannot read property \'bottomRight\' of undefined')) suggestion = 'Did you mean api.getButtons() instead of api.buttons?';
                if(msg.message.includes('Cannot read property \'bottomLeft\' of undefined')) suggestion = 'Did you mean api.getButtons() instead of api.buttons?';
                if(msg.message.includes('Cannot read property \'leftBottom\' of undefined')) suggestion = 'Did you mean api.getButtons() instead of api.buttons?';
                if(msg.message.includes('Cannot read property \'leftTop\' of undefined')) suggestion = 'Did you mean api.getButtons() instead of api.buttons?';
                if(msg.message.includes('Cannot read property \'top\' of undefined')) suggestion = 'Did you mean api.getButtons() instead of api.buttons?';
                if(msg.message.includes('Cannot read property \'bottom\' of undefined')) suggestion = 'Did you mean api.getButtons() instead of api.buttons?';
                if(msg.message.includes('Cannot read property \'left\' of undefined')) suggestion = 'Did you mean api.getButtons() instead of api.buttons?';
                if(msg.message.includes('Cannot read property \'right\' of undefined')) suggestion = 'Did you mean api.getButtons() instead of api.buttons?';
                if(msg.message.includes('Cannot read property \'any\' of undefined')) suggestion = 'Did you mean api.getButtons() instead of api.buttons?';

                msg =  msg.stack;
            }

            log.error(c.red(msg));
            if(this.#webClients) {
                this.#webIo.emit('error', msg);
            }
            if(suggestion.length) this.log(suggestion);
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

        hslToRgb = (h, s, l, a = 1) => {
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

                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }

            return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
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
            return zealit(_instance);
        }
    };
})();

module.exports =  pxlTbl;