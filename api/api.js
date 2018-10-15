const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;
const readline = require('readline');
const fs = require('fs');
const wav = require('wav');
const Speaker = require('speaker');





//these consts need moving to the api class







var pxltblApi = new function() {




    //these should probably be public
    this.frameTime = 0;
    this.millis = 0;
    this.frames = 0;
    this.fps = 0;
    this.paused = false;

    this.colorR = 255;
    this.colorG = 255;
    this.colorB = 255;
    this.colorA = 1;


    //options - these are the defaults, ovverridden by options object
    this.fpsLimit = 30;
    this.pxlW = 23;
    this.pxlH = 11;
    this.stripSerpantine = true;
    this.stripStart = 'TL';  //can be TL, TR, BL, BR
    this.pxlCount = this.pxlW*this.pxlH;
    this.baud = 1000000;
    this.frameStart = new Buffer([0x01]);


    //callback functions
    this.cbLoop;
    this.cbButton;

    //these should probably be private
    this.serial;
    this.buffer = new Buffer((this.pxlCount * 3));


    this.startTime = new Date().getTime();
    this.lastLoopTime = this.startTime;
    this.lastStatsTime = this.startTime;







    this.start = function (options) {

        //setup callbacks
        this.cbLoop = options.callbackLoop;
        this.cbButton = options.callbackButton;

        //setup options

        if(options.fpsLimit !== undefined) this.fpsLimit = parseInt(options.fpsLimit);


        //wait for RasPi to be ready
        raspi.init(() => {




            //start keyboard input
            readline.emitKeypressEvents(process.stdin);
            process.stdin.setRawMode(true);

            process.stdin.on('keypress', pxltblApi.keyPress);


            //start serial
            pxltblApi.serial = new Serial({
                portId: '/dev/ttyS0',
                baudRate: pxltblApi.baud
            });

            pxltblApi.serial.open(() => {
                console.log('pxltbl booting...DONE');
                pxltblApi.blank(0, 0, 0);
                pxltblApi.show();
            })

            //setup SPI Rx events
            //TODO - here we need functions to handle SPI commands recieved form the arduino, such as 'booted', 'button press', 'etc'

        });

    };

    //====================== Core methods ======================

    this.quit = function () {
        console.log('Closing...');
        this.serial.close(function(){process.exit();});
    };

    this.reboot = function () {
        //reboots arduino


    };

    this.booted = function () {
        //once the arduino has booted - configure hardware via SPI

    };

    this.spiRx = function () {
        //handle commands received from the arduino

    };

    this.keyPress = function (str, key) {
        //this logs console keyboard input for debugging
        if (key.ctrl && key.name === 'c') {
            pxltblApi.quit();

        } else {
            //console.log(key);
            switch (key.name) {
                case 'p':
                    pxltblApi.paused = true;
                    break;
                case 'up':
                    pxltblApi.cbButton('up');
                    break;
                case 'down':
                    pxltblApi.cbButton('down');
                    break;
                case 'left':
                    pxltblApi.cbButton('left');
                    break;
                case 'right':
                    pxltblApi.cbButton('right');
                    break;
                case 'space':
                    pxltblApi.cbButton('fire');
                    break;

            }
        }
    };


    this.show = function () {
        //pushes the buffer to the Arduino via UART.


        var serpantineBuffer = new Buffer(this.pxlCount * 3);

        //TODO - this assumes stripStart = 'TL'  - it needs to take this into account.


        if (this.stripSerpantine === true) {
            for (var y = 0; y < this.pxlH; y++) {
                if (y % 2) { //odd row
                    for (var x = 0; x < this.pxlW; x++) {
                        var i = y * this.pxlW + x;
                        var iReverse = y * this.pxlW + (this.pxlW - x) - 1;
                        serpantineBuffer[i * 3 + 1] = this.buffer[iReverse * 3];
                        serpantineBuffer[i * 3] = this.buffer[iReverse * 3 + 1];
                        serpantineBuffer[i * 3 + 2] = this.buffer[iReverse * 3 + 2];
                    }
                } else { //even row
                    for (var x = 0; x < this.pxlW; x++) {
                        var i = y * this.pxlW + x;
                        serpantineBuffer[i * 3 + 1] = this.buffer[i * 3];
                        serpantineBuffer[i * 3] = this.buffer[i * 3 + 1];
                        serpantineBuffer[i * 3 + 2] = this.buffer[i * 3 + 2];
                    }

                }
            }
        } else {
            serpantineBuffer = this.buffer;
            //todo add RGB => GRB conversion
        }

        try {
            this.serial.write(Buffer.concat([this.frameStart, serpantineBuffer]), function () {
                pxltblApi.loop();

            });
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

    this.blank = function (r, g, b) {
        //fills the entire screen with r,g,b
        for (var i = 0; i < this.pxlCount; i++) {
            this.buffer[i * 3] = r;
            this.buffer[i * 3 + 1] = g;
            this.buffer[i * 3 + 2] = b;
        }

    };

    this.setColor = function (r, g, b, a) {
        if(a === undefined) a = 1.0;
        this.colorR = r;
        this.colorG = g;
        this.colorB = b;
        this.colorA = a;

    }

    this.setPixel = function (x, y) {
        //set an individual pixel
        if(x < 0 || y < 0 || x >= this.pxlW || y >= this.pxlH) return false;

        var pixel = y * this.pxlW + x;

        this.buffer[pixel * 3] = this.buffer[pixel * 3] * (1-this.colorA) + this.colorA*this.colorR;
        this.buffer[pixel * 3 + 1] = this.buffer[pixel * 3 + 1] * (1-this.colorA) + this.colorA*this.colorG;
        this.buffer[pixel * 3 + 2] = this.buffer[pixel * 3 + 2] * (1-this.colorA) + this.colorA*this.colorB;

    };

    this.fillBox = function (x,y,w,h) {


      for (var i = 0; i < h; i++) {
          for (var j = 0; j < w && j+x < this.pxlW; j++) {

              this.setPixel(x+j,y+i);
          }
      }


    };

    this.text = function (text,x,y) {



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
        fontNemiah[0x38] = [0xFF,0x93,0x93,0x93,0xFF];  // 8
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

        for (var i = 0; i < text.length; i++) {

            //console.log(text.charCodeAt(i));
            //console.log(text.charAt(i));

            var character = fontNemiah[text.charCodeAt(i)];
            var len = character.length;


            for (var col = 0;  col < len; col++) {
                var column = character[col];
                //for now lets reverse the bits

                var bit = 0;
                var lower = 0;
                while (bit < 8) {
                    if(bit == 0 && column & 0x01) {
                        //lower the whole letter but dont set any pixels
                        lower = 2;
                    } else {

                        if (column & 0x01) {

                            this.setPixel(x + cursor, (bit - 1 + y) +  lower);
                        }
                    }

                    bit++;
                    column = column >> 1;
                }
                cursor++;
            }
            cursor++;
        }


    };


    //====================== Audio methods ======================

    //TODO - to reduce latency, these sounds need to be created during initialisation and stored in memory as buffers. For now lets just try doing it all on the fly.

    this.playWav = function () {
        var file = fs.createReadStream('wav/sqr-400-100.wav');
        var reader = new wav.Reader();

        // the "format" event gets emitted at the end of the WAVE header
        reader.on('format', function (format) {

            // the WAVE header is stripped from the output of the reader
            reader.pipe(new Speaker(format));
        });

        // pipe the WAVE file to the Reader instance
        file.pipe(reader);





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

            console.clear();
            console.log('Status: ' + this.paused);
            console.log('Millis: ' + this.millis);
            console.log('Game FPS: ' + this.fps);
            console.log('FPS limit: ' + this.fpsLimit);
            console.log('Frame time: ' + this.frameTime);
            console.log('Min frame time: ' + 1000 / this.fpsLimit);
            console.log('Num of pixels: ' + this.buffer.length);

            this.dump();


        }


        //run the external loop function - this is where all the user code is
        this.cbLoop(this);


        //update display and start again
        if (!this.paused) this.show();


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

