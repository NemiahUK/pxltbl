var HID = require('node-hid');
var devices = HID.devices();


console.log(devices);




const raspi = require('raspi');

let colorR = 255;
let colorG = 0;
let colorB = 255;
let colorA = 1;

let fpsLimit = 30;
let consoleData = true;

let rotation = 0;
let brightness = 255;
let whiteBalance = {
    r: 1.0,
    g: 0.9,
    b: 0.5
};


//these should be gotten from the firmware or overridden for no-pi emulation
let originalPxlW = 32;
let originalPxlH = 18;
let strandLength = 96;
let baud = 1000000;
let stripSerpantine = false;
let stripStart = 'TL';  //can be TL, TR, BL, BR

//derived
let pxlW = originalPxlW;
let pxlH = originalPxlH;
let pxlCount = pxlW*pxlH;


let serial;
let serialPath = '/dev/ttyS0';
let buffer = new Buffer((strandLength*8) * 3);  //add empty buffer for future use. This will be table border and RGB buttons. Also makes total divisible by 8 for Teensy Octo
let frameStart = Buffer.from([0x1, 0x2]);


let startTime = new Date().getTime();
let lastLoopTime = startTime;
let lastStatsTime = startTime;
let readCount = 0;

let touch = new Array(pxlCount);
let hidPath = '/dev/hidraw1';
let touchMaxX = 32767;
let touchMaxY = 32767;
let touchTLpixelX = 903;
let touchTLpixelY = 1713;
let touchBRpixelX = 31652;
let touchBRpixelY = 31710;

const pixelWidth = (touchBRpixelX - touchTLpixelX) / (pxlW-1);
const pixelHeight = (touchBRpixelY - touchTLpixelY) / (pxlH-1);
const pixelStartX = touchTLpixelX - (pixelWidth/2);
const pixelStartY = touchTLpixelY - (pixelHeight/2);

const touchPanel = new HID.HID(hidPath);

let bgCol = 15;

raspi.init(() => {

    console.log('Raspberry Pi detected, booting...');

    const Serial = require('raspi-serial').Serial;
    const gpio = require('rpi-gpio');



    //start serial
    serial = new Serial({
        portId: serialPath,
        baudRate: baud
    });

    serial.open(() => {
        console.log('pxltbl booting...DONE');

        //setup HID touch
        touchPanel.setNonBlocking(false);
        touchPanel.on('data',readTouch);
    });





});


function show() {
    //pushes the buffer to the Arduino via UART.

    blank(0, 0, 0);
    for (let i = 0; i < touch.length; i++) {
        if(touch[i]) buffer[i*3] = 255;
    }

    var serpantineBuffer = new Buffer(pxlCount * 3);


    for (var i = 0; i < pxlCount; i++) {
        serpantineBuffer[i * 3] = (buffer[i * 3] * (brightness / 255) * whiteBalance.r);
        serpantineBuffer[i * 3 + 1] = (buffer[i * 3 + 1] * (brightness / 255) * whiteBalance.g);
        serpantineBuffer[i * 3 + 2] = (buffer[i * 3 + 2] * (brightness / 255) * whiteBalance.b);
    }

    //remove 1s form serpantine buffer
    for (var i = 0; i < serpantineBuffer.length; i++) {
        if(serpantineBuffer[i] === 1) serpantineBuffer[i] = 0;
    }




    serial.write(Buffer.concat([frameStart, serpantineBuffer]), function () {
        alreadyReading = false;
    });




}

function blank(r, g, b) {
    //fills the entire screen with r,g,b
    for (var i = 0; i < pxlCount; i++) {
        buffer[i * 3] = r;
        buffer[i * 3 + 1] = g;
        buffer[i * 3 + 2] = b;
    }

}

function setPixel(inX, inY) {
    //set an individual pixel

    inX = Math.round(inX);
    inY = Math.round(inY);

    switch(rotation) {
        case 0:
            var x = inX;
            var y = inY;
            break;
        case 90:
            var x = pxlH - inY - 1;
            var y = inX;
            break;
        case 180:
            var x = pxlW - inX - 1;
            var y = pxlH - inY - 1;
            break;
        case 270:
            var x = inY;
            var y = pxlW - inX - 1;
            break;
    }

    if(x < 0 || y < 0 || x >= originalPxlW || y >= originalPxlH) return false;

    var pixel = y * originalPxlW + x;

    buffer[pixel * 3] = buffer[pixel * 3] * (1-colorA) + colorA*colorR;
    buffer[pixel * 3 + 1] = buffer[pixel * 3 + 1] * (1-colorA) + colorA*colorG;
    buffer[pixel * 3 + 2] = buffer[pixel * 3 + 2] * (1-colorA) + colorA*colorB;

}


function showPoints() {

    //console.log(touch);
}

let alreadyReading = false;
function readTouch(data) {


    if (alreadyReading) return;
    alreadyReading = true;
    //console.clear();



        touch = Array(pxlCount);


        let hasTouched = false;

        for (let point = 0; point < 10; point++) {
            if (data[1 + point * 10] === 7) {
                const thisPoint = data.slice(point*10 + 2, point*10 + 11);
                //console.log(thisPoint);
                const touchX = thisPoint[0] | (thisPoint[1] << 8);
                const touchY = thisPoint[2] | (thisPoint[3] << 8);
                //workout which pixel is being touched...


                const pixelX = Math.floor((touchX - pixelStartX)/pixelWidth);
                const pixelY = Math.floor((touchY - pixelStartY)/pixelHeight);

                if(pixelX >= 0 && pixelX < pxlW && pixelY >= 0 && pixelY < pxlH) touch[pixelX+pixelY*pxlW] = true;

                hasTouched = true;

            }
        }
        let now = new Date().getTime();
        if(hasTouched) {
            console.log(readCount +' '+ (now - lastLoopTime) +'ms'+' '+ (now - startTime) +'ms');
            readCount++;
        } else {
            readCount = 0;
            startTime = new Date().getTime();
        }
        lastLoopTime = new Date().getTime();

        show();

}