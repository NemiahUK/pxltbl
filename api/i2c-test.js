const raspi = require('raspi');
const I2C = require('raspi-i2c').I2C;

const pxlW = 23;
const pxlH = 11;

const pxlCount = pxlW*pxlH;

const frameStart = new Buffer([0x01]);



raspi.init(() => {
    const i2c = new I2C();


    var buffer = new Buffer(pxlCount * 3);
    for (var i = 0; i < pxlCount; i++) {
        if(i % 23 == 0) {
            buffer[i*3] = 0;
            buffer[i*3+1] = 0;
            buffer[i*3+2] = 100;
        } else {
            buffer[i*3] = i;
            buffer[i*3+1] = 50;
            buffer[i*3+2] = 0;
        }

    }

    buffer = new Buffer.concat([frameStart,buffer]);
    //buffer = new Buffer.from('hello')

    i2c.write(0x4, buffer);

    console.log(buffer);


});