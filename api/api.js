//overloading error object to return JSON object - should this go soemwhere else?

if (!('toJSON' in Error.prototype))
    Object.defineProperty(Error.prototype, 'toJSON', {
        value: function () {
            var alt = {};

            Object.getOwnPropertyNames(this).forEach(function (key) {
                alt[key] = this[key];
            }, this);

            return alt;
        },
        configurable: true,
        writable: true
    });



const readline = require('readline');
const fs = require('fs');

const path = require('path');
const http = require('http');


//these consts need moving to the api class







var pxltblApi = new function() {


    //these should probably be public (read-only)
    this.isRasPi = false;
    this.frameTime = 0;
    this.millis = 0;
    this.frames = 0;
    this.fps = 0;
    this.colorR = 255;
    this.colorG = 255;
    this.colorB = 255;
    this.colorA = 1;
    this.goHome = false; //used to signal intent to return to main menu


    //these can be set at any point (public read/write)
    this.rotation = 0;
    this.brightness = 128;
    this.whiteBalance = {
        r: 1.0,
        g: 0.9,
        b: 0.5
    };
    this.paused = false; //not implemented


    //options - these are the defaults, overridden by options object
    this.fpsLimit = 30;
    this.consoleData = true;
    //callback function
    this.cbLoop;

    //these should be gotten from the firmware or overridden for no-pi emulation
    this.originalPxlW = 32;
    this.originalPxlH = 18;
    this.strandLength = 96;
    this.baud = 1000000;
    this.stripSerpantine = true;
    this.stripStart = 'TL';  //can be TL, TR, BL, BR

    //derived
    this.pxlW = this.originalPxlW;
    this.pxlH = this.originalPxlH;
    this.pxlCount = this.pxlW*this.pxlH;




    //these should probably be private
    this.serial;
    this.buffer = new Buffer((this.strandLength*8) * 3);  //add empty buffer for future use. This will be table border and RGB buttons. Also makes total divisible by 8 for Teensy Octo
    this.frameStart = new Buffer([0x01]);


    this.startTime = new Date().getTime();
    this.lastLoopTime = this.startTime;
    this.lastStatsTime = this.startTime;

    this.webServer;
    this.webIo;
    this.webRoot = './web';
    this.webClients = 0;

    //TODO - allow custom buttom map of buttonName => GPIO pin to be added to options object. This would replace the one below.
    this.buttons = {
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

    //touch data
    this.touch = new Array(this.pxlCount);






    this.start = function (options) {


        //setup callbacks
        this.cbLoop = options.callbackLoop;

        if(options.consoleData !== undefined) this.consoleData = options.consoleData;

        //setup options

        if(options.fpsLimit !== undefined) this.fpsLimit = parseInt(options.fpsLimit);

        try {
            const raspi = require('raspi');

            raspi.init(() => {

                console.log('Raspberry Pi detected, booting...');
                this.isRasPi = true;

                const Serial = require('raspi-serial').Serial;
                var gpio = require('rpi-gpio');


                //start keyboard input
                //TODO the 3 lines below erorr if running in service mode becasue there is no STDIN, need to check and enable if possible
                //readline.emitKeypressEvents(process.stdin);
                //process.stdin.setRawMode(true);
                //process.stdin.on('keypress', pxltblApi.keyPress);


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

                gpio.on('change', function(channel, value) {

                    pxltblApi.setButton(channel,value);

                });


                //start serial
                pxltblApi.serial = new Serial({
                    portId: '/dev/ttyACM0',
                    baudRate: pxltblApi.baud
                });

                pxltblApi.serial.open(() => {
                    console.log('pxltbl booting...DONE');
                    pxltblApi.blank(0, 0, 0);
                    pxltblApi.show();
                })

                //setup SPI Rx events
                //TODO - here we need functions to handle SPI commands recieved form the arduino, such as 'booted', 'etc'

            });


        } catch (err) {
            console.log('This isn\'t a Raspberry Pi!?? That\'s OK though, I\'ll carry on...');
            this.show();
        }

        //start web server
        this.startWeb();


        if(!this.consoleData) console.log('Console display disabled, visit http://127.0.0.1:3000 to view stats.');


    };

    //====================== Core methods ======================

    this.quit = function () {
        console.log('Closing...');
        this.serial.close(function(){process.exit();});
    };

    this.exit = function () {
        //go to home screen
        this.goHome = true;
    };

    this.reboot = function () {
        //reboots arduino


    };

    this.resetLeds = function () {
        //tells arduino to power cycle the LED strip (for fixing stuck pixels)


    };

    this.booted = function () {
        //once the arduino has booted - configure hardware via SPI

    };

    this.spiRx = function () {
        //handle commands received from the arduino

    };

    this.debug = function (data) {
        if(this.webClients) {
            this.webIo.emit('debug', data);

        }

    };

    this.error = function (data) {
        if(this.webClients) {
            this.webIo.emit('error', data);

        }

    };

    this.startWeb = function () {

        this.webServer = http.createServer(function (request, response) {


            var filePath = pxltblApi.webRoot + request.url;
            if (filePath == pxltblApi.webRoot + '/')
                filePath = pxltblApi.webRoot + '/index.html';



            var extname = path.extname(filePath);
            var contentType = 'text/html';
            switch (extname) {
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

            fs.readFile(filePath, function(error, content) {
                if (error) {
                    if(error.code == 'ENOENT'){
                        fs.readFile('./404.html', function(error, content) {
                            response.writeHead(200, { 'Content-Type': contentType });
                            response.end(content, 'utf-8');
                        });
                    }
                    else {
                        response.writeHead(500);
                        response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                        response.end();
                    }
                }
                else {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                }
            });

        });



        this.webIo = require('socket.io')(this.webServer);
        this.webIo.on('connection', function(client){
            pxltblApi.webClients++;
            client.on('buttonDown', function(data){
                pxltblApi.buttonDown(data);
            });

            client.on('buttonUp', function(data){
                pxltblApi.buttonUp(data);
            });

            client.on('touchDown', function(data){
                pxltblApi.touchDown(data);
            });

            client.on('touchUp', function(data){
                pxltblApi.touchUp(data);
            });

            client.on('disconnect', function(){
                pxltblApi.webClients--;
            });
        });
        this.webServer.listen(3000);
    };

    this.setButtonByName = function(name,value) {

    };

    this.setButton = function(channel,value) {
        switch (channel) {
            case 22:
                if(this.rotation == 0) this.buttons.leftTop = value;
                if(this.rotation == 90) this.buttons.bottomLeft = value;
                if(this.rotation == 180) this.buttons.rightBottom = value;
                if(this.rotation == 270) this.buttons.topRight = value;

                break;
            case 37:
                if(this.rotation == 0) this.buttons.topLeft = value;
                if(this.rotation == 90) this.buttons.leftBottom = value;
                if(this.rotation == 180) this.buttons.bottomRight = value;
                if(this.rotation == 270) this.buttons.rightTop = value;

                break;
            case 15:
                if(this.rotation == 0) this.buttons.topRight = value;
                if(this.rotation == 90) this.buttons.leftTop = value;
                if(this.rotation == 180) this.buttons.bottomLeft = value;
                if(this.rotation == 270) this.buttons.rightBottom = value;

                break;
            case 13:
                if(this.rotation == 0) this.buttons.rightTop = value;
                if(this.rotation == 90) this.buttons.topLeft = value;
                if(this.rotation == 180) this.buttons.leftBottom = value;
                if(this.rotation == 270) this.buttons.bottomRight = value;

                break;
            case 36:
                if(this.rotation == 0) this.buttons.rightBottom = value;
                if(this.rotation == 90) this.buttons.topRight = value;
                if(this.rotation == 180) this.buttons.leftTop = value;
                if(this.rotation == 270) this.buttons.bottomLeft = value;

                break;
            case 32:
                if(this.rotation == 0) this.buttons.bottomRight = value;
                if(this.rotation == 90) this.buttons.rightTop = value;
                if(this.rotation == 180) this.buttons.topLeft = value;
                if(this.rotation == 270) this.buttons.leftBottom = value;

                break;
            case 18:
                if(this.rotation == 0) this.buttons.bottomLeft = value;
                if(this.rotation == 90) this.buttons.rightBottom = value;
                if(this.rotation == 180) this.buttons.topRight = value;
                if(this.rotation == 270) this.buttons.leftTop = value;

                break;
            case 16:
                if(this.rotation == 0) this.buttons.leftBottom = value;
                if(this.rotation == 90) this.buttons.bottomRight = value;
                if(this.rotation == 180) this.buttons.rightTop = value;
                if(this.rotation == 270) this.buttons.topLeft = value;

                break;
            case 31:
                if(value) this.exit();
                break;
        }

        //set virtual buttons

        this.buttons.top = this.buttons.topLeft || this.buttons.topRight;
        this.buttons.bottom = this.buttons.bottomLeft || this.buttons.bottomRight;
        this.buttons.left = this.buttons.leftTop || this.buttons.leftBottom;
        this.buttons.right = this.buttons.rightTop || this.buttons.rightBottom;

        this.buttons.any = this.buttons.top || this.buttons.bottom || this.buttons.left || this.buttons.right;
    };

    this.buttonDown = function(channel) {
        pxltblApi.setButton(channel,true);

    };

    this.buttonUp = function(channel) {
        pxltblApi.setButton(channel,false);

    };


    //TODO - make these work with arrays (multi touch)
    this.touchDown = function(location) {
        this.touch[location] = true;
    };

    this.touchUp = function(location) {
        this.touch[location] = false;

    };

    this.getTouch = function() {
        var touches = [];
        for (var i = 0; i < this.pxlCount; i++) {
            if(this.touch[i]) {
                var x = i % this.pxlW;
                var y = Math.floor(i / this.pxlW);
                touches.push({ x: x, y: y });
            }
        }

        return touches;
    };

    this.clearInputs = function() {
        //stops button presses persisting between apps.
        for (var i = 0; i < this.pxlCount; i++) {
            this.touch[i] = false;
        }

        this.buttons = {
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

    this.keyPress = function (str, key) {
        //this logs console keyboard input for debugging
        if (key.ctrl && key.name === 'c') {
            pxltblApi.quit();
        }
    };


    this.show = function () {
        //pushes the buffer to the Arduino via UART.


        var serpantineBuffer = new Buffer(this.pxlCount * 3);

        //TODO - this assumes stripStart = 'TL'  - it needs to take this into account.


        if (this.stripSerpantine === true) {
            for (var y = 0; y < this.originalPxlH; y++) {
                if (y % 2) { //odd row
                    for (var x = 0; x < this.originalPxlW; x++) {
                        var i = y * this.originalPxlW + x;
                        var iReverse = y * this.originalPxlW + (this.originalPxlW - x) - 1;
                        serpantineBuffer[i * 3] = this.buffer[iReverse * 3] * (this.brightness / 255)*this.whiteBalance.r;
                        serpantineBuffer[i * 3 + 1] = this.buffer[iReverse * 3 + 1] * (this.brightness / 255)*this.whiteBalance.g;
                        serpantineBuffer[i * 3 + 2] = this.buffer[iReverse * 3 + 2] * (this.brightness / 255)*this.whiteBalance.b;
                    }
                } else { //even row
                    for (var x = 0; x < this.originalPxlW; x++) {
                        var i = y * this.originalPxlW + x;
                        serpantineBuffer[i * 3] = this.buffer[i * 3] * (this.brightness / 255)*this.whiteBalance.r;
                        serpantineBuffer[i * 3 + 1] = this.buffer[i * 3 + 1] * (this.brightness / 255)*this.whiteBalance.g;
                        serpantineBuffer[i * 3 + 2] = this.buffer[i * 3 + 2] * (this.brightness / 255)*this.whiteBalance.b;
                    }

                }
            }
        } else {
            serpantineBuffer = this.buffer;
            //todo add RGB => GRB conversion, brightness etc
        }
        
        
        //send to web
        if(this.webClients) {
            this.webIo.volatile.emit('leds', this.buffer);

        }

        try {
            //sent to serial
            if(this.isRasPi) {
                this.serial.write(Buffer.concat([this.frameStart, serpantineBuffer]), function () {
                    pxltblApi.loop();

                });
            } else {
                //TODO - for some reason you have to call the loop as a callback of some random function (fs). I've not figured out why yet :S
                fs.readdir('.', function(err, items) {
                    pxltblApi.loop();
                });

            }


        } catch (err) {
            //TODO - do something useful.  We only usually get errors when we are quitting anyway.
        }
    };

    this.test = function () {
        //performs a hardware test - TBC
        for (var i = 0; i < this.pxlCount; i++) {
            if (i % 10 == 1) {
                this.buffer[i * 3] = 0;
                this.buffer[i * 3 + 1] = 0;
                this.buffer[i * 3 + 2] = 255;
            } else {
                this.buffer[i * 3] = i;
                this.buffer[i * 3 + 1] = 50;
                this.buffer[i * 3 + 2] = 0;
            }

        }

    };


    //====================== Pixel methods ======================

    this.setRotation = function(angle) {
       if(angle === 0 || angle === 180) {
           this.rotation = angle;
           this.pxlW = this.originalPxlW;
           this.pxlH = this.originalPxlH;
       }

        if(angle === 90 || angle === 270) {
            this.rotation = angle;
            this.pxlW = this.originalPxlH;
            this.pxlH = this.originalPxlW;
        }

        this.blank();
    };


    this.blank = function (r, g, b) {
        //fills the entire screen with r,g,b
        for (var i = 0; i < this.pxlCount; i++) {
            this.buffer[i * 3] = r;
            this.buffer[i * 3 + 1] = g;
            this.buffer[i * 3 + 2] = b;
        }

    };

    this.setColor = function (r, g, b, a) {


        if(typeof r === 'object' && r.r !== undefined && r.g !== undefined && r.b !== undefined) {
            //have we been passed an object of RGB?
            a = r.a;
            b = r.b;
            g = r.g;
            r = r.r;
        } else if(typeof r === 'object' && r.h !== undefined && r.s !== undefined && r.l !== undefined) {
            //have we been passed an object of HSL?
            a = r.a;

            var hsl = this.hslToRgb(r.h,r.s,r.l);

            r = hsl[0];
            g = hsl[1];
            b = hsl[2];

        } else if(typeof r === 'object' && r.h !== undefined && r.s !== undefined && r.v !== undefined) {
            //have we been passed an object of HSV?
            a = r.a;

            var hsv = this.hsvToRgb(r.h,r.s,r.v);

            r = hsv[0];
            g = hsv[1];
            b = hsv[2];
        } else if(Array.isArray(r) && r[0] !== undefined && r[1] !== undefined && r[2] !== undefined) {
            //have we been passed an array?
            a = r[3];
            b = r[2];
            g = r[1];
            r = r[0];
        } else if(typeof r === 'string') {
            //have we been passed a hex string?
            //TODO - convert string to values
        }

        if(a === undefined) a = 1.0;

        this.colorR = Math.round(r);
        this.colorG = Math.round(g);
        this.colorB = Math.round(b);
        this.colorA = a;

    };

    this.setColorRgb = function (r, g, b, a) {
        this.setColor(r,g,b,a);

    };

    this.setColorHsl = function (h, s, l, a) {

        var hsl = {
            h: h,
            s: s,
            l: l,
            a: a
        };
        this.setColor(hsl);

    };

    this.setColorHsv = function (h, s, v, a) {

        var hsv = {
            h: h,
            s: s,
            l: v,
            a: a
        };
        this.setColor(hsv);

    };


    this.setPixel = function (inX, inY) {
        //set an individual pixel

        inX = Math.round(inX);
        inY = Math.round(inY);

        switch(this.rotation) {
            case 0:
                var x = inX;
                var y = inY;
                break;
            case 90:
                var x = this.pxlH - inY - 1;
                var y = inX;
                break;
            case 180:
                var x = this.pxlW - inX - 1;
                var y = this.pxlH - inY - 1;
                break;
            case 270:
                var x = inY;
                var y = this.pxlW - inX - 1;
                break;
        }

        if(x < 0 || y < 0 || x >= this.originalPxlW || y >= this.originalPxlH) return false;

        var pixel = y * this.originalPxlW + x;

        this.buffer[pixel * 3] = this.buffer[pixel * 3] * (1-this.colorA) + this.colorA*this.colorR;
        this.buffer[pixel * 3 + 1] = this.buffer[pixel * 3 + 1] * (1-this.colorA) + this.colorA*this.colorG;
        this.buffer[pixel * 3 + 2] = this.buffer[pixel * 3 + 2] * (1-this.colorA) + this.colorA*this.colorB;

    };

    this.fillBox = function (x,y,w,h) {

        x = Math.round(x);
        y = Math.round(y);
        w = Math.round(w);
        h = Math.round(h);

        for (var i = 0; i < h; i++) {
            for (var j = 0; j < w && j+x < this.originalPxlW; j++) {

                this.setPixel(x+j,y+i);
            }
        }


    };

    this.textBounds = function(text) {
        //TODO - instead of calling text, do something more efficient!
        return this.text(text,100,100);
    };

    this.text = function (text,x,y) {

        text = ''+text;
        x = Math.round(x);
        y = Math.round(y);

        var fontNemiah = [];


        fontNemiah[0x20] = [0x0,0x0,0x0,0x0,0x0];  //
        fontNemiah[0x21] = [0xBE];  // !
        fontNemiah[0x22] = [0x6];  // "
        fontNemiah[0x23] = [0x50,0xF8,0x50,0xF8,0x50];  // #
        fontNemiah[0x24] = [0x5C,0x54,0xFE,0x54,0x74];  // $
        fontNemiah[0x25] = [0x86,0x66,0x10,0xCC,0xC2];  // %
        fontNemiah[0x26] = [0xFD,0x95,0xFD,0x41,0xA1];  // &
        fontNemiah[0x27] = [0x6];  // '
        fontNemiah[0x28] = [0x38,0xC6];  // (
        fontNemiah[0x29] = [0xC6,0x38];  // )
        fontNemiah[0x2A] = [0xD6,0x38,0xFE,0x38,0xD6];  // *
        fontNemiah[0x2B] = [0x10,0x10,0x7C,0x10,0x10];  // +
        fontNemiah[0x2C] = [0x61];  // ,
        fontNemiah[0x2D] = [0x10,0x10,0x10,0x10];  // -
        fontNemiah[0x2E] = [0x80];  // .
        fontNemiah[0x2F] = [0xC1,0x39,0x7,0x1,0x1];  // /
        fontNemiah[0x30] = [0xFE,0x82,0x82,0x82,0xFE];  // 0
        fontNemiah[0x31] = [0xFE];  // 1
        fontNemiah[0x32] = [0xF2,0x92,0x92,0x92,0x9E];  // 2
        fontNemiah[0x33] = [0x92,0x92,0x92,0x92,0xFE];  // 3
        fontNemiah[0x34] = [0x1E,0x10,0x10,0x10,0xFE];  // 4
        fontNemiah[0x35] = [0x9E,0x92,0x92,0x92,0xF2];  // 5
        fontNemiah[0x36] = [0xFE,0x92,0x92,0x92,0xF2];  // 6
        fontNemiah[0x37] = [0x2,0x2,0x2,0x2,0xFE];  // 7
        fontNemiah[0x38] = [0xFE,0x92,0x92,0x92,0xFE];  // 8
        fontNemiah[0x39] = [0x1E,0x12,0x12,0x12,0xFE];  // 9
        fontNemiah[0x3A] = [0x50];  // :
        fontNemiah[0x3B] = [0xD0];  // ;
        fontNemiah[0x3C] = [0x10,0x28,0x44,0x82];  // <
        fontNemiah[0x3D] = [0x28,0x28,0x28,0x28,0x28];  // =
        fontNemiah[0x3E] = [0x82,0x44,0x28,0x10];  // >
        fontNemiah[0x3F] = [0x2,0x2,0xB2,0x12,0x1E];  // ?
        fontNemiah[0x40] = [0xFE,0x82,0xBA,0xA2,0xBE];  // @

        fontNemiah[0x41] = [0xFE,0x12,0x12,0x12,0xFE];  // A
        fontNemiah[0x42] = [0xFE,0x92,0x92,0x92,0x6C];  // B
        fontNemiah[0x43] = [0xFE,0x82,0x82,0x82,0x82];  // C
        fontNemiah[0x44] = [0xFE,0x82,0x82,0x82,0x7C];  // D
        fontNemiah[0x45] = [0xFE,0x92,0x92,0x92,0x92];  // E
        fontNemiah[0x46] = [0xFE,0x12,0x12,0x12,0x12];  // F
        fontNemiah[0x47] = [0xFE,0x82,0x92,0x92,0xF2];  // G
        fontNemiah[0x48] = [0xFE,0x10,0x10,0x10,0xFE];  // H
        fontNemiah[0x49] = [0x82,0x82,0xFE,0x82,0x82];  // I
        fontNemiah[0x4A] = [0x82,0x82,0xFE,0x2,0x2];  // J
        fontNemiah[0x4B] = [0xFE,0x10,0x28,0x44,0x82];  // K
        fontNemiah[0x4C] = [0xFE,0x80,0x80,0x80,0x80];  // L
        fontNemiah[0x4D] = [0xFE,0x2,0xFE,0x2,0xFE];  // M
        fontNemiah[0x4E] = [0xFE,0x8,0x10,0x20,0xFE];  // N
        fontNemiah[0x4F] = [0xFE,0x82,0x82,0x82,0xFE];  // O
        fontNemiah[0x50] = [0xFE,0x22,0x22,0x22,0x3E];  // P
        fontNemiah[0x51] = [0xFE,0x82,0xC2,0x82,0xFE];  // Q
        fontNemiah[0x52] = [0xFE,0x22,0x22,0x62,0xBE];  // R
        fontNemiah[0x53] = [0x9E,0x92,0x92,0x92,0xF2];  // S
        fontNemiah[0x54] = [0x2,0x2,0xFE,0x2,0x2];  // T
        fontNemiah[0x55] = [0xFE,0x80,0x80,0x80,0xFE];  // U
        fontNemiah[0x56] = [0xE,0x70,0x80,0x70,0xE];  // V
        fontNemiah[0x57] = [0xFE,0x80,0xFE,0x80,0xFE];  // W
        fontNemiah[0x58] = [0xC6,0x28,0x10,0x28,0xC6];  // X
        fontNemiah[0x59] = [0x3,0x5,0xF9,0x5,0x3];  // Y
        fontNemiah[0x5A] = [0xC2,0xA2,0x92,0x8A,0x86];  // Z

        fontNemiah[0x5B] = [0xFE,0x82];  // [
        fontNemiah[0x5C] = [0x6,0x38,0xC0];  // \
        fontNemiah[0x5D] = [0x82,0xFE];  // ]
        fontNemiah[0x5E] = [0x8,0x4,0x2,0x4,0x8];  // ^
        fontNemiah[0x5F] = [0x80,0x80,0x80,0x80,0x80];  // _
        fontNemiah[0x60] = [0x2,0x4];  // `

        fontNemiah[0x61] = [0xE8,0xA8,0xA8,0xA8,0xF8];  // a
        fontNemiah[0x62] = [0xFE,0x88,0x88,0x88,0xF8];  // b
        fontNemiah[0x63] = [0xF8,0x88,0x88,0x88,0x88];  // c
        fontNemiah[0x64] = [0xF8,0x88,0x88,0x88,0xFE];  // d
        fontNemiah[0x65] = [0xF8,0xA8,0xA8,0xA8,0xB8];  // e
        fontNemiah[0x66] = [0xFE,0xA,0xA,0x2];  // f
        fontNemiah[0x67] = [0xBF,0xA3,0xA3,0xA3,0xFF];  // g
        fontNemiah[0x68] = [0xFE,0x8,0x8,0x8,0xF8];  // h
        fontNemiah[0x69] = [0xFA];  // i
        fontNemiah[0x6A] = [0x80,0x80,0xFA];  // j
        fontNemiah[0x6B] = [0xFE,0x20,0x50,0x88];  // k
        fontNemiah[0x6C] = [0xFE];  // l
        fontNemiah[0x6D] = [0xF8,0x8,0xF8,0x8,0xF8];  // m
        fontNemiah[0x6E] = [0xF8,0x8,0x8,0x8,0xF8];  // n
        fontNemiah[0x6F] = [0xF8,0x88,0x88,0x88,0xF8];  // o
        fontNemiah[0x70] = [0xFF,0x23,0x23,0x23,0x3F];  // p
        fontNemiah[0x71] = [0x3F,0x23,0x23,0x23,0xFF];  // q
        fontNemiah[0x72] = [0xF8,0x8,0x8,0x8,0x8];  // r
        fontNemiah[0x73] = [0xB8,0xA8,0xA8,0xA8,0xE8];  // s
        fontNemiah[0x74] = [0xFE,0x88,0x88,0x80];  // t
        fontNemiah[0x75] = [0xF8,0x80,0x80,0x80,0xF8];  // u
        fontNemiah[0x76] = [0x18,0x60,0x80,0x60,0x18];  // v
        fontNemiah[0x77] = [0xF8,0x80,0xF8,0x80,0xF8];  // w
        fontNemiah[0x78] = [0x88,0x50,0x20,0x50,0x88];  // x
        fontNemiah[0x79] = [0xBF,0xA1,0xA1,0xA1,0xFF];  // y
        fontNemiah[0x7A] = [0x88,0xC8,0xA8,0x98,0x88];  // z

        fontNemiah[0x7B] = [0x10,0x6C,0x82];  // {
        fontNemiah[0x7C] = [0x7F];  // |
        fontNemiah[0x7D] = [0x82,0x6C,0x10];  // }
        fontNemiah[0x7E] = [0x4,0x2,0x4,0x2,0x0];  // ~
        fontNemiah[0xA0] = [0x0,0x0,0x0,0x0,0x0];  //  
        fontNemiah[0xA1] = [0xFA];  // ¡
        fontNemiah[0xA2] = [0x38,0x44,0xFE,0x44,0x44];  // ¢
        fontNemiah[0xA3] = [0x90,0xFC,0x92,0x92,0x84];  // £
        fontNemiah[0xA4] = [0xBA,0x44,0x44,0x44,0xBA];  // ¤
        fontNemiah[0xA5] = [0x2,0x54,0xF8,0x54,0x2];  // ¥
        fontNemiah[0xA6] = [0x0,0x0,0xEE,0x0,0x0];  // ¦
        fontNemiah[0xA7] = [0x0,0x14,0xAA,0xAA,0x50];  // §
        fontNemiah[0xA8] = [0x0,0x2,0x0,0x2];  // ¨
        fontNemiah[0xA9] = [0x7C,0xBA,0xC6,0xC6,0x7C];  // ©
        fontNemiah[0xAA] = [0xBA,0xAA,0xBE];  // ª
        fontNemiah[0xAB] = [0x20,0x50,0xA8,0x50,0x88];  // «
        fontNemiah[0xAC] = [0x10,0x10,0x10,0x30];  // ¬
        fontNemiah[0xAD] = [0x10,0x10,0x10];  // ­
        fontNemiah[0xAE] = [0x7D,0xFB,0x97,0xEB,0x7D];  // ®
        fontNemiah[0xAF] = [0x2,0x2,0x2];  // ¯


        var cursor = 0;
        var biggestY = 0;

        for (var i = 0; i < text.length; i++) {

            //console.log(text.charCodeAt(i));
            //console.log(text.charAt(i));

            var character = fontNemiah[text.charCodeAt(i)];
            var len = character.length;


            for (var col = 0;  col < len; col++) {
                var column = character[col];


                var bit = 0;
                var lower = 0;
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

        return {w: cursor-1, h:biggestY};
    };


    //====================== Audio methods ======================

    //TODO - to reduce latency, these sounds need to be created during initialisation and stored in memory as buffers. For now lets just try doing it all on the fly.




    this.playWav = function (fileName,loop) {


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

    this.beep = function (freq, duration, waveform) {
        //plays a sound

    };


    //====================== Loop ======================

    this.loop = function () {


        //the main loop

        var curTime = new Date().getTime();
        this.frameTime = curTime - this.lastLoopTime;

        while (this.fpsLimit > 0 && this.frameTime < Math.floor(1000 / this.fpsLimit)) {
            curTime = new Date().getTime();
            this.frameTime = curTime - this.lastLoopTime;
        }

        this.millis = curTime - this.startTime;

        this.frames++;
        this.lastLoopTime = new Date().getTime();

        //update the console every 500ms
        if (curTime - this.lastStatsTime > 500) {

            this.fps = Math.floor(this.frames * 1000 / (curTime - this.lastStatsTime));
            this.lastStatsTime = curTime;
            this.frames = 0;

            var minFrameTime = Math.round(1000 / this.fpsLimit);

            if(this.consoleData) {
                console.clear();
                console.log('Is RasPi: ' + this.isRasPi);
                console.log('Web Clients: ' + this.webClients);
                console.log('Millis: ' + this.millis);
                console.log('Game FPS: ' + this.fps);
                console.log('FPS limit: ' + this.fpsLimit);
                console.log('Frame time: ' + this.frameTime);
                console.log('Min frame time: ' + minFrameTime);
                console.log('Num of pixels: ' + this.buffer.length);
            }

            //this.dump();

            //send to web
            if(this.webClients) {
                this.webIo.emit('frameData', {
                    webClients: this.webClients,
                    millis: this.millis,
                    fps: + this.fps,
                    fpsLimit: this.fpsLimit,
                    frameTime: this.frameTime,
                    minFrameTime: minFrameTime,
                    length: this.buffer.length,
                    pxlW: this.originalPxlW,
                    pxlH: this.originalPxlH,
                    rotation: this.rotation
                });
            }


        }


        //run the external loop function - this is where all the user code is
        this.cbLoop(this);


        //update display and start again
        if (!this.paused) this.show();

    };

    //====================== Color conversion ====================

    /**
     * Converts an RGB color value to HSL. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes r, g, and b are contained in the set [0, 255] and
     * returns h, s, and l in the set [0, 1].
     *
     * @param   Number  r       The red color value
     * @param   Number  g       The green color value
     * @param   Number  b       The blue color value
     * @return  Array           The HSL representation
     */
    this.rgbToHsl = function(r, g, b) {
        r /= 255, g /= 255, b /= 255;

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return [ Math.round(360*h), Math.round(255*s), Math.round(255*l) ];
    };

    /**
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes h, s, and l are contained in the set [0, 1] and
     * returns r, g, and b in the set [0, 255].
     *
     * @param   Number  h       The hue
     * @param   Number  s       The saturation
     * @param   Number  l       The lightness
     * @return  Array           The RGB representation
     */
    this.hslToRgb = function(h, s, l) {
        var r, g, b;

        h/=360;
        s/=255;
        l/=255;

        if (s == 0) {
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

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [ Math.round(r * 255), Math.round(g * 255), Math.round(b * 255) ];
    };

    /**
     * Converts an RGB color value to HSV. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
     * Assumes r, g, and b are contained in the set [0, 255] and
     * returns h, s, and v in the set [0, 1].
     *
     * @param   Number  r       The red color value
     * @param   Number  g       The green color value
     * @param   Number  b       The blue color value
     * @return  Array           The HSV representation
     */
    this.rgbToHsv = function(r, g, b) {
        r /= 255, g /= 255, b /= 255;

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, v = max;

        var d = max - min;
        s = max == 0 ? 0 : d / max;

        if (max == min) {
            h = 0; // achromatic
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return [ Math.round(360*h), Math.round(255*s), Math.round(255*v) ];
    };

    /**
     * Converts an HSV color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
     * Assumes h, s, and v are contained in the set [0, 1] and
     * returns r, g, and b in the set [0, 255].
     *
     * @param   Number  h       The hue
     * @param   Number  s       The saturation
     * @param   Number  v       The value
     * @return  Array           The RGB representation
     */
    this.hsvToRgb = function(h, s, v) {
        var r, g, b;

        h/=360;
        s/=255;
        v/=255;

        var i = Math.floor(h * 6);
        var f = h * 6 - i;
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }

        return [ Math.round(r * 255), Math.round(g * 255), Math.round(b * 255) ];
    };

    //====================== Helper methods ======================

    this.dump = function () {
        //dumps the buffer to the console
        var str = '';
        for (var i = 0; i < this.pxlCount * 3; i++) {
            str += this.buffer[i].toString(16).padStart(2, '0');
            if (i % 3 == 2) str += ' '; //end of RGB
            if (i % (this.pxlW * 3) == (this.pxlW * 3) - 1) str += '\n';  //end of row
        }

        console.log(str);
    };

    this.limit = function(val,min,max) {
        return Math.max(Math.min(val,max),min);
    }

};

module.exports = pxltblApi;

