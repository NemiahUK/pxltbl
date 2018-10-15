

const raspi = require('raspi');
const Serial = require('raspi-serial').Serial;

const pxlW = 23;
const pxlH = 11;

const pxlCount = pxlW*pxlH;







 
raspi.init(() => {

  var serial = new Serial({
    portId: '/dev/ttyS0', 
    baudRate: 1000000
  });
  

  serial.open(() => {

    

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

    
        serial.write(Buffer.concat([new Buffer([0x01]),buffer]));

    

  });
});

