const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;
const readline = require('readline');



//these consts need moving to the api class


const frameStart = new Buffer([0x01]);

const baud = 1000000;

const stripStart = 'TL';  //can be TL, TR, BL, BR
const stripZigZag = true;




var pxltblApi = new function() {




    //these should probably be public
    this.frameTime = 0;
    this.millis = 0;
    this.frames = 0;
    this.fps = 0;
    this.paused = false;


    //options
    this.fpsLimit = 0;
    this.pxlW = 23;
    this.pxlH = 11;

    this.pxlCount = this.pxlW*this.pxlH;


    //callback functions
    this.cbLoop;
    this.cbButton;

    //these should probably be private
    this.serial;
    this.buffer = new Buffer((this.pxlCount * 3));


    this.startTime = new Date().getTime();
    this.lastLoopTime = this.startTime;
    this.lastStatsTime = this.startTime;


    this.construct = function (fpsLimit, cbLoop, cbButton) {

        //setup callbacks
        this.cbLoop = cbLoop;
        this.cbButton = cbButton;

        //setup options
        //TODO - This needs to be an options object
        this.fpsLimit = fpsLimit;


        //start keyboard input
        readline.emitKeypressEvents(process.stdin);
        process.stdin.setRawMode(true);

        process.stdin.on('keypress', this.keyPress);

        //start serial
        this.serial = new Serial({
            portId: '/dev/ttyS0',
            baudRate: baud
        });

        this.serial.open(() => {
            console.log('pxltbl booting...DONE');
            this.blank(0, 0, 0);
            this.show();
        })

        //setup SPI Rx events
        //TODO - here we need functions to handle SPI commands recieved form the arduino, such as 'booted', 'button press', 'etc'


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


        if (stripZigZag === true) {
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


        this.serial.write(Buffer.concat([frameStart, serpantineBuffer]), function () {
            pxltblApi.loop();

        });
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


    this.setPixel = function (x, y, r, g, b) {
        //set an individual pixel
        var pixel = y * this.pxlW + x;

        this.buffer[pixel * 3] = r;
        this.buffer[pixel * 3 + 1] = g;
        this.buffer[pixel * 3 + 2] = b;

    };


    //====================== Audio methods ======================

    //TODO - to reduce latency, these sounds need to be created during initialisation and stored in memory as buffers. For now lets just try doing it all on the fly.

    this.playWav = function () {
        //plays a wav file

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

};

module.exports = pxltblApi;

